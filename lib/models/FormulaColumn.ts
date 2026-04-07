import mongoose, { Schema, models } from "mongoose";

const FormulaColumnSchema = new Schema(
  {
    tableId: {
      type: Schema.Types.ObjectId,
      ref: "Table",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true, // text | number | formula etc
    },
    formula: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

export default models.FormulaColumn ||
  mongoose.model("FormulaColumn", FormulaColumnSchema);