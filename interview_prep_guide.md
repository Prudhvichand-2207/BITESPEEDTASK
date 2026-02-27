# Bitespeed Identity Reconciliation: Interview Preparation Guide

This document is designed to help you explain the architecture, design choices, and flow of the identity reconciliation system you built. This covers exactly what we did and why we did it, ensuring you can answer questions efficiently and correctly.

---

## 1. Project Overview & Technologies Used
**The Goal:** To build a web service with an endpoint (`/identify`) that takes in a user's email and phone number and links their past purchases together. If Doc uses three different emails but the same phone number, the system needs to realize it's the exact same person.

**The Tech Stack:**
*   **Node.js & Express:** We chose this because it allows us to build a lightweight, extremely fast REST API using JavaScript/TypeScript.
*   **TypeScript:** Used instead of raw JavaScript to add strong type-safety, which catches errors before the code even runs and makes the backend more professional.
*   **Prisma ORM:** We used Prisma as our Object-Relational Mapper. Instead of writing raw SQL strings, Prisma gave us type-safe database queries (`prisma.contact.findMany()`).
*   **SQLite (Database):** We chose SQLite for simplicity and portability. Everything is stored locally in a single `dev.db` file, which means it requires zero setup or external database hosting to test.

---

## 2. The Database Schema (Architecture)
The entire project revolves around a single table called `Contact`. 
If the interviewer asks *how you modeled the data*, explain this Prisma Schema:

```prisma
model Contact {
  id             Int       @id @default(autoincrement())
  phoneNumber    String?
  email          String?
  linkedId       Int?      // The ID of another Contact linked to this one
  linkPrecedence String    // "primary" or "secondary"
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  deletedAt      DateTime? // Soft-deletion (if ever needed)
}
```
**Key design choices based on the prompt:**
*   `email` and `phoneNumber` are optional (String?) because a user might only provide one of them.
*   `linkPrecedence` determines who is the "head" of the profile.
*   `linkedId` is crucial. It acts as a pointer so secondary contacts know exactly which primary contact they belong to. 

---

## 3. The Core Logic Workflow (The Algorithm)
When a `POST` request hits the `/identify` endpoint, here is the step-by-step logic your code executes. **Memorize this flow—this is the most important part of the interview.**

**Step 1. Fetch Existing Records (The Search)**
We query the database for *any* contacts that match the incoming email OR the incoming phone number.

**Step 2a. No Matches Found (The "New User" Logic)**
If the query returns zero results, this is a brand-new person. The system creates a new `Contact` row with `linkPrecedence` set to `"primary"`. 

**Step 2b. Matches Found (The "Reconciliation" Logic)**
If records already exist, the system groups all of them together to find the "clusters". A cluster represents a single human being.
*   We trace all the found contacts to find their root `primary` contact. 
*   We identify the **oldest** primary contact among the matches. This becomes our anchor (the oldest profile always stays primary).

**Step 3. Handle New Information**
If the incoming request contains an email or phone number that *is not* in the database yet, we create a new row. But since this person already has a profile (found in Step 2b), this new row is created as a `"secondary"` contact, and its `linkedId` points to the oldest primary contact.

**Step 4. Handle Merging Disparate Profiles (Cross-Pollination)**
This is the trickiest edge case! *What if the user inputs George's email, but Biff's phone number?* 
*   Step 2b would have found **two distinct primary contacts**. 
*   The system takes the older primary contact and keeps it as `"primary"`. 
*   It takes the newer primary contact and **demotes** it to `"secondary"`, updating its `linkedId` to point to the older one.
*   It also grabs any existing secondary contacts that used to point to the newer one and redirects them to the older one. (Everyone is now in the same boat!)

**Step 5. Format the Final Response**
Finally, we gather all the emails, phone numbers, and secondary IDs associated with that anchor primary contact, remove duplicates, and send back the clean, consolidated JSON response.

---

## 4. Explaining the UI Test Client (Bonus Points)
You also built a professional HTML tester (`test.html`). If asked how you tested the API:
*   Instead of just using terminal tools like `cURL` or Postman, you built an aesthetic frontend to visualize the JSON returns.
*   You enabled `CORS` (Cross-Origin Resource Sharing) in the Express backend so the browser would be allowed to fetch data from localhost.
*   The frontend uses standard JavaScript `fetch()` calls to send JSON payloads to the Express server and parses the results into graphical UI cards.

---

## 5. Potential Interview Questions

*   **Q: Why did you use Prisma?**
    *   *A: It provides excellent type safety with TypeScript, automatically generates the database schema, and protects against SQL injection attacks under the hood.*
*   **Q: How does the system handle "soft deletes"?**
    *   *A: The schema includes a `deletedAt` DateTime column. While our `/identify` endpoint doesn't currently delete data, having that column prepares the system to "hide" rows instead of permanently erasing them, which is a modern data best practice.*
*   **Q: What would you do differently if you were to scale this system?**
    *   *A: For an enterprise deployment, I would swap SQLite for PostgreSQL. I would also add database indexes to the `email` and `phoneNumber` columns in Prisma to make the search queries lightning fast as the table grows to millions of rows.*
