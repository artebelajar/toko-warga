import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { cors } from "hono/cors";
import * as schema from "./src/db/schema.js";
import { eq, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
// import { db } from "./src/db/index.js";
// import { supabase } from "./src/db/storage.js";
import { createClient } from "@supabase/supabase-js";

//router
// import { register } from "./src/api/register.js";
// import { login } from "./src/api/login.js";
// import { auth } from "./src/api/auth.js";
// import { addProduct } from "./src/api/addProduct.js";

process.loadEnvFile();

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client, { schema });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

const app = new Hono();

app.use("*", cors());

app.post("/api/register", async (c) => {
try {
    const { username, password } = await c.req.json();
    const hashedPassword = bcrypt.hashSync(password, 10);
    const user = await db.insert(schema.usersECommerce).values({
      username,
      password: hashedPassword,
      role: "user",
    });
    return c.json(
      { success: true, message: `Registrasi berhasil ${user[0]}` },
      201,
    );
  } catch (error) {
    console.error(error);
    return c.json({ success: false, message: "Registrasi gagal" }, 500);
  }
});

app.post("/api/login", async (c) => {
  const { username, password } = await c.req.json();

  const user = await db.query.usersECommerce.findFirst({
    where: eq(schema.usersECommerce.username, username),
  });

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return c.json({ success: false, message: "Login gagal" }, 401);
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );
  return c.json({ success: true, message: user.role, token });
});

const authMiddleware = async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader)
    return c.json({ success: false, message: "Unauthorized" }, 401);

  try {
    const token = authHeader.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    c.set("user", payload);
    await next();
  } catch (error) {
    return c.json({ success: false, message: "Invalid token" }, 403);
  }
};

app.get("/api/me", authMiddleware, (c) => {
  const user = c.get("user"); 
  return c.json({
    success: true,
    user,
  })
});


app.post("/api/products", authMiddleware, async (c) => {
  try {
    const body = await c.req.parseBody();
    const imagefile = body["image"];

    if (!imagefile || !(imagefile instanceof File)) {
      return c.json({ success: false, message: "gambar wajib" }, 400);
    }

    const fileName = `prod_${Date.now()}_${imagefile.name.replace(/\s/g, "_")}`;
    const arrayBuffer = new Uint8Array(await imagefile.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("products")
      .upload(fileName, arrayBuffer, {
        contentType: imagefile.type,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("products").getPublicUrl(fileName);
    const imageUrl = data.publicUrl;

    await db.insert(schema.products).values({
      name: body["name"],
      description: body["description"],
      price: body["price"],
      stock: parseInt(body["stock"]),
      categoryId: parseInt(body["categoryId"]),
      imageUrl,
    });

    return c.json({ success: true, message: "Product created", imageUrl });
  } catch (error) {
    console.error("REAL ERROR:", error);

    return c.json(
      {
        success: false,
        message: "Error creating product",
        error: error,
      },
      500,
    );
  }
});

app.get("/api/products", async (c) => {
  const data = await db
    .select()
    .from(schema.products)
    .orderBy(desc(schema.products.id));
  return c.json({ success: true, data });
});

app.post("/api/orders", async (c) => {
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
});

app.use("/*", serveStatic({ root: "src/public" }));

const port = 4554;
console.log(`Server running on http://localhost:${port}`);
serve({ fetch: app.fetch, port });

export default app;
