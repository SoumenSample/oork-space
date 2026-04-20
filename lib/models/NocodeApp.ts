import mongoose from "mongoose";

const NocodeAppSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    defaultDatabaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Database",
      default: null,
    },
    name: { type: String, required: true },
    key: { type: String, required: true, unique: true, index: true },
    status: { type: String, enum: ["active", "archived"], default: "active" },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV !== "production") {
  delete mongoose.models.NocodeApp;
}

export default mongoose.models.NocodeApp ||
  mongoose.model("NocodeApp", NocodeAppSchema);