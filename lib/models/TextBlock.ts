import mongoose, { Schema } from "mongoose";

const TextBlockSchema = new Schema(
  {
    databaseId: { type: String, required: true }, // project database id
    title: { type: String, default: "Text" },     // page name like notion
    content: { type: String, default: "" },       // text content
  },
  { timestamps: true }
);

export default mongoose.models.TextBlock ||
  mongoose.model("TextBlock", TextBlockSchema);
