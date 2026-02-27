# Bitespeed Identity Reconciliation

## Overview

A small Express/TypeScript service that performs identity reconciliation using a
local SQLite database via Prisma.  The API accepts an email address and/or phone
number and responds with a consolidated contact record.

## Setup & Run

1. **Clone the repository** or copy the project files to a directory of your choosing.
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **(Optional) regenerate Prisma client** if you modify `prisma/schema.prisma`:
   ```bash
   npx prisma generate
   ```

### Starting the server

Run:

```bash
npm run dev
```

This starts the app on port `3000` using `ts-node`.  The console will log
"Server is running on port 3000".


## API

### POST /identify

Request body must be JSON and contain _at least one_ of the following fields:

```json
{
  "email": "lorraine@hillvalley.edu",
  "phoneNumber": "123456"
}
```

Response (HTTP 200) returns an object with the contact cluster:

```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["..."],
    "phoneNumbers": ["..."],
    "secondaryContactIds": [2,3]
  }
}
```

Errors are returned with the appropriate status code and JSON description.

> **Note:** a plain GET request to `/identify` will return `Cannot GET /identify`
> because the route only accepts POST.

### Example requests

*Unix / macOS / Linux*
```bash
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"lorraine@hillvalley.edu","phoneNumber":"123456"}'
```

*Windows Command Prompt*
```bat
curl -X POST http://localhost:3000/identify ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"lorraine@hillvalley.edu\",\"phoneNumber\":\"123456\"}"
```

*Browser / HTML form*

Open the included `test.html` file in a browser and submit the form – it posts to
`http://localhost:3000/identify` and displays the result.


## Frontend

`test.html` is a simple static page you can open directly in your browser.  It
contains a form for entering email/phone and a script that calls the API and
renders the response.  No additional build step is required.


## Additional notes

* Add a `.gitignore` if you don’t already have one (e.g. ignore `node_modules/`,
  `dev.db`, `dist/`).
* To deploy the frontend, simply host `test.html` on any static‑file server or
  point a GitHub Pages / Netlify site at the repo.
* Update the **Website** field in the repo settings and the section below once
you have a live URL.


---

### Website



```[
file:///C:/Users/PRUDHVI%20CHAND/OneDrive/Desktop/BITESPEEDTASK/test.html
```
