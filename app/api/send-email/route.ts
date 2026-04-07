import nodemailer from "nodemailer";

export async function POST(req: Request) {
  const { email } = await req.json();

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "kayalabhi04@gmail.com",
      pass: "jzdwcsrquixkekyf",
    },
  });

  await transporter.sendMail({
    from: "kayalabhi04@gmail.com",
    to: email,
    subject: "Hello from your app",
    text: "you are assigned for a task",
  });

  return Response.json({ success: true });
}