import mongoose, { Schema, models } from "mongoose";

const TodoPropertySchema = new Schema(
  {
    databaseId: { type: String, required: true },

    name: { type: String, required: true }, // ex: Name, Status, Due date
    type: { type: String, required: true }, // title, checkbox, select, date...

    options: { type: [String], default: [] }, // select/multi_select
  },
  { timestamps: true }
);

export default models.TodoProperty ||
  mongoose.model("TodoProperty", TodoPropertySchema);
