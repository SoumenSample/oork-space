import mongoose, { Schema, model, models } from "mongoose";

const DatabaseRowSchema = new Schema(
  {
    databaseId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Database",
    },

    // cells[columnId] = value
    cells: { type: Schema.Types.Mixed, default: {} },

    createdBy: { type: String, default: "system" },
    updatedBy: { type: String, default: "system" },
  },
  { timestamps: true }
);

// Table isolation: keep row queries and ordering scoped by table id.
DatabaseRowSchema.index({ databaseId: 1, createdAt: 1 });

export default models.DatabaseRow || model("DatabaseRow", DatabaseRowSchema);
