/** Display/input adapter only. Never mutates the Terra store, draft, GPX or core geometry. */
export function canonicalLongitude(longitude) {
  if (!Number.isFinite(longitude)) throw new TypeError('Longitude must be finite.');
  if (longitude >= -180 && longitude <= 180) return longitude;
  const wrapped = ((longitude + 180) % 360 + 360) % 360 - 180;
  return wrapped === -180 && longitude > 0 ? 180 : wrapped;
}
export function nearestWorldLongitude(longitude, reference) {
  if (!Number.isFinite(longitude) || !Number.isFinite(reference)) throw new TypeError('Longitude must be finite.');
  return longitude + 360 * Math.round((reference - longitude) / 360);
}
export function unwrapLineForDisplay(coordinates) {
  if (!Array.isArray(coordinates)) throw new TypeError('Coordinates must be an array.');
  const output = [];
  for (let i = 0; i < coordinates.length; i++) {
    const point = coordinates[i];
    if (!Object.hasOwn(coordinates,i) || !Array.isArray(point) || point.length !== 2 || !Number.isFinite(point[0]) || !Number.isFinite(point[1])) throw new TypeError('Coordinates must be dense finite pairs.');
    let longitude = point[0];
    if (i && Math.abs(longitude - output[i-1][0]) > 180) longitude = nearestWorldLongitude(longitude, output[i-1][0]);
    output.push([longitude, point[1]]);
  }
  return output;
}
export function copyFeatureForDisplay(feature) {
  const copied = structuredClone(feature);
  if (copied.geometry?.type === 'LineString') copied.geometry.coordinates = unwrapLineForDisplay(copied.geometry.coordinates);
  return copied;
}

/** Uses only public MapLibre and Terra adapter methods; keeps original feature IDs. */
export function createWrappedMapLibreAdapter({Adapter, map, ...options}) {
  let reference = null, listening = false;
  const resetReference = () => { reference = null; };
  class WrappedAdapter extends Adapter {
    project(longitude, latitude) {
      const anchor = reference ?? map.getCenter().lng;
      const {x,y} = map.project({lng:nearestWorldLongitude(longitude,anchor),lat:latitude});
      return {x,y};
    }
    unproject(x,y) {
      const {lng,lat} = map.unproject({x,y});
      return {lng:canonicalLongitude(lng),lat};
    }
    getLngLatFromEvent(event) {
      const {left,top} = map.getContainer().getBoundingClientRect();
      const {lng,lat} = map.unproject({x:event.clientX-left,y:event.clientY-top});
      reference = lng; // Anchor hit testing to the exact world copy under the pointer.
      return {lng:canonicalLongitude(lng),lat};
    }
    render(changes,styling) {
      const copied = {...changes};
      for(const key of ['created','updated','unchanged']) copied[key]=changes[key].map(copyFeatureForDisplay);
      copied.deletedIds=[...changes.deletedIds];
      super.render(copied,styling);
    }
    register(callbacks) {
      super.register(callbacks);
      if(!listening){map.on('move',resetReference);listening=true;}
    }
    unregister() {
      if(listening){map.off('move',resetReference);listening=false;}
      reference=null;
      super.unregister();
    }
  }
  return new WrappedAdapter({map,...options});
}
