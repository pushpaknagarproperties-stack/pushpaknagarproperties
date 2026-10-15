export async function onRequestPost(context) {
  try {
    const bucket = context.env.MY_BUCKET;
    if (!bucket) {
      return Response.json({ error: "MY_BUCKET binding not found. Rename my-bucket to MY_BUCKET in Cloudflare Settings > Bindings and redeploy." }, { status: 500 });
    }
    const form = await context.request.formData();
    const file = form.get("file");
    if (!file) return Response.json({ error: "No file uploaded" }, { status: 400 });

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `properties/${Date.now()}-${safeName}`;

    await bucket.put(key, file.stream(), {
      httpMetadata: { contentType: file.type || "application/octet-stream" },
      customMetadata: { originalName: file.name }
    });

    return Response.json({
      success: true,
      key: key,
      url: `/api/media/${key}`,
      name: file.name,
      size: file.size,
      type: file.type
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// GET /api/upload -> list bucket for stats
export async function onRequestGet(context) {
  const bucket = context.env.MY_BUCKET;
  const listed = await bucket.list({ limit: 1000 });
  const totalSize = listed.objects.reduce((s, o) => s + o.size, 0);
  return Response.json({
    count: listed.objects.length,
    totalSize,
    objects: listed.objects
  });
}
