import mongoose from "mongoose";

export const PROPERTY_TYPES = [
  "text",
  "number",
  "select",
  "multi_select",
  "status",
  "date",
  "person",
  "files",
  "checkbox",
  "url",
  "email",
  "phone",
  "formula",
  "relation",
] as const;

const DatabasePropertySchema = new mongoose.Schema(
  {
    databaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Database",
      required: true,
    },

    name: { type: String, required: true },

    type: {
      type: String,
      enum: PROPERTY_TYPES,
      default: "text",
      required: true,
    },

    // for select/multi_select/status
    options: [
      {
        label: { type: String },
        color: { type: String, default: "gray" },
      },
    ],

    // formula config
    formula: {
      expression: { type: String, default: "" },
    },

    // relation config
    relation: {
      relatedDatabaseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Database",
        default: null,
      },
    },
  },
  { timestamps: true }
);

export default mongoose.models.DatabaseProperty ||
  mongoose.model("DatabaseProperty", DatabasePropertySchema);
