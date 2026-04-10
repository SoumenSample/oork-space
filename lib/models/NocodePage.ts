import mongoose from "mongoose";

const NocodePageSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    appId: { type: mongoose.Schema.Types.ObjectId, ref: "NocodeApp", required: true, index: true },

    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },

    draft: {
      grapesProjectData: { type: mongoose.Schema.Types.Mixed, default: null },
      html: { type: String, default: "" },
      css: { type: String, default: "" },
      js: { type: String, default: "" },
      bindings: { type: mongoose.Schema.Types.Mixed, default: [] },
    },

    published: {
      grapesProjectData: { type: mongoose.Schema.Types.Mixed, default: null },
      html: { type: String, default: "" },
      css: { type: String, default: "" },
      js: { type: String, default: "" },
      bindings: { type: mongoose.Schema.Types.Mixed, default: [] },
      version: { type: Number, default: 0 },
      publishedAt: { type: Date, default: null },
    },

    status: { type: String, enum: ["draft", "published"], default: "draft" },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV !== "production") {
  delete mongoose.models.NocodePage;
}

export default mongoose.models.NocodePage ||
  mongoose.model("NocodePage", NocodePageSchema);