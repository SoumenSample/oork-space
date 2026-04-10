import mongoose from "mongoose";

const NocodeRunSchema = new mongoose.Schema(
  {
    userId: { type: String, required: false, index: true },
    appId: { type: mongoose.Schema.Types.ObjectId, ref: "NocodeApp", required: true, index: true },
    workflowId: { type: mongoose.Schema.Types.ObjectId, ref: "NocodeWorkflow", required: true, index: true },

    triggerType: { type: String, required: true },
    triggerPayload: { type: mongoose.Schema.Types.Mixed, default: {} },

    status: { type: String, enum: ["queued", "running", "success", "failed"], default: "queued", index: true },

    stepLogs: {
      type: [
        {
          nodeId: String,
          nodeType: String,
          status: String,
          input: mongoose.Schema.Types.Mixed,
          output: mongoose.Schema.Types.Mixed,
          error: String,
          startedAt: Date,
          endedAt: Date,
        },
      ],
      default: [],
    },

    error: { type: String, default: "" },
    startedAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV !== "production") {
  delete mongoose.models.NocodeRun;
}

export default mongoose.models.NocodeRun ||
  mongoose.model("NocodeRun", NocodeRunSchema);