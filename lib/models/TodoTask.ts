// import mongoose, { Schema } from "mongoose";

// const TodoTaskSchema = new Schema(
//   {
//     databaseId: { type: String, required: true },

//     // Notion style title
//     title: { type: String, default: "New task" },

//     // checkbox in todo list
//     completed: { type: Boolean, default: false },

//     // optional future
//     position: { type: Number, default: 0 },
//   },
//   { timestamps: true }
// );

// export default mongoose.models.TodoTask ||
//   mongoose.model("TodoTask", TodoTaskSchema);



import mongoose, { Schema, models } from "mongoose";

const TodoTaskSchema = new Schema(
  {
    databaseId: { type: String, required: true },

    // Direct title field with default value
    title: { type: String, default: "new task" },

    // Checkbox completed status
    completed: { type: Boolean, default: false },

    // 🔥 Notion style values map
    values: { type: Object, default: {} },
  },
  { timestamps: true }
);

// Force using the latest schema by deleting the cached model
if (models.TodoTask) {
  delete models.TodoTask;
}

const TodoTask = mongoose.model("TodoTask", TodoTaskSchema);

export default TodoTask;
