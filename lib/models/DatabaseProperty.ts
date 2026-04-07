// import mongoose from "mongoose";

// const DatabasePropertySchema = new mongoose.Schema(
//   {
//     databaseId: {
//       type: mongoose.Schema.Types.ObjectId,
//       required: true,
//       index: true,
//     },
//     name: { type: String, required: true },
//     type: { type: String, required: true }, // text, select, date
//     options: { type: [String], default: [] },
//   },
//   { timestamps: true }
// );

// export default mongoose.models.DatabaseProperty ||
//   mongoose.model("DatabaseProperty", DatabasePropertySchema);


import mongoose, { Schema, models, model } from "mongoose";

const DatabasePropertySchema = new Schema(
  {
    databaseId: { type: String, required: true, index: true },

    name: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: [
        "title",
        "text",
        "number",
        "select",
        "multi_select",
        "date",
        "checkbox",
        "email",
        "formula",
        "files",
        "url",
        "person",
      ],
      default: "text",
    },

    options: { type: [String], default: [] },
    formula: { type: String, default: "" },
  },
  { timestamps: true }
);

// Force using the latest schema by deleting the cached model
if (models.DatabaseProperty) {
  delete models.DatabaseProperty;
}

export default models.DatabaseProperty ||
  model("DatabaseProperty", DatabasePropertySchema);
