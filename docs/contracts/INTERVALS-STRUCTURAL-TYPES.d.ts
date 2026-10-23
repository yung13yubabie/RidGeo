/** Structural subset of official Activity + ActivityStream, not a replacement for their model. */
export interface OfficialActivity {
  id?: string; icu_athlete_id?: string; source?: string; type?: string; name?: string;
  start_date?: string | null; start_date_local?: string; timezone?: string | null; stream_types?: string[] | null; elapsed_time?: number | null; moving_time?: number | null;
  distance?: number | null; race?: boolean; sub_type?: string; device_name?: string;
  icu_ignore_time?: boolean; ignore_pace?: boolean; recording_stops?: number[] | null;
}
export interface OfficialStream {
  type: string; data?: (number | boolean | null)[] | null; data2?: (number | null)[] | null;
  valueTypeIsArray?: boolean; allNull?: boolean; anomalies?: unknown[];
}
export type Classification = 'race' | 'benchmark' | 'easy' | 'unclassified';
export interface SelectionEntry { choiceId: string; classification?: Classification }
export interface SelectionRequest { selections: SelectionEntry[] }
export interface QualityReason { code: string; severity: 'info' | 'warning' | 'error'; blocksFitness: boolean; index?: number; count?: number; stream?: string }
export interface RoutePoint { lat: number; lon: number; ele: number | null }
export interface NormalizedSample {
  /** Official seconds since start, never an array index. */
  elapsedS: number; distanceM: number; lat: number | null; lon: number | null;
  ele: number | null; moving: boolean | null;
}
/** Missing/undefined and explicit null are distinct. Invalid values are never copied. */
export type ObservationState = 'omitted' | 'null' | 'invalid' | 'valid';
export interface HistorySourceObservations {
  schemaVersion: 'intervals-history-source-observations-v1'; provider: 'Intervals.icu';
  officialSummaryDistance: {
    state: ObservationState; valueM: number | null; source: 'Activity.distance';
    invalidReason: 'not_finite_number' | 'out_of_bounds' | null;
  };
  recordingStops: {
    state: ObservationState; raw: number[] | null; source: 'Activity.recording_stops';
    /** Bounded finite numbers only; no interpretation as times, durations or locations. */
    interpretation: 'uninterpreted'; invalidReason: 'not_numeric_list' | 'too_many_values' | 'not_finite_number' | null;
  };
  /** This normalizer has no explicit known-stop evidence input. Unknown never becomes zero. */
  knownStops: null;
  /** Claimed source identity only. Not a choiceId, content identity, owner check or fetch authorization. */
  identity: { provider: 'Intervals.icu'; activityId: string | null; verification: 'not_verified_by_normalizer' };
}
export interface NormalizedActivity {
  schemaVersion: 'intervals-history-v1'; status: 'usable' | 'limited' | 'rejected';
  metadata: { name: string | null; sport: string | null; startDateLocal: string | null;
    classification: Classification; elapsedTimeS: number | null; movingTimeS: number | null;
    /** Elapsed minus moving summary only; never evidence of known stops. */
    pauseTimeS: number | null };
  provenance: { provider: 'Intervals.icu'; upstreamSource: string | null; known: boolean; supported: boolean; rightsGuarantee: false };
  quality: QualityReason[]; samples: NormalizedSample[];
  /** Matches GPX Point field names/segment grouping. Not yet constructed as the Python Route. */
  path: { format: 'route-points-v1'; segments: RoutePoint[][]; pointCount: number } | null;
  eligibility: { routeGeometry: boolean; historicalPerformance: boolean; fitnessCoefficient: false };
  /** Additive, independently versioned observations; no fitness/calibration readiness claim. */
  sourceObservations: HistorySourceObservations;
}
export interface ProviderFieldObservation {
  state: ObservationState; value: string | number | boolean | null; invalidType?: string;
}
export type SummaryObservationField = 'start_date' | 'start_date_local' | 'timezone' | 'elapsed_time' |
  'moving_time' | 'icu_ignore_time' | 'ignore_pace' | 'race' | 'sub_type';
export interface ProviderSummaryObservations {
  schemaVersion: 'intervals-provider-summary-observations-v1'; source: 'selected_activity_detail_before';
  fields: Record<SummaryObservationField, ProviderFieldObservation>;
}
export interface CoverageAssessment {
  timeState: 'unknown' | 'complete_exact_endpoints' | 'partial_or_conflicting';
  elapsedSummaryS: number | null; firstObservedElapsedS: number | null; lastObservedElapsedS: number | null;
  missingHeadS: number | null; missingTailS: number | null; temporalBlockingCodes: string[];
  wholeRouteTimeScopeConfirmed: false;
  routeState: 'unavailable' | 'single_recorded_segment' | 'disconnected_recorded_segments';
  intervalState: 'known_observed_recorded_span' | 'unknown'; firstUtc: string | null; lastUtc: string | null;
  intervalBasis: 'Activity.start_date plus observed first/last time samples, at supported microsecond precision';
  /** Only the carried recording endpoints and temporal diagnostics; not whole-route/effort proof. */
  fullActivityIntervalVerified: boolean; movingTimeInferred: false; cpRestInferred: false;
}
export interface BodyIdentity { sha256: string; bytes: number; readOrder: number }
export interface ObservedProviderSnapshot {
  schemaVersion: 'intervals-observed-snapshot-v1'; atomicRevisionVerified: false;
  provenanceBasis: 'trusted_server_owned_selected_GETs'; relevantDetailUnchanged: true;
  detailBefore: BodyIdentity; streams: BodyIdentity; detailAfter: BodyIdentity;
  streamEditDetection: 'Unchanged detail does not detect every edit to stream content.';
}
export interface ProviderActivity extends NormalizedActivity {
  choiceId: string; choiceAliases: string[];
  /** Stable event key does not contain session/grant epochs. */
  providerIdentity: { provider: 'Intervals.icu'; accountNamespace: string; activityId: string };
  classificationEvidence: { originalClassification: Classification; selectedClassification: Classification;
    classificationSource: 'upstream' | 'explicit_user_confirmation'; highEffortReferenceConfirmed: false;
    wholeRouteTimeScopeConfirmed: false };
  sourceSummaryObservations: ProviderSummaryObservations; coverage: CoverageAssessment;
  providerReferenceEligibility: { structurallyComplete: boolean; qualification: 'not_evaluated'; performanceModelReady: false };
  observedSnapshot: ObservedProviderSnapshot;
}
export interface SelectedSetAssessment {
  schemaVersion: 'intervals-selected-set-assessment-v1'; uniqueActivityCount: number;
  structuralMultipleReferenceEligibility: boolean;
  reasons: { code: 'record_not_structurally_complete' | 'recorded_intervals_overlap'; occurrenceIndices: number[] }[];
  unknownIntervalOccurrences: number[]; qualification: 'not_evaluated'; performanceModelReady: false;
  abilityCoefficient: null; individualNormalizationPreserved: true;
}
export interface SelectionListResult {
  schemaVersion: 'intervals-history-selection-v1'; complete: true; completeQueryTraversal: true;
  /** Describes visible summaries in this bounded traversal, not account/full-stream availability. */
  availabilityState: 'accessible_entries' | 'empty_complete_window' | 'inaccessible_only' | 'accessible_and_inaccessible';
  noInaccessibleStubsObserved: boolean; selectionExpiresAt: string;
  entries: { choiceId: string | null; name: string | null; sport: string | null; startDateLocal: string;
    source: string | null; selectable: boolean; unavailableReason: string | null; classification: Classification;
    distanceM: number | null; elapsedTimeS: number | null }[];
  quality: { duplicateActivities: number; inaccessibleStubs: number };
  aggregation: 'individual-activities-only'; rightsGuarantee: false;
  resources: { upstreamBytes: number; maxListAggregateBytes: number; maxRetainedChoiceBytes: number; maxRetainedChoiceNodes: number };
}
export interface ImportResult {
  schemaVersion: 'intervals-history-import-v2'; mode: 'single' | 'multiple'; activities: ProviderActivity[];
  suppliedSelectionCount: number; uniqueActivityCount: number;
  aggregation: 'individual-activities-only'; abilityCoefficient: null; selectionAssessment: SelectedSetAssessment;
  accessBinding: { accountNamespace: string; grantEpoch: number; sourcePolicyRevision: string;
    verification: 'trusted_server_session_resolver'; normalizedClientDocumentsAccepted: false };
  resources: { upstreamBytes: number; originalSamples: number; attemptedGETs: number; maxGETAttempts: number;
    maxNormalizedBytes: number; maxNormalizedNodes: number };
  integrationStatus: 'normalized-only-gpx-core-not-connected';
}
/** Only the real hosting session/OAuth integration may supply this object server-side.
 * The adapter never reads a frontend bearer token as its Intervals credential.
 * The handler snapshots these fields before awaiting upstream data. */
export interface VerifiedServerSession {
  principalId: string; sessionId: string; athleteId: string; authorization: string; scopes: string[];
  /** Stable authenticated provider-account namespace; never a display name or client value. */
  accountNamespace: string;
  /** Nonnegative safe integer changed by the host on relevant grant/access revision. */
  grantEpoch: number;
}
export interface ReviewedSourcePolicy { zeppTransientPersonalUseReviewed: true; policyRevision: string }
