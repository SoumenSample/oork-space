import mongoose from "mongoose";

const GalleryItemSchema = new mongoose.Schema(
  {
    databaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Database",
      required: true,
    },

    title: { type: String, default: "Untitled" },

    // Timeline-specific fields (optional for gallery)
    startDate: { type: Date },
    endDate: { type: Date },
    assignedTo: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Todo", "In Progress", "Done", "Blocked"],
      default: "Todo",
    },
    comment: { type: String, default: "" },

    // IMPORTANT: flexible values stored by propertyId for gallery view
    values: {
      type: Object,
      default: {},
    },
  },
  { 
    timestamps: true,
    strict: false // Allow flexible schema for values field
  }
);

export default mongoose.models.GalleryItem ||
  mongoose.model("GalleryItem", GalleryItemSchema);
