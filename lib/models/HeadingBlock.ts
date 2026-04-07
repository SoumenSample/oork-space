import mongoose, { Schema } from "mongoose";

const HeadingBlockSchema = new Schema(
  {
    databaseId: { type: String, required: true },

    // Notion style heading
    text: { type: String, default: "" },

    // h1 | h2 | h3
    level: {
      type: String,
      enum: ["h1", "h2", "h3"],
      default: "h1",
    },
  },
  { timestamps: true }
);

export default mongoose.models.HeadingBlock ||
  mongoose.model("HeadingBlock", HeadingBlockSchema);
