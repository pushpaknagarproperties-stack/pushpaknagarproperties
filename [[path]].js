export async function onRequestGet(context) {
  const bucket = context.env.MY_BUCKET;
  const key = context.params.path ? context.params.path.join("/") : "";
  if (!key) return new Response("Missing key", { status: 400 });

  const object = await bucket.get(key);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  headers.set("Content-Type", object.httpMetadata?.contentType || "application/octet-stream");
  headers.set("Cache-Control", "public, max-age=31536000");
  headers.set("ETag", object.httpEtag);
  return new Response(object.body, { headers });
}

export async function onRequestDelete(context) {
  const bucket = context.env.MY_BUCKET;
  const key = context.params.path ? context.params.path.join("/") : "";
  await bucket.delete(key);
  return Response.json({ success: true, deleted: key });
}
