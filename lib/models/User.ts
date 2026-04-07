// import mongoose, { Schema, model, models } from "mongoose";
// import bcrypt from "bcryptjs";

// export interface IUser {
//   name: string;
//   email: string;
//   password: string;
//   otp?: string;
//   otpExpiry?: Date;
//   isVerified: boolean;
//   createdAt?: Date;
//   updatedAt?: Date;
// }

// const UserSchema = new Schema<IUser>(
//   {
//     name: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     email: {
//       type: String,
//       required: true,
//       unique: true,
//       lowercase: true,
//       trim: true,
//     },

//     password: {
//       type: String,
//       required: true,
//       minlength: 6,
//     },

//     // email verification OTP
//     otp: {
//       type: String,
//     },

//     otpExpiry: {
//       type: Date,
//     },

//     isVerified: {
//       type: Boolean,
//       default: false,
//     },
//   },
//   { timestamps: true }
// );


// // 🔐 Hash password before saving
// UserSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();

//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);

//   next();
// });


// // 🔑 Compare password method
// UserSchema.methods.comparePassword = async function (password: string) {
//   return bcrypt.compare(password, this.password);
// };


// // prevent model overwrite in Next.js hot reload
// const User = models.User || model<IUser>("User", UserSchema);

// export default User;
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, trim: true, default: "" },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  otp: { type: String },
  otpExpiry: { type: Date },
  isVerified: { type: Boolean, default: false },
  isOAuth: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", UserSchema);