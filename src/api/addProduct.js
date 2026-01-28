import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";

export const addProduct = async (c) => {
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
}