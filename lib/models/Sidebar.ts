// import mongoose, { Schema, Document, Model } from "mongoose";

// export interface IPage extends Document {
//   pageName: string;
//   menuKey: string;
//   createdAt: Date;
//   updatedAt: Date;
// }

// const PageSchema: Schema<IPage> = new Schema(
//   {
//     pageName: { type: String, required: true, trim: true },
//     menuKey: { type: String, required: true, trim: true },
//   },
//   { timestamps: true }
// );

// const Page: Model<IPage> =
//   mongoose.models.Page || mongoose.model<IPage>("Page", PageSchema);

// export default Page;



import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPage extends Document {
  pageName: string;
  menuKey: string;
  emoji: string; // ✅ NEW
  createdAt: Date;
  updatedAt: Date;
}

const PageSchema: Schema<IPage> = new Schema(
  {
    pageName: { type: String, required: true, trim: true },
    menuKey: { type: String, required: true, trim: true },
    emoji: { type: String, default: "📄" }, // ✅ NEW
  },
  { timestamps: true }
);

const Page: Model<IPage> =
  mongoose.models.Page || mongoose.model<IPage>("Page", PageSchema);

export default Page
