import { eq, desc } from "drizzle-orm";
import { getDb } from "./db";
import { salesRecords, InsertSalesRecord, SalesRecord } from "../drizzle/schema";

/**
 * Get all sales records for a user
 */
export async function getUserSalesRecords(userId: number): Promise<SalesRecord[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(salesRecords)
    .where(eq(salesRecords.userId, userId))
    .orderBy(desc(salesRecords.createdAt));
}

/**
 * Create a new sales record
 */
export async function createSalesRecord(
  data: Omit<InsertSalesRecord, "syncedAt" | "createdAt" | "updatedAt">,
): Promise<SalesRecord | null> {
  const db = await getDb();
  if (!db) return null;

  await db.insert(salesRecords).values(data);

  // Return the most recently created record
  const records = await db
    .select()
    .from(salesRecords)
    .where(eq(salesRecords.userId, data.userId))
    .orderBy(desc(salesRecords.createdAt))
    .limit(1);

  return records[0] || null;
}

/**
 * Update a sales record
 */
export async function updateSalesRecord(
  id: number,
  data: Partial<Omit<InsertSalesRecord, "userId" | "syncedAt" | "createdAt" | "updatedAt">>,
): Promise<SalesRecord | null> {
  const db = await getDb();
  if (!db) return null;

  await db.update(salesRecords).set(data).where(eq(salesRecords.id, id));

  const records = await db
    .select()
    .from(salesRecords)
    .where(eq(salesRecords.id, id))
    .limit(1);

  return records[0] || null;
}

/**
 * Delete a sales record
 */
export async function deleteSalesRecord(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db.delete(salesRecords).where(eq(salesRecords.id, id));
  return true;
}
