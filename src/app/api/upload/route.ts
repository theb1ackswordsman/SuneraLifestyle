import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getServerSession } from "@/lib/auth/session";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session.isAuthenticated) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ success: false, error: "File too large (max 5 MB)" }, { status: 400 });
  }

  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ success: false, error: "Only JPEG, PNG, or WebP images allowed" }, { status: 400 });
  }

  try {
    const buffer  = Buffer.from(await file.arrayBuffer());
    const base64  = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUrl, {
      folder:            "sunera/returns",
      resource_type:     "image",
      transformation:    [{ width: 1200, quality: "auto:good", fetch_format: "auto" }],
    });

    return NextResponse.json({ success: true, url: result.secure_url });
  } catch (err) {
    console.error("[Upload] Cloudinary error:", err);
    return NextResponse.json({ success: false, error: "Upload failed, please try again" }, { status: 500 });
  }
}
