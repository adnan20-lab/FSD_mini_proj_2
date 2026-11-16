# Heatwave Decision Model — CES-HW-RULES-v1.0

## 1. Purpose and scope

The climate intelligence engine converts a persisted manual meteorological observation and its monitoring-zone / region context into a deterministic, explainable heatwave alert and a set of illustrative civic planning actions.

This model is intentionally rule-based. The same saved observation, zone baseline and region terrain always produce the same alert status and rule identifiers, assuming the same model configuration. This makes the engine straightforward to explain during a laboratory viva, test with JUnit, and audit after the fact.

**Safety and validity statement:** CES-HW-RULES-v1.0 is an academic decision-support prototype. It is not an official IMD model, is not a certified Heat Index implementation, and is not a substitute for official bulletins or guidance from the India Meteorological Department, disaster-management authorities, occupational safety authorities or public-health agencies. All thresholds and derived planning outputs require calibration and validation before any operational use.

## 2. Inputs

| Input | Source | Role |
|---|---|---|
| Maximum ambient temperature (`Tmax`) | Manual observation | Main daytime heat measurement; threshold tests |
| Minimum / nighttime temperature (`Tmin`) | Manual observation | Warm-night / nighttime recovery assessment |
| Relative humidity (`RH`) | Manual observation | Simplified apparent-temperature amplification |
| Wind speed | Manual observation | Retained in the input snapshot for context and future calibration; not a current alert trigger |
| Consecutive hot days | Manual observation | Multi-day persistence and critical-zone emergency trigger |
| UV index | Optional manual observation | Scales illustrative outdoor restriction duration |
| Historical normal maximum temperature | Monitoring zone | Baseline for temperature departure |
| Terrain type | Parent region | Selects the prototype threshold |
| Land-use type | Monitoring zone | Contributes to illustrative restriction and grid-demand estimates |
| Vulnerability level | Monitoring zone | Contributes to emergency persistence logic and planning output scaling |
| Population | Monitoring zone | Contributes to illustrative grid-demand estimate |
| Cooling infrastructure | Monitoring zone | Adds context-specific public-health action where dedicated cooling is limited |

The engine is invoked only after the observation has been saved. It loads the saved observation by ID, then loads the linked zone and region from MongoDB. It does not accept unsaved form data from the browser.

## 3. Baseline parameters

### 3.1 Terrain thresholds

These prototype maximum-temperature thresholds are configured centrally in `application.yml` and surfaced by `GET /api/model/config`.

| Terrain | Threshold |
|---|---:|
| Plains | 40.0°C |
| Coastal | 37.0°C |
| Hilly | 30.0°C |

These are demonstration parameters aligned with the project brief, not a statement of official IMD criteria. They require regional calibration.

### 3.2 Severity thresholds

| Parameter | Prototype value |
|---|---:|
| Severe absolute maximum temperature | 45.0°C |
| Severe terrain exceedance | Terrain threshold + 6.0°C |
| Severe Heat Index | 50.0°C |
| Warning departure from baseline | 4.5°C |
| Warning Heat Index | 44.0°C |
| Watch proximity to terrain threshold | Within 2.0°C |
| Watch departure interval | 2.5°C to 4.4°C |
| Watch Heat Index interval | 38.0°C to 43.9°C |
| Warm-night marker | Tmin ≥ 28.0°C |
| Critical persistence emergency | Tmin ≥ 30.0°C and ≥ 3 consecutive hot days in a Critical zone |

All values are configurable through the `heatwave.model` section of `backend/src/main/resources/application.yml`.

## 4. Derived metrics

### 4.1 Temperature departure from normal

\[
\Delta T = T_{max} - T_{baseline}
\]

A positive departure means the recorded maximum is above the zone's stored historical normal maximum temperature. The advisory stores the value and the baseline used for its calculation.

### 4.2 Simplified apparent temperature / Heat Index estimate

For this academic prototype, the backend uses a deterministic humidity-heat amplification formula rather than claiming to implement the complete official Heat Index method:

\[
HI = T_{max} + \max(0, RH-40)\times0.10 + \max(0,T_{max}-27)\times0.32
\]

when \(T_{max}\geq 27^\circ C\). For \(T_{max}<27^\circ C\), the estimate is set to \(T_{max}\).

The formula is intentionally transparent and simple. It is not a certified Rothfusz / Steadman / IMD computation. It should be replaced or calibrated using an authoritative method before real deployment.

### 4.3 Warm-night / nighttime recovery flag

`warmNightConcern = (Tmin >= 28.0°C)`.

A warm night flags reduced overnight cooling in the zone. For a Critical vulnerability zone, the emergency persistence rule specifically requires \(Tmin\geq30.0^\circ C\) and at least three consecutive hot days.

## 5. Decision rules and priority

Before classification, the engine checks that `Tmax`, `Tmin`, `RH`, wind speed, consecutive-hot-day count and zone baseline are present and within the supported input bounds. It also validates the optional UV index when supplied, rejects a future observation timestamp, and checks `Tmin <= Tmax`. Missing or inconsistent persisted measurements return `REVIEW_REQUIRED`; invalid values are not silently coerced into a normal alert.

Rules are evaluated in this priority order. The first matching tier determines the alert status:

1. **REVIEW_REQUIRED** — missing or conflicting required data.
2. **SEVERE_HEATWAVE_EMERGENCY** — any of:
   - `Tmax >= 45.0°C`; or
   - `Tmax >= terrainThreshold + 6.0°C`; or
   - `HeatIndex >= 50.0°C`; or
   - vulnerability is `CRITICAL`, `Tmin >= 30.0°C` and consecutive hot days `>= 3`.
3. **HEATWAVE_WARNING** — either:
   - `Tmax >= terrainThreshold` and (`departure >= 4.5°C` or consecutive hot days `>= 2`); or
   - `HeatIndex >= 44.0°C`.
4. **HEAT_WATCH_CAUTION** — any of:
   - `Tmax >= terrainThreshold - 2.0°C`; or
   - departure is between `2.5°C` and `4.4°C`; or
   - Heat Index is between `38.0°C` and `43.9°C`.
5. **NORMAL_CONDITIONS** — none of the watch / warning / emergency rules matched.

The severe and warning rules override lower-severity matches. The `appliedRules` list retains the identifiers that actually matched so the final explanation can be inspected and unit-tested.

## 6. Illustrative operational planning estimates

These values are advisory-planning examples only. They are not occupational safety prescriptions, emergency instructions, utility forecasts, or certified engineering estimates.

### 6.1 Vulnerability and land-use weights

Vulnerability weight:

| Level | Weight |
|---|---:|
| Low | 0 |
| Moderate | 1 |
| High | 2 |
| Critical | 3 |

Land-use weight:

| Land use | Weight |
|---|---:|
| High-density urban | 1.0 |
| Industrial belt | 1.0 |
| Semi-urban | 0.5 |
| Rural agricultural | 0.3 |
| Green / peri-urban | 0.0 |

### 6.2 Outdoor restriction hours

For Watch, Warning and Severe states, the prototype computes:

\[
R = round(clamp(2 + \max(0,HI-38)\times0.30 + V\times0.45 + L\times0.35 + UV\times0.08, 2, 6))
\]

where `V` is the vulnerability weight, `L` the land-use weight, and `UV` is zero when no UV index is supplied. The suggested peak exposure window is 11:00 AM–4:00 PM. For Normal conditions, restriction hours are zero. For Review Required, no confident duration is generated.

### 6.3 Cooling-centre operating hours

\[
C = round(clamp(3 + \max(0,\Delta T)\times0.65 + N + V, 3, 16))
\]

where `N = 2` if `Tmin >= 28°C`, otherwise `0`, and `V` is the vulnerability weight. Normal conditions return zero; Review Required returns no confident duration.

### 6.4 Illustrative grid-demand surge index

\[
G = clamp(\max(0,\Delta T)\times3 + \max(0,HI-38)\times1.5 + W + 2L + 2P/100000, 0, 75)
\]

where `W = 10` for a warm night and `0` otherwise, `L` is the land-use weight, and `P` is the estimated zone population. The result is displayed as a percentage-like planning index; it is **not** a real utility load forecast.

### 6.5 Next evaluation time

The prototype suggests the following re-evaluation interval measured from advisory generation time (not from the observation timestamp). A delayed review of an older manual observation therefore does not create an already-expired next-review time:

| Alert | Interval |
|---|---:|
| Severe Emergency | 6 hours |
| Warning | 12 hours |
| Watch / Caution | 24 hours |
| Normal | 48 hours |
| Review Required | Not calculated |

The interval is a scheduling suggestion only.

## 7. Example scenarios

All examples are synthetic, for teaching and testing. Results below use the configured formula and thresholds.

| Outcome | Terrain | Tmax | Tmin | RH | Baseline | Departure | Approx. HI | Why |
|---|---|---:|---:|---:|---:|---:|---:|---|
| Severe Emergency | Plains | 46.0°C | 31.0°C | 55% | 37.5°C | +8.5°C | 53.58°C | Exceeds 45°C, terrain + 6°C and HI 50°C |
| Warning | Plains | 42.5°C | 28.0°C | 45% | 37.5°C | +5.0°C | 47.96°C | Plains threshold reached and departure ≥ 4.5°C; below severe cut-offs |
| Watch / Caution | Coastal | 35.0°C | 27.0°C | 68% | 32.5°C | +2.5°C | 40.36°C | Within 2°C of 37°C terrain threshold, departure and HI also in watch range |
| Normal | Coastal | 31.8°C | 22.0°C | 50% | 33.0°C | −1.2°C | 34.34°C | Below watch proximity, anomaly and Heat Index bands |
| Review Required | Plains | 35.0°C | 38.0°C | 50% | 33.0°C | Not evaluated | Not evaluated | Minimum temperature exceeds maximum temperature |

## 8. Historical persistence and auditability

Every generated advisory stores:

- observation ID and observation timestamp;
- zone ID, region ID and zone / region name snapshots;
- raw measurement snapshot, baseline, vulnerability, land-use and population values used;
- calculated Heat Index, temperature departure and terrain threshold;
- alert status, reasoning, applied rule identifiers and sector-specific actions;
- planning estimates, next evaluation time and model version;
- `PENDING_ACK` / `ACKNOWLEDGED` review state and acknowledgement metadata.

Generating a second advisory creates another document. It does not overwrite the first. Updating the source observation or zone does not mutate historical snapshots. The application blocks deleting observations that already have linked advisories and blocks deleting zones that still have observation or advisory history.

## 9. Sector action generation

The engine returns three action groups: **Public Health**, **Outdoor Labor**, and **Water & Power Grid**. The actions become progressively stronger from Watch to Warning and Severe. Review Required emits verification actions only. If a zone uses `STANDARD_GRID_ONLY` cooling infrastructure during an active alert, the public-health actions include a note to identify temporary shaded spaces.

These are example prompts for a classroom demonstration and require review by domain authorities.

## 10. Unit-test coverage

`HeatwaveDecisionEngineTest` covers:

- Severe Emergency from extreme absolute temperature;
- Warning from terrain threshold and significant departure;
- Watch from proximity to terrain threshold;
- Normal when metrics remain below watch levels;
- Review Required on missing or out-of-range stored data;
- severe-priority override;
- critical-zone multi-day warm-night persistence;
- simplified Heat Index calculation; and
- next-review timestamp measured from advisory generation time.

`RegionServiceConflictTest` separately verifies that a region with linked monitoring zones cannot be deleted.

## 11. Known limitations and real-world calibration

- Manual observations can be incomplete, incorrectly entered or temporally inconsistent.
- The current prototype uses one persisted observation and a user-entered consecutive-hot-days count; it does not reconstruct hot-day persistence from a validated daily station series.
- The apparent-temperature formula is simplified and not a certified Heat Index implementation.
- Terrain parameters are coarse; actual heat-wave criteria can depend on region, season, climatological normals and other official definitions.
- Land use, vulnerability and cooling infrastructure are categorical approximations; actual exposure is spatially heterogeneous.
- The grid-demand and cooling hours estimates do not use utility telemetry, building energy models, real occupancy or calibrated load profiles.

Before real-world deployment, a qualified team should:

1. Obtain quality-controlled station observations and long-term local climatological normals, with IMD / authoritative meteorological review.
2. Evaluate threshold performance by terrain, season and location using historical heat events, false-positive / false-negative analysis and out-of-sample validation.
3. Select or implement a validated Heat Index / apparent-temperature method and document its valid operating range.
4. Validate health risk tiers with epidemiological outcomes and health authorities, and validate worker-protection actions with occupational safety experts.
5. Calibrate cooling and grid-demand estimates against actual facility operations, utility demand profiles, population distributions and field measurements.
6. Establish governance for data quality, uncertainty, versioned thresholds, expert review, escalation, communications and audit records.

Until those steps are completed, use this portal only as an educational demonstration with synthetic or supervised sample data.

