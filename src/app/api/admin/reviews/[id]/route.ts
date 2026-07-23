import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Review, REVIEW_STATUS, REJECTION_REASONS } from "@/models/review.model";
import { Product } from "@/models/product.model";
import { User } from "@/models/user.model";
import { recalculateProductRating } from "@/lib/shop/recalculate-rating";
import { sendEmail } from "@/lib/email/mailer";
import { reviewApprovedTemplate, reviewRejectedTemplate } from "@/lib/email/templates";
import { ok, forbidden, notFound, badRequest, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-user-role") === "admin" && req.headers.get("x-admin-verified") === "1";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdmin(req)) return forbidden();
    const { id } = await params;
    await connectDB();

    const review = await Review.findOne({ _id: id, deletedAt: null })
      .populate("customerId", "name email phone")
      .populate("productId", "name slug images")
      .lean();

    if (!review) return notFound("Review not found.");
    return ok(review);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdmin(req)) return forbidden();
    const { id } = await params;
    await connectDB();

    const review = await Review.findOne({ _id: id, deletedAt: null });
    if (!review) return notFound("Review not found.");

    const { action, rejectionReason, adminNote } = await req.json() as {
      action?: string; rejectionReason?: string; adminNote?: string;
    };

    const _review = review;
    async function getEmailRecipients() {
      if (_review.adminAdded || !_review.customerId) return null;
      const [customer, product] = await Promise.all([
        User.findById(_review.customerId).select("email").lean(),
        Product.findById(_review.productId).select("name slug").lean(),
      ]);
      if (!customer?.email || !product) return null;
      return { email: customer.email, productName: product.name, productSlug: product.slug };
    }

    if (action === "approve") {
      review.status    = REVIEW_STATUS.APPROVED;
      review.adminNote = adminNote?.trim() || undefined;
      await review.save();
      recalculateProductRating(review.productId).catch(console.error);

      getEmailRecipients().then((r) => {
        if (!r) return;
        sendEmail({
          to:      r.email,
          subject: "Your Review Is Live – SunEra Lifestyle",
          html:    reviewApprovedTemplate({
            productName: r.productName,
            rating:      review.rating,
            productUrl:  `${BASE_URL}/product/${r.productSlug}`,
          }),
        }).catch(console.error);
      });

      return ok(review, "Review approved.");
    }

    if (action === "reject") {
      if (!rejectionReason || !(REJECTION_REASONS as readonly string[]).includes(rejectionReason)) {
        return badRequest("A valid rejectionReason is required.");
      }
      review.status          = REVIEW_STATUS.REJECTED;
      review.rejectionReason = rejectionReason as (typeof REJECTION_REASONS)[number];
      review.adminNote       = adminNote?.trim() || undefined;
      await review.save();
      recalculateProductRating(review.productId).catch(console.error);

      getEmailRecipients().then((r) => {
        if (!r) return;
        sendEmail({
          to:      r.email,
          subject: "Update on Your Review – SunEra Lifestyle",
          html:    reviewRejectedTemplate({
            productName:     r.productName,
            rejectionReason: rejectionReason.replace(/_/g, " "),
            trackUrl:        `${BASE_URL}/account/reviews`,
          }),
        }).catch(console.error);
      });

      return ok(review, "Review rejected.");
    }

    if (action === "hide") {
      review.status = REVIEW_STATUS.HIDDEN;
      await review.save();
      recalculateProductRating(review.productId).catch(console.error);
      return ok(review, "Review hidden.");
    }

    if (action === "restore") {
      review.status = REVIEW_STATUS.APPROVED;
      await review.save();
      recalculateProductRating(review.productId).catch(console.error);
      return ok(review, "Review restored.");
    }

    if (action === "delete") {
      review.deletedAt = new Date();
      await review.save();
      recalculateProductRating(review.productId).catch(console.error);
      return ok(review, "Review deleted.");
    }

    return badRequest("Invalid action. Must be: approve, reject, hide, restore, delete.");
  } catch (err) {
    return handleApiError(err);
  }
}
