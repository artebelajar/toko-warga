export const auth = (c) => {
  const user = c.get("user"); 
  return c.json({
    success: true,
    user,
  });
}