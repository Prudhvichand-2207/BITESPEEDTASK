# Bitespeed Identity Reconciliation

## Setup & Run

This project uses **Express**, **TypeScript**, and **Prisma** with a local **SQLite** database (`dev.db`). The database is already initialized with the correct `Contact` schema.

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```
2. Generate Prisma Client (if developing/modifying schema):
   ```bash
   npx prisma generate
   ```

### Running the server

Start the development server (runs with ts-node on port 3000):
```bash
npm run dev
```

### Testing the API

The endpoint is `POST /identify`. It accepts JSON body:
```json
{
  "email": "lorraine@hillvalley.edu",
  "phoneNumber": "123456"
}
```

You can test with cURL:
```bash
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"lorraine@hillvalley.edu","phoneNumber":"123456"}'
```
