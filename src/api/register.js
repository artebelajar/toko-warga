import bcrypt from "bcryptjs";

export const register = async (c) => {
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
}