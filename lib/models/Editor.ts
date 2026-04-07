import mongoose from "mongoose";

const EditorSchema = new mongoose.Schema({
  userId: { type: String, index: true },
  content: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

if (process.env.NODE_ENV !== "production") {
  delete mongoose.models.Editor;
}

export default mongoose.models.Editor ||
  mongoose.model("Editor", EditorSchema);