import mongoose from "mongoose";

const TodoViewSettingsSchema = new mongoose.Schema(
  {
    databaseId: { type: String, required: true, index: true, unique: true },

    // property ids that should be visible inside modal
    visiblePropIds: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.TodoViewSettings ||
  mongoose.model("TodoViewSettings", TodoViewSettingsSchema);
