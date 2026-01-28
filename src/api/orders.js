import { eq } from "drizzle-orm";

export const order =  async (c) => {
  const { customerName, address, items } = await c.req.json();

  try {
    const result = await db.transaction(async (tx) => {
      let total = 0;

      const [newOrder] = await tx
        .insert(schema.orders)
        .values({
          customerName,
          address,
          totalAmount: "0",
          status: "pending",
        })
        .returning();

      for (const item of items) {
        const product = await tx.query.products.findFirst({
          where: eq(schema.products.id, item.productId),
        });

        if (!product || product.stock < item.quantity) {
          throw new Error(`Stock ${product?.name} kurang!`);
        }

        total += parseFloat(product.price) * item.quantity;

        await tx.insert(schema.orderItems).values({
          orderId: newOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          priceAtTime: product.price,
        });

        await tx
          .update(schema.products)
          .set({ stock: product.stock - item.quantity })
          .where(eq(schema.products.id, item.productId));
      }

      await tx
        .update(schema.orders)
        .set({ totalAmount: total })
        .where(eq(schema.orders.id, newOrder.id));

      return { orderId: newOrder.id, total };
    });
    return c.json({ success: true, ...result });
  } catch (e) {
    return c.json({
      success: false,
      message: "Error placing order",
      error: e.message,
    });
  }
}