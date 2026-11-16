# REST API reference

Base URL: `http://localhost:8080/api`  
Content type: `application/json`  
All IDs are MongoDB string IDs. Except for the health and authentication endpoints, requests require `Authorization: Bearer <JWT>`. The backend returns structured errors with `timestamp`, `status`, `error`, `message`, and optional `fieldErrors`.

## Authentication

| Method | Path | Description | Access |
|---|---|---|---|
| POST | `/auth/register` | Register an operator account and return a JWT | Public |
| POST | `/auth/login` | Verify credentials and return a JWT | Public |

Registration and login body:

```json
{ "username": "field.operator", "password": "UseAUniquePassword123" }
```

The response contains `accessToken`, `tokenType` (`Bearer`), `expiresInSeconds`, and the user's username and roles. Public registration always assigns the `OPERATOR` role. An administrator can be bootstrapped through `APP_ADMIN_USERNAME` and `APP_ADMIN_PASSWORD` environment variables; it is not possible to self-assign the administrator role through registration. Passwords are BCrypt-hashed.

For Swagger UI, open `http://localhost:8080/swagger-ui.html`, call the login endpoint, copy `accessToken`, select **Authorize**, and paste the token. The OpenAPI JSON document is available at `/v3/api-docs`.

## System

| Method | Path | Description | Access |
|---|---|---|---|
| GET | `/health` | Application and MongoDB connectivity | Public |
| GET | `/model/config` | Active model version, thresholds and formula description | Authenticated |

`GET /health` example:

```json
{
  "applicationStatus": "UP",
  "mongodbStatus": "CONNECTED",
  "checkedAt": "2026-10-31T10:00:00Z"
}
```

## Dashboard and reports

All dashboard and report endpoints require an authenticated user.

| Method | Path | Query parameters | Description |
|---|---|---|---|
| GET | `/dashboard/summary` | — | Counts, recent observations/advisories, latest zone summaries, severity distribution |
| GET | `/reports/summary` | `zoneId` (optional) | Region- and zone-level risk summaries, high-alert zones, observations, advisories and severity counts |

The report response includes `regionRiskSummaries` (per-region zone totals, high/critical vulnerability counts, current warning/emergency counts, severity breakdown and zones without an advisory), `zoneRiskSummaries`, `highAlertZones`, observations, advisories and `severityDistribution`. When `zoneId` is supplied, the zone-level and observation/advisory results are restricted to that zone; the region-level aggregate continues to show all zones belonging to the selected zone's parent region.

## Regions

Read operations require authentication. Create, update and delete operations require the `ADMIN` role.

| Method | Path | Description |
|---|---|---|
| GET | `/regions?q={query}` | List/search regions by name, state or nodal officer |
| GET | `/regions/{id}` | Region detail |
| POST | `/regions` | Create region; returns 201 |
| PUT | `/regions/{id}` | Update region |
| DELETE | `/regions/{id}` | Delete region; returns 409 if linked zones still exist |
| GET | `/regions/{id}/zones` | List zones under region |

Create-region body:

```json
{
  "name": "Vidarbha Plains Authority",
  "nodalOfficer": "Dr. Meera Kulkarni",
  "emergencyContact": "+91 712 555 0101",
  "state": "Maharashtra",
  "terrainType": "PLAINS",
  "notes": "Inland plains demonstration region"
}
```

Allowed `terrainType`: `PLAINS`, `COASTAL`, `HILLY`.

## Monitoring zones

Read operations require authentication. Create, update and delete operations require the `ADMIN` role.

| Method | Path | Query parameters | Description |
|---|---|---|---|
| GET | `/zones` | `regionId`, `landUseType`, `vulnerabilityLevel`, `alertStatus` | List/filter zones; each response includes the latest observation and latest advisory |
| GET | `/zones/{id}` | — | Zone detail with latest observation/advisory |
| POST | `/zones` | — | Create monitoring zone; returns 201 |
| PUT | `/zones/{id}` | — | Update monitoring zone |
| DELETE | `/zones/{id}` | — | Delete zone; returns 409 while observation/advisory history exists |

Create-zone body:

```json
{
  "name": "Nagpur Central Ward",
  "regionId": "<existing-region-id>",
  "estimatedPopulation": 185000,
  "areaSqKm": 12.4,
  "landUseType": "HIGH_DENSITY_URBAN",
  "vulnerabilityLevel": "CRITICAL",
  "baselineMaxTemperature": 37.5,
  "coolingInfrastructure": "PUBLIC_COOLING_CENTERS",
  "notes": "Dense urban core and outdoor commuter activity"
}
```

Allowed `landUseType`: `HIGH_DENSITY_URBAN`, `INDUSTRIAL_BELT`, `SEMI_URBAN`, `RURAL_AGRICULTURAL`, `GREEN_PERI_URBAN`.  
Allowed `vulnerabilityLevel`: `LOW`, `MODERATE`, `HIGH`, `CRITICAL`.  
Allowed `coolingInfrastructure`: `PUBLIC_COOLING_CENTERS`, `SHADED_TRANSIT_HUBS`, `MIST_STATIONS`, `STANDARD_GRID_ONLY`.

## Meteorological observations

All operations require an authenticated user (`OPERATOR` or `ADMIN`).

| Method | Path | Query parameters | Description |
|---|---|---|---|
| GET | `/observations` | `zoneId` (optional) | Chronological observation list |
| GET | `/observations/{id}` | — | Observation detail |
| POST | `/observations` | — | Save manual observation; returns 201 |
| PUT | `/observations/{id}` | — | Update observation; does not rewrite any existing advisory snapshot |
| DELETE | `/observations/{id}` | — | Delete observation; returns 409 when an advisory references it |

Create-observation body:

```json
{
  "zoneId": "<existing-zone-id>",
  "observedAt": "2026-10-30T09:30:00Z",
  "maxTemperature": 42.5,
  "minTemperature": 28.0,
  "relativeHumidity": 45,
  "windSpeedKmh": 9,
  "consecutiveHotDays": 2,
  "uvIndex": 8,
  "solarRadiationNotes": "Clear sky, high solar load",
  "fieldNotes": "Manual field entry"
}
```

Validation includes maximum temperature −10°C to 60°C, minimum temperature −15°C to 60°C and not greater than maximum, relative humidity 0–100%, wind speed 0–200 km/h, hot days integer 0–90, UV 0–15, existing zone and non-future timestamp.

## Heatwave advisories

All operations require an authenticated user (`OPERATOR` or `ADMIN`).

| Method | Path | Query parameters | Description |
|---|---|---|---|
| POST | `/advisories/generate` | — | Generate and persist a new advisory from an existing observation ID; returns 201 |
| GET | `/advisories` | `zoneId`, `alertStatus`, `acknowledged`, `from`, `to` | List/filter advisory history |
| GET | `/advisories/{id}` | — | Full advisory detail |
| PATCH | `/advisories/{id}/acknowledge?acknowledgedBy=...` | optional `acknowledgedBy` | Mark administrative review complete |

Generate request:

```json
{ "observationId": "<persisted-observation-id>" }
```

The five alert statuses are `SEVERE_HEATWAVE_EMERGENCY`, `HEATWAVE_WARNING`, `HEAT_WATCH_CAUTION`, `NORMAL_CONDITIONS`, and `REVIEW_REQUIRED`. Acknowledgement states are `PENDING_ACK` and `ACKNOWLEDGED`.

The generation endpoint does not accept raw meteorological measurements. It loads the already-persisted observation, zone and region from MongoDB, evaluates the decision engine, and stores a new advisory document. Repeated requests create distinct history rows.

## Example cURL flow

```bash
# Register an operator account
curl -X POST http://localhost:8080/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"field.operator","password":"UseAUniquePassword123"}'

# Login and copy the accessToken from the response
curl -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"field.operator","password":"UseAUniquePassword123"}'

# Call a protected endpoint (replace <TOKEN>)
curl http://localhost:8080/api/zones \
  -H 'Authorization: Bearer <TOKEN>'
```

The examples below that access protected resources also need the Bearer header.

```bash
# Check health
curl http://localhost:8080/api/health

# Read seeded zones
curl http://localhost:8080/api/zones

# Read recent observations
curl http://localhost:8080/api/observations

# Generate using a persisted ID (replace the placeholder)
curl -X POST http://localhost:8080/api/advisories/generate \
  -H 'Content-Type: application/json' \
  -d '{"observationId":"<persisted-observation-id>"}'

# Read advisory history
curl http://localhost:8080/api/advisories
```

## HTTP status behavior

- `200 OK`: successful read or update.
- `201 Created`: successful region, zone, observation or advisory creation.
- `204 No Content`: successful deletion.
- `400 Bad Request`: invalid body, enum or validation rule.
- `401 Unauthorized`: missing, expired or invalid JWT / invalid login credentials.
- `403 Forbidden`: valid operator token attempts an administrator-only region or zone write operation.
- `404 Not Found`: requested resource does not exist.
- `409 Conflict`: deletion would break a parent-child or audit relationship.
- `500 Internal Server Error`: unexpected server error; stack traces and internal credentials are not returned to the API client.
