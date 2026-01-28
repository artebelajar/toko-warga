import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";

export const login = async (c) => {
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
}