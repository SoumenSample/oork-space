import mongoose, { Schema, models, model } from "mongoose";

const DatabaseItemSchema = new Schema(
  {
    databaseId: { type: Schema.Types.ObjectId, ref: "Database", required: true },

    title: { type: String, default: "New" },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    // extra fields
    assignedTo: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Todo", "In Progress", "Done", "Blocked"],
      default: "Todo",
    },
    comment: { type: String, default: "" },
  },
  { 
    timestamps: true,
    strict: true,
  }
);

// Force delete the cached model to ensure fresh schema
if (models.DatabaseItem) {
  delete models.DatabaseItem;
}

export default model("DatabaseItem", DatabaseItemSchema);
