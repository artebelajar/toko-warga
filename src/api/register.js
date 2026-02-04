import bcrypt from "bcryptjs";
import { db } from "../db/index.js";
import * as schema from "../db/schema.js";

export const register = async (c) => {
try {
    const { username, password } = await c.req.json();
    const hashedPassword = bcrypt.hashSync(password, 10);
    const user = await db.insert(schema.usersECommerce).values({
      username,
      password: hashedPassword,
    });
    return c.json(
      { success: true, message: `Registrasi berhasil ${user[0]}` },
      201,
    );
  } catch (error) {
    console.error(error);
    return c.json({ success: false, message: "Registrasi gagal" }, 500);
  }
}