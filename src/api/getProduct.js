import { desc } from "drizzle-orm";

export const getProduct = async (c) => {
  const data = await db
    .select()
    .from(schema.products)
    .orderBy(desc(schema.products.id));
  return c.json({ success: true, data });
}