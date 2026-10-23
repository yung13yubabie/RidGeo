/** Model identity and owner-facing provenance. No pacing arithmetic in JavaScript. */
export const HIKING_ALLOCATION='campbell2022-hiking-reference-v1';
export const HIKING_MODEL='campbell2022-hiking-reference-goal-v1';
const SOURCE='https://doi.org/10.1016/j.compenvurbsys.2022.101866';
const gradeLimit=Math.tan(Math.PI/6);
const fail=()=>{throw Object.assign(new Error('徒步參考模型、同意或路線依據不一致，請重新計算。'),{code:'invalid_hiking_reference'});};
export function hikingReferenceProvenance(plan){
 if(plan?.model_version!==HIKING_MODEL){if(plan?.input?.allocation_model===HIKING_ALLOCATION||plan?.reference_basis?.allocation_model===HIKING_ALLOCATION)fail();return null;}
 const basis=plan.reference_basis,registry=plan.model_registry;
 if(plan.input?.allocation_model!==HIKING_ALLOCATION||plan.input.hiking_consent!==true||basis?.allocation_model!==HIKING_ALLOCATION||basis.user_selected!==true||basis.on_trail_hiking_confirmed!==true||basis.reference_total_is_finish_prediction!==false||!Number.isFinite(basis.reference_moving_s)||basis.reference_moving_s<=0||basis.source_route_sha256!==plan.route?.route_sha256||basis.geometry_sha256!==plan.route?.geometry_sha256||basis.geometry_version!==plan.geometry_version||registry?.model_version!==HIKING_MODEL||registry.source!==SOURCE||registry.rate_unit!=='horizontal_m/s'||registry.weight_unit!=='s'||registry.calibration_status!=='not_calibrated'||plan.ability_prediction!=='not_implemented')fail();
 if(!Array.isArray(plan.geometry_snapshot)||!plan.geometry_snapshot.length||plan.geometry_snapshot.some(c=>typeof c.grade!=='number'||!Number.isFinite(c.grade)||Math.abs(c.grade)>gradeLimit||!Number.isFinite(c.horizontal_m)||c.horizontal_m<=0)||!Array.isArray(plan.canonical_timeline)||plan.canonical_timeline.length!==plan.geometry_snapshot.length||plan.canonical_timeline.some(c=>c.mode!=='hiking_reference_scenario'))fail();
 return {model_registry:registry,reference_basis:basis,assumptions:plan.assumptions,source_route_sha256:plan.route.route_sha256,geometry_sha256:plan.route.geometry_sha256};
}
