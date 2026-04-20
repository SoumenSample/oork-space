import mongoose from "mongoose";

const ProjectUserSchema = new mongoose.Schema(
  {
    appId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NocodeApp",
      required: true,
      index: true,
    },
    sourcePageSlug: { type: String, required: true, trim: true },
    name: { type: String, trim: true, default: "" },
    email: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    otp: { type: String, default: null },
    otpExpiry: { type: Date, default: null },
    isVerified: { type: Boolean, default: false },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ProjectUserSchema.index({ appId: 1, email: 1 }, { unique: true });
ProjectUserSchema.index({ appId: 1, createdAt: -1 });

if (process.env.NODE_ENV !== "production") {
  delete mongoose.models.ProjectUser;
}

export default mongoose.models.ProjectUser ||
  mongoose.model("ProjectUser", ProjectUserSchema);
