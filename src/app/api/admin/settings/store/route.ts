import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { StoreSettings } from "@/models/store-settings.model";
import { getServerSession } from "@/lib/auth/session";
import { ok, badRequest, unauthorized, handleApiError } from "@/lib/api/response";
import { siteConfig } from "@/config/site";

export const dynamic = "force-dynamic";

// Defaults derived from siteConfig so the page is never empty on first load
const DEFAULTS = {
  storeName:   siteConfig.name,
  tagline:     siteConfig.tagline,
  description: siteConfig.description,
  storeUrl:    siteConfig.url,
  contact: {
    email:    siteConfig.contact.email,
    phone:    siteConfig.contact.phone,
    address:  siteConfig.contact.address,
    whatsapp: siteConfig.contact.phone,
  },
  social: {
    instagram: siteConfig.social.instagram,
    twitter:   siteConfig.social.twitter,
    facebook:  siteConfig.social.facebook,
    youtube:   siteConfig.social.youtube,
  },
  shipping: {
    freeAbove:    siteConfig.shipping.freeAbove,
    standardFee:  siteConfig.shipping.standardFee,
    expressFee:   siteConfig.shipping.expressFee,
    standardDays: siteConfig.shipping.estimatedDays.standard,
    expressDays:  siteConfig.shipping.estimatedDays.express,
  },
  policies: {
    returnDays:   siteConfig.policies.returnDays,
    exchangeDays: siteConfig.policies.exchangeDays,
  },
  business: {
    gst: siteConfig.business.gst,
    cin: siteConfig.business.cin,
  },
};

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session.isAuthenticated || !session.isAdmin) {
      return unauthorized("Admin access required.");
    }

    await connectDB();
    const settings = await StoreSettings.findOne().lean();

    // Merge DB values over defaults so missing fields still have sensible values
    const merged = settings
      ? {
          storeName:   settings.storeName   || DEFAULTS.storeName,
          tagline:     settings.tagline     || DEFAULTS.tagline,
          description: settings.description || DEFAULTS.description,
          storeUrl:    settings.storeUrl    || DEFAULTS.storeUrl,
          contact: {
            email:    settings.contact?.email    || DEFAULTS.contact.email,
            phone:    settings.contact?.phone    || DEFAULTS.contact.phone,
            address:  settings.contact?.address  || DEFAULTS.contact.address,
            whatsapp: settings.contact?.whatsapp || DEFAULTS.contact.whatsapp,
          },
          social: {
            instagram: settings.social?.instagram || DEFAULTS.social.instagram,
            twitter:   settings.social?.twitter   || DEFAULTS.social.twitter,
            facebook:  settings.social?.facebook  || DEFAULTS.social.facebook,
            youtube:   settings.social?.youtube   || DEFAULTS.social.youtube,
          },
          shipping: {
            freeAbove:    settings.shipping?.freeAbove    ?? DEFAULTS.shipping.freeAbove,
            standardFee:  settings.shipping?.standardFee  ?? DEFAULTS.shipping.standardFee,
            expressFee:   settings.shipping?.expressFee   ?? DEFAULTS.shipping.expressFee,
            standardDays: settings.shipping?.standardDays || DEFAULTS.shipping.standardDays,
            expressDays:  settings.shipping?.expressDays  || DEFAULTS.shipping.expressDays,
          },
          policies: {
            returnDays:   settings.policies?.returnDays   ?? DEFAULTS.policies.returnDays,
            exchangeDays: settings.policies?.exchangeDays ?? DEFAULTS.policies.exchangeDays,
          },
          business: {
            gst: settings.business?.gst || DEFAULTS.business.gst,
            cin: settings.business?.cin || DEFAULTS.business.cin,
          },
        }
      : DEFAULTS;

    return ok(merged);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session.isAuthenticated || !session.isAdmin) {
      return unauthorized("Admin access required.");
    }

    const body = await req.json() as {
      section: string;
      data: Record<string, unknown>;
    };

    if (!body.section || !body.data) {
      return badRequest("Section and data are required.");
    }

    const allowed = ["general", "contact", "social", "shipping", "policies", "business"];
    if (!allowed.includes(body.section)) {
      return badRequest("Invalid section.");
    }

    await connectDB();

    let update: Record<string, unknown> = {};

    if (body.section === "general") {
      const d = body.data as { storeName?: string; tagline?: string; description?: string; storeUrl?: string };
      if (!d.storeName?.trim()) return badRequest("Store name is required.");
      update = {
        storeName:   d.storeName.trim(),
        tagline:     (d.tagline ?? "").trim(),
        description: (d.description ?? "").trim(),
        storeUrl:    (d.storeUrl ?? "").trim(),
      };
    } else if (body.section === "contact") {
      const d = body.data as { email?: string; phone?: string; address?: string; whatsapp?: string };
      update = {
        "contact.email":    (d.email    ?? "").trim(),
        "contact.phone":    (d.phone    ?? "").trim(),
        "contact.address":  (d.address  ?? "").trim(),
        "contact.whatsapp": (d.whatsapp ?? "").trim(),
      };
    } else if (body.section === "social") {
      const d = body.data as { instagram?: string; twitter?: string; facebook?: string; youtube?: string };
      update = {
        "social.instagram": (d.instagram ?? "").trim(),
        "social.twitter":   (d.twitter   ?? "").trim(),
        "social.facebook":  (d.facebook  ?? "").trim(),
        "social.youtube":   (d.youtube   ?? "").trim(),
      };
    } else if (body.section === "shipping") {
      const d = body.data as { freeAbove?: number; standardFee?: number; expressFee?: number; standardDays?: string; expressDays?: string };
      if (d.freeAbove == null || d.standardFee == null || d.expressFee == null) {
        return badRequest("Shipping fees are required.");
      }
      update = {
        "shipping.freeAbove":    Number(d.freeAbove),
        "shipping.standardFee":  Number(d.standardFee),
        "shipping.expressFee":   Number(d.expressFee),
        "shipping.standardDays": (d.standardDays ?? "").trim(),
        "shipping.expressDays":  (d.expressDays  ?? "").trim(),
      };
    } else if (body.section === "policies") {
      const d = body.data as { returnDays?: number; exchangeDays?: number };
      if (d.returnDays == null || d.exchangeDays == null) {
        return badRequest("Return and exchange days are required.");
      }
      update = {
        "policies.returnDays":   Number(d.returnDays),
        "policies.exchangeDays": Number(d.exchangeDays),
      };
    } else if (body.section === "business") {
      const d = body.data as { gst?: string; cin?: string };
      update = {
        "business.gst": (d.gst ?? "").trim(),
        "business.cin": (d.cin ?? "").trim(),
      };
    }

    await StoreSettings.findOneAndUpdate({}, { $set: update }, { upsert: true, new: true });

    return ok({}, "Settings saved.");
  } catch (err) {
    return handleApiError(err);
  }
}
