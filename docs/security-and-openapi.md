# Authentication, Authorization and API Documentation

This project uses Spring Security with stateless JWT bearer authentication. Passwords are stored as BCrypt hashes in MongoDB; raw passwords and the JWT signing key are not stored in the database.

## Accounts and roles

| Role | Permissions |
|---|---|
| `OPERATOR` | Read regions and zones; create, read, update and delete observations where allowed; generate and review advisories; view dashboard and reports. |
| `ADMIN` | All operator capabilities, plus create, update and delete regions and monitoring zones. |

Public registration creates `OPERATOR` accounts only. It never accepts a role field from the client. An administrator is optionally created from `APP_ADMIN_USERNAME` and `APP_ADMIN_PASSWORD` during backend startup. If the configured username already exists, the initializer leaves that account unchanged; it does not promote an existing operator.

## Environment variables

| Variable | Required | Default / rule |
|---|---|---|
| `JWT_SECRET` | Yes | At least 32 UTF-8 bytes. Keep the value private and stable between backend restarts if existing tokens should remain valid. |
| `JWT_EXPIRATION_MINUTES` | No | `120` minutes. |
| `APP_ADMIN_USERNAME` | Only when bootstrapping admin | Username for the initial administrator. |
| `APP_ADMIN_PASSWORD` | Only when bootstrapping admin | At least 10 characters. |
| `MONGODB_URI` | No | `mongodb://localhost:27017/heatwave_advisory_db` |

### Windows PowerShell setup

Generate and store a private development key once in the current Windows user environment. Do not place the generated value in Git, README files, screenshots or source code.

```powershell
$bytes = New-Object byte[] 32
$rng = [Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$secret = [Convert]::ToBase64String($bytes)
[Environment]::SetEnvironmentVariable("JWT_SECRET", $secret, "User")
$env:JWT_SECRET = $secret
$rng.Dispose()
```

Before the first backend startup, set the bootstrap administrator details in the same terminal:

```powershell
$env:APP_ADMIN_USERNAME = "admin"
$env:APP_ADMIN_PASSWORD = "UseYourOwnUniquePassword123"
cd backend
.\mvnw.cmd spring-boot:run
```

For later terminals, load the same saved JWT key and start the backend:

```powershell
$env:JWT_SECRET = [Environment]::GetEnvironmentVariable("JWT_SECRET", "User")
cd backend
.\mvnw.cmd spring-boot:run
```

If this is an already-populated database and an account named `admin` was previously registered as an `OPERATOR`, choose a different bootstrap administrator username. The bootstrap initializer deliberately does not change existing roles.

## Authentication API

### Register an operator

`POST /api/auth/register`

```json
{
  "username": "field.operator",
  "password": "UseAUniquePassword123"
}
```

Returns HTTP `201 Created` with an access token and the created user details. Usernames must be 4–32 characters; passwords must be 10–72 characters.

### Sign in

`POST /api/auth/login`

```json
{
  "username": "field.operator",
  "password": "UseAUniquePassword123"
}
```

Returns HTTP `200 OK` with this response shape:

```json
{
  "accessToken": "<signed-jwt>",
  "tokenType": "Bearer",
  "expiresInSeconds": 7200,
  "user": {
    "username": "field.operator",
    "roles": ["OPERATOR"]
  }
}
```

Do not copy real access tokens into a report or commit them to GitHub.

## Calling secured APIs

Include the access token in the HTTP Authorization header:

```http
Authorization: Bearer <accessToken>
```

The React API helper attaches the token automatically after login. When the backend responds with `401 Unauthorized` for a protected request, the frontend clears the expired/invalid session and returns the user to the sign-in flow.

Expected access-control checks:

| Test | Expected result |
|---|---|
| Call a protected endpoint without a token | `401 Unauthorized` |
| Call `GET /api/regions` or `GET /api/zones` with an operator token | `200 OK` |
| Call `POST`, `PUT` or `DELETE` for regions/zones with an operator token | `403 Forbidden` |
| Call an allowed region/zone write with an admin token | Successful response, subject to normal validation |
| Call `GET /api/health` without a token | `200 OK` if the backend is running |

## Swagger UI and OpenAPI

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

Open Swagger UI, expand `POST /api/auth/login`, sign in with a test account, and copy the `accessToken` value from the response. Select **Authorize** and paste the token value into the HTTP Bearer field. Swagger UI sends it as `Authorization: Bearer <token>` for secured operations. Do not include the token in screenshots or project documentation; mask it before capturing evidence.

The API documentation is generated from the Spring MVC controllers and OpenAPI annotations/configuration. It describes the Bearer JWT security scheme so protected operations can be tested from Swagger UI.

## Implementation notes and limitations

- The backend uses a stateless Spring Security filter chain and validates the JWT signature, expiry and issuer before permitting protected requests.
- The JWT uses HS256 and a shared secret supplied through `JWT_SECRET`; use a secret of at least 32 bytes.
- Browser-side token persistence currently uses `localStorage` for the academic prototype. A production deployment should use HTTPS, secure token lifecycle controls (including refresh/re-authentication), rate limiting, audit logging and an XSS-resistant token-storage design such as appropriately configured secure, HttpOnly cookies.
- This is a first-party academic authentication implementation, not a complete OAuth 2.0/OpenID Connect identity provider.
