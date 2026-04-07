import mongoose from "mongoose";

const DatabaseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Database ||
  mongoose.model("Database", DatabaseSchema);
