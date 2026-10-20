export async function onRequest(context) {
  const { request, env } = context;
  if (!env.DB) return Response.json({ error: 'Banco não configurado' }, { status: 503 });
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY, data TEXT NOT NULL)').run();
  if (request.method === 'GET') {
    const rows = await env.DB.prepare('SELECT data FROM products ORDER BY id').all();
    return Response.json(rows.results.map(row => JSON.parse(row.data)));
  }
  if (request.method === 'PUT') {
    const product = await request.json();
    if (!product?.id || !product.name || !product.category || !product.price) return Response.json({ error: 'Produto inválido' }, { status: 400 });
    await env.DB.prepare('INSERT INTO products (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data=excluded.data').bind(product.id, JSON.stringify(product)).run();
    return Response.json(product);
  }
  if (request.method === 'DELETE') {
    const id = new URL(request.url).searchParams.get('id');
    await env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
    return Response.json({ ok: true });
  }
  return new Response('Method Not Allowed', { status: 405 });
}
