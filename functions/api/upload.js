export async function onRequestPost(context) {
  try {
    const bucket = context.env.MY_BUCKET;

    if (!bucket) {
      return Response.json(
        { error: "MY_BUCKET binding not found" },
        { status: 500 }
      );
    }

    const form = await context.request.formData();
    const file = form.get("file");

    if (!file || typeof file.stream !== "function") {
      return Response.json(
        { error: "No valid file uploaded. Use the file field." },
        { status: 400 }
      );
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `properties/${Date.now()}-${safeName}`;

    await bucket.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type || "application/octet-stream"
      },
      customMetadata: {
        originalName: file.name
      }
    });

    return Response.json({
      success: true,
      key,
      url: `/api/media/${key}`,
      name: file.name,
      size: file.size,
      type: file.type
    });
  } catch (error) {
    return Response.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}

export async function onRequestGet(context) {
  try {
    const bucket = context.env.MY_BUCKET;

    if (!bucket) {
      return Response.json(
        { error: "MY_BUCKET binding not found" },
        { status: 500 }
      );
    }

    const listed = await bucket.list({ limit: 1000 });
    const totalSize = listed.objects.reduce(
      (sum, object) => sum + object.size,
      0
    );

    return Response.json({
      count: listed.objects.length,
      totalSize,
      objects: listed.objects
    });
  } catch (error) {
    return Response.json(
      { error: "Unable to list files" },
      { status: 500 }
    );
  }
}
