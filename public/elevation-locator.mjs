/** Read-only missing-height locations over the existing original GPX profile. */
export const ELEVATION_PAGE_SIZE = 25;
const abortError = () => Object.assign(new Error('Elevation location scan cancelled'), {name:'AbortError'});
const cursorError = () => new Error('Elevation location cursor belongs to another source/session');

export function createElevationLocator(details, {
  now = () => performance.now(),
  yieldTask = () => new Promise(resolve => setTimeout(resolve, 0)),
  budgetMs = 4,
} = {}) {
  const hash = details?.source?.route_sha256;
  const segments = details?.raw_profile_segments;
  if (typeof hash !== 'string' || !hash || !Array.isArray(segments) || segments.length > 2000 ||
      segments.reduce((n,s) => n + (s.points?.length ?? 50001), 0) > 50000)
    throw new Error('Original profile unavailable or exceeds existing limits');
  let disposed = false;
  const cursors = new WeakSet();
  const makeCursor = (segment_index, point_index, offset_m, ordinal) => {
    const cursor = Object.freeze({route_sha256:hash,segment_index,point_index,offset_m,ordinal});
    cursors.add(cursor);return cursor;
  };
  const check = signal => {if(disposed || signal?.aborted)throw abortError();};
  function scheduler(signal) {
    let start=now(),count=0;
    return () => {
      check(signal);
      if(++count%128 !== 0 || now()-start < budgetMs)return null;
      return Promise.resolve(yieldTask()).then(()=>{check(signal);start=now();});
    };
  }
  function record(si,first,end,offset) {
    const points=segments[si].points,last=end-1,left=Math.max(0,first-1),right=Math.min(points.length-1,end);
    const anchor=i=>({segment_index:si,segment_point_index:i,source_point_index:points[i].source_point_index,
      lat:points[i].lat,lon:points[i].lon,elevation_m:points[i].ele,raw_horizontal_m:points[i].horizontal_m});
    const dx=points[right].horizontal_m-points[left].horizontal_m;
    const dz=first>0&&end<points.length?points[right].ele-points[left].ele:null;
    return {route_sha256:hash,segment_index:si,segment_point_range:[first,last],
      source_point_range:[points[first].source_point_index,points[last].source_point_index],
      raw_horizontal_range_m:[points[first].horizontal_m,points[last].horizontal_m],
      profile_horizontal_range_m:[offset+points[first].horizontal_m,offset+points[last].horizontal_m],
      affected_profile_horizontal_range_m:[offset+points[left].horizontal_m,offset+points[right].horizontal_m],
      start_coordinate:[points[first].lat,points[first].lon],end_coordinate:[points[last].lat,points[last].lon],
      missing_points:end-first,affected_edge_point_range:[left,right],affected_horizontal_m:dx,
      vertical_difference_m:null,known_anchor_vertical_difference_m:dz,
      left_anchor:first>0?anchor(first-1):null,right_anchor:end<points.length?anchor(end):null,
      anchor_horizontal_m:dz===null?null:dx,
      left_anchor_to_first_missing_horizontal_m:first>0?points[first].horizontal_m-points[left].horizontal_m:null,
      last_missing_to_right_anchor_horizontal_m:end<points.length?points[right].horizontal_m-points[last].horizontal_m:null,
      endpoint_missing:first===0||end===points.length};
  }
  async function scan({cursor=null,signal,summary=false}={}) {
    check(signal);
    if(cursor!==null && (!cursors.has(cursor)||cursor.route_sha256!==hash))throw cursorError();
    let si=cursor?.segment_index??0,i=cursor?.point_index??0,offset=cursor?.offset_m??0;
    let totalRuns=0,totalMissing=0;const rows=[],pause=scheduler(signal);
    for(;si<segments.length;si++) {
      const points=segments[si].points;
      while(i<points.length) {
        const pending=pause();if(pending)await pending;
        if(points[i].ele!==null){i++;continue;}
        const first=i;
        // A next cursor points at the first missing point, not a rounded distance.
        if(!summary && rows.length===ELEVATION_PAGE_SIZE)
          return {route_sha256:hash,rows,next:makeCursor(si,i,offset,(cursor?.ordinal??0)+rows.length),first_ordinal:(cursor?.ordinal??0)+1};
        do {i++;const pending=pause();if(pending)await pending;} while(i<points.length&&points[i].ele===null);
        totalRuns++;totalMissing+=i-first;
        if(!summary)rows.push(record(si,first,i,offset));
      }
      offset+=points.at(-1)?.horizontal_m||0;i=0;
    }
    check(signal);
    return summary?{route_sha256:hash,total_runs:totalRuns,missing_points:totalMissing,complete:true}:
      {route_sha256:hash,rows,next:null,first_ordinal:(cursor?.ordinal??0)+1};
  }
  return Object.freeze({route_sha256:hash,summarize:({signal}={})=>scan({signal,summary:true}),
    page:(cursor=null,{signal}={})=>scan({cursor,signal}),dispose:()=>{disposed=true;}});
}
