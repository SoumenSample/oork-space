import bcrypt from "bcryptjs";
import connectDB from "../../../lib/dbConnect";
import User from "../../../lib/models/User";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  await connectDB();

  const user = await User.findOne({ email });

  if (!user) {
    return Response.json({ success: false, message: "User not found" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  user.password = hashedPassword;
  await user.save();

  return Response.json({ success: true });
}