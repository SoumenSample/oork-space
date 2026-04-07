import mongoose, { Schema } from "mongoose";

const BulletedListBlockSchema = new Schema(
  {
    databaseId: { type: String, required: true },
    text: { type: String, default: "" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.BulletedListBlock ||
  mongoose.model("BulletedListBlock", BulletedListBlockSchema);
