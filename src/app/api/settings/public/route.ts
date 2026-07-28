import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { StoreSettings } from "@/models/store-settings.model";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const doc = await StoreSettings.findOne().lean();
    const settings = doc ?? (await StoreSettings.create({
      shipping: {
        freeAbove: 999,
        standardFee: 99,
        expressFee: 199,
        standardDays: "5-7",
        expressDays: "2-3",
      },
    }));

    const shipping = (settings as any).shipping ?? {};
    const policies = (settings as any).policies ?? {};

    return NextResponse.json({
      success: true,
      data: {
        shipping: {
          freeAbove: shipping.freeAbove ?? 999,
          standardFee: shipping.standardFee ?? 99,
          expressFee: shipping.expressFee ?? 199,
          standardDays: shipping.standardDays ?? "5-7",
          expressDays: shipping.expressDays ?? "2-3",
        },
        policies: {
          returnDays: policies.returnDays ?? 7,
          exchangeDays: policies.exchangeDays ?? 15,
        },
      },
    });
  } catch (err) {
    console.error("[Public Settings API Error]:", err);
    return NextResponse.json(
      {
        success: true,
        data: {
          shipping: { freeAbove: 999, standardFee: 99, expressFee: 199, standardDays: "5-7", expressDays: "2-3" },
        },
      },
      { status: 200 }
    );
  }
}
