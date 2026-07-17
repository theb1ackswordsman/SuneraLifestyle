import { NextRequest } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { ok, forbidden, badRequest, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function isAdmin(req: NextRequest) {
  return req.headers.get("x-user-role") === "admin" && req.headers.get("x-admin-verified") === "1";
}

export async function POST(req: NextRequest) {
  try {
    if (!isAdmin(req)) return forbidden();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) ?? "sunera/uploads";

    if (!file) return badRequest("No file provided");

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder, resource_type: "image" }, (error, res) => {
            if (error || !res) reject(error ?? new Error("Upload failed"));
            else resolve(res as { secure_url: string; public_id: string });
          })
          .end(buffer);
      }
    );

    return ok({ url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    return handleApiError(err);
  }
}
