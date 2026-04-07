import mongoose, { Schema, model, models } from "mongoose";

export type ColumnType =
  | "text"
  | "number"
  | "select"
  | "multi_select"
  | "status"
  | "date"
  | "person"
  | "checkbox"
  | "url"
  | "email"
  | "phone"
  | "formula";

const DatabaseColumnSchema = new Schema(
  {
    databaseId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Database",
    },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "text",
        "number",
        "select",
        "multi_select",
        "status",
        "date",
        "person",
        "checkbox",
        "url",
        "email",
        "phone",
        "formula",
      ],
      default: "text",
    },
    order: { type: Number, default: 0 },
    formula: { type: String, default: "" },

    // for select / status / multi-select
    options: [
      {
        label: String,
        color: String,
      },
    ],
  },
  { timestamps: true }
);

// Table isolation: keep lookups scoped by table id (databaseId).
DatabaseColumnSchema.index({ databaseId: 1, order: 1 });
DatabaseColumnSchema.index({ databaseId: 1, name: 1 });

export default models.DatabaseColumn ||
  model("DatabaseColumn", DatabaseColumnSchema);
