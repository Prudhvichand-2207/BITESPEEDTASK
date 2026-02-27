"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const cors_1 = __importDefault(require("cors"));
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.post('/identify', async (req, res) => {
    try {
        const { email, phoneNumber } = req.body;
        if (!email && !phoneNumber) {
            return res.status(400).json({ error: 'Email or phoneNumber is required' });
        }
        // Convert phoneNumber to string if it was provided as a number per the requirements
        const phoneStr = phoneNumber ? String(phoneNumber) : undefined;
        const emailStr = email ? String(email) : undefined;
        // Find all existing records matching either email or phoneNumber
        const orConditions = [];
        if (emailStr)
            orConditions.push({ email: emailStr });
        if (phoneStr)
            orConditions.push({ phoneNumber: phoneStr });
        const existingContacts = await prisma.contact.findMany({
            where: orConditions.length > 0 ? { OR: orConditions } : {}
        });
        if (existingContacts.length === 0) {
            // Create a brand new primary contact
            const newContact = await prisma.contact.create({
                data: {
                    email: emailStr || null,
                    phoneNumber: phoneStr || null,
                    linkPrecedence: "primary"
                }
            });
            return res.status(200).json({
                contact: {
                    primaryContatctId: newContact.id,
                    emails: newContact.email ? [newContact.email] : [],
                    phoneNumbers: newContact.phoneNumber ? [newContact.phoneNumber] : [],
                    secondaryContactIds: []
                }
            });
        }
        // Step 1: Collect root primary IDs for all matched contacts
        const primaryContactIds = new Set();
        for (const contact of existingContacts) {
            let current = contact;
            while (current.linkedId) {
                const parent = await prisma.contact.findUnique({ where: { id: current.linkedId } });
                if (!parent)
                    break;
                current = parent;
            }
            primaryContactIds.add(current.id);
        }
        // Step 2: Fetch all relevant primary contacts
        let primaryContacts = await prisma.contact.findMany({
            where: {
                id: { in: Array.from(primaryContactIds) }
            },
            orderBy: { createdAt: 'asc' }
        });
        // We designate the oldest primary contact as the overall primary for this cluster
        const oldestPrimary = primaryContacts[0];
        if (!oldestPrimary) {
            return res.status(500).json({ error: 'Data integrity error: No primary contact found for cluster' });
        }
        // Step 3: Check if new contact needs to be created, and if primaries need to be merged
        const hasMatchingEmail = emailStr ? existingContacts.some(c => c.email === emailStr) : true;
        const hasMatchingPhone = phoneStr ? existingContacts.some(c => c.phoneNumber === phoneStr) : true;
        // Merge newer primary contacts into the oldest one
        if (primaryContacts.length > 1) {
            const newerPrimaries = primaryContacts.slice(1);
            const newerPrimaryIds = newerPrimaries.map(c => c.id);
            // Update the newer primaries themselves
            await prisma.contact.updateMany({
                where: { id: { in: newerPrimaryIds } },
                data: {
                    linkPrecedence: "secondary",
                    linkedId: oldestPrimary.id,
                    updatedAt: new Date()
                }
            });
            // Update secondary contacts that were linked to the newer primaries
            await prisma.contact.updateMany({
                where: { linkedId: { in: newerPrimaryIds } },
                data: {
                    linkedId: oldestPrimary.id,
                    updatedAt: new Date()
                }
            });
        }
        // Create new secondary contact if we have new piece of information
        if (!hasMatchingEmail || !hasMatchingPhone) {
            await prisma.contact.create({
                data: {
                    email: emailStr || null,
                    phoneNumber: phoneStr || null,
                    linkedId: oldestPrimary.id,
                    linkPrecedence: "secondary"
                }
            });
        }
        // Step 4: Fetch entire final cluster to form output
        const allClusterContacts = await prisma.contact.findMany({
            where: {
                OR: [
                    { id: oldestPrimary.id },
                    { linkedId: oldestPrimary.id }
                ]
            },
            orderBy: { createdAt: 'asc' }
        });
        // Formatting Response
        const emails = new Set();
        if (oldestPrimary.email)
            emails.add(oldestPrimary.email);
        const phoneNumbers = new Set();
        if (oldestPrimary.phoneNumber)
            phoneNumbers.add(oldestPrimary.phoneNumber);
        const secondaryIds = [];
        for (const c of allClusterContacts) {
            if (c.email)
                emails.add(c.email);
            if (c.phoneNumber)
                phoneNumbers.add(c.phoneNumber);
            if (c.id !== oldestPrimary.id) {
                secondaryIds.push(c.id);
            }
        }
        return res.status(200).json({
            contact: {
                primaryContatctId: oldestPrimary.id,
                emails: Array.from(emails),
                phoneNumbers: Array.from(phoneNumbers),
                secondaryContactIds: secondaryIds
            }
        });
    }
    catch (error) {
        console.error("Error in /identify:", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
