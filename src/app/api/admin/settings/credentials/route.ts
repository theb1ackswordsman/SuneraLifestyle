import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/models/user.model";
import { getServerSession } from "@/lib/auth/session";
import { ok, badRequest, unauthorized, forbidden, conflict, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session.isAuthenticated || !session.isAdmin) {
      return unauthorized("Admin access required.");
    }

    await connectDB();
    const user = await User.findById(session.user!._id).select("email name");
    if (!user) return unauthorized("Admin not found.");

    return ok({ email: user.email, name: user.name });
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
      action?: string;
      currentPassword?: string;
      newEmail?: string;
      newPassword?: string;
      confirmPassword?: string;
      newCode?: string;
      confirmCode?: string;
    };

    const { action, currentPassword } = body;

    if (!action || !currentPassword?.trim()) {
      return badRequest("Action and current password are required.");
    }

    await connectDB();
    const user = await User.findById(session.user!._id).select("+password +adminPortalCode");
    if (!user || !user.isActive) {
      return unauthorized("Admin account not found.");
    }

    const passwordMatch = await user.comparePassword(currentPassword.trim());
    if (!passwordMatch) {
      return forbidden("Current password is incorrect.");
    }

    if (action === "email") {
      const newEmail = body.newEmail?.trim().toLowerCase();
      if (!newEmail) return badRequest("New email is required.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return badRequest("Invalid email format.");

      const taken = await User.exists({ email: newEmail, _id: { $ne: user._id } });
      if (taken) return conflict("This email address is already in use.");

      user.email = newEmail;
      await user.save();
      return ok({ email: user.email }, "Email updated successfully.");
    }

    if (action === "password") {
      const { newPassword, confirmPassword } = body;
      if (!newPassword || !confirmPassword) return badRequest("New password and confirmation are required.");
      if (newPassword.length < 8) return badRequest("Password must be at least 8 characters.");
      if (newPassword !== confirmPassword) return badRequest("Passwords do not match.");
      const sameAsCurrent = await user.comparePassword(newPassword);
      if (sameAsCurrent) return badRequest("New password must be different from the current one.");

      user.password = newPassword;
      await user.save();
      return ok({}, "Password updated successfully.");
    }

    if (action === "portal-code") {
      const { newCode, confirmCode } = body;
      if (!newCode || !confirmCode) return badRequest("New code and confirmation are required.");
      if (newCode.trim().length < 4) return badRequest("Portal code must be at least 4 characters.");
      if (newCode !== confirmCode) return badRequest("Portal codes do not match.");

      user.adminPortalCode = newCode.trim();
      await user.save();
      return ok({}, "Portal code updated successfully.");
    }

    return badRequest("Invalid action. Use 'email', 'password', or 'portal-code'.");
  } catch (err) {
    return handleApiError(err);
  }
}
