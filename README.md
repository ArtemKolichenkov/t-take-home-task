This is a take home assignment for T.

# Overview

This API backend provides the following endpoints:

### POST `/v1/users`

Adds a user to the database. The request body should include an `email` field, as shown in the example below:

```json
{
  "email": "joHNsmiTH@GMail.com"
}
```

### GET `/v1/users`

Retrieves a list of users with pagination capabilities. This endpoint accepts the following query string parameters:

- `searchStr`: The search string used to filter users (by `email` column) to return.
- `pageSize`: The number of users returned per page. Defaults to 10, with a maximum of 100.
- `cursor`: The pagination cursor, which must be provided to retrieve the next page of users.

### GET `/v1/health`

A health check endpoint to verify the API's status.

# Development

Tech stack:

- Node.js 22+
- Typescript
- Fastify
- Drizzle
- Postgres
- Vitest

## Environmental Variables

The `.env.dev` file must contain the following environmental variables to configure the application:

### HOST

Specifies the host IP address that will serve the API.

### PORT

Specifies the port on which the app will serve the API. Setting `PORT=0` will automatically choose a random available port.

### CORS

Specifies the CORS policy for the API. This can be set to:

- `CORS=https://somedomain.com` to allow requests from a specific domain.
- `CORS=https://somedomain.com https://anotherdomain.com` to allow requests from multiple domains.
- `CORS=*` to allow requests from any domain.

### DB_URL

The connection string to a Postgres database.

## Run from source locally

Start the local Postgres DB.

```
docker run -d \
  --name test-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=myapp_test \
  -p 5432:5432 \
  postgres:15-alpine
```

Run server

```
npm run start:dev
```

## Run in a container locally

Build the image

```
docker build -t t_takehome .
```

Run container (this will start both a dockerized Postgres instance and the image built in previous step)

```
docker-compose up -d
```

## Testing

The code has 100% code coverage as it is supposed to be mission-critical.  
Unit tests cover basic functionality and use mock database instead of a real Postgres, while integration tests work with a real PostgresDB to test parts of code that read/write to DB.

`npm run test:unit` - runs unit tests  
`npm run test:integration` - starts test DB, runs integration tests, stops test DB  
`npm run coverage` - generates a coverage report (for both unit and integration tests)  
`npm run load-test` - with DB and server running runs a basic load test with artillery (Note: these are mostly boilerplate, proper load test would require cloud staging environment to draw meaningful conclusions)
