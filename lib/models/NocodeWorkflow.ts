import mongoose from "mongoose";

const NocodeWorkflowSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    appId: { type: mongoose.Schema.Types.ObjectId, ref: "NocodeApp", required: true, index: true },

    name: { type: String, required: true },
    key: { type: String, required: true, index: true },

    draftGraph: {
      nodes: { type: Array, default: [] },
      edges: { type: Array, default: [] },
    },

    publishedGraph: {
      nodes: { type: Array, default: [] },
      edges: { type: Array, default: [] },
      version: { type: Number, default: 0 },
      publishedAt: { type: Date, default: null },
    },

    status: { type: String, enum: ["draft", "published"], default: "draft" },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV !== "production") {
  delete mongoose.models.NocodeWorkflow;
}

export default mongoose.models.NocodeWorkflow ||
  mongoose.model("NocodeWorkflow", NocodeWorkflowSchema);