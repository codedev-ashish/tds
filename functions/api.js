// functions/api.js
export async function onRequest(context) {
  // Access the D1 database via the "DB" binding
  const { results } = await context.env.DB.prepare(
    "SELECT * FROM users LIMIT 5"
  ).all();

  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json" }
  });
}