import mongoose, { Schema } from "mongoose";

const NumberListBlockSchema = new Schema(
  {
    databaseId: { type: String, required: true },

    // each list item is a row
    text: { type: String, default: "" },

    // order for sorting
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.NumberListBlock ||
  mongoose.model("NumberListBlock", NumberListBlockSchema);
