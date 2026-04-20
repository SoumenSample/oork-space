import { getMailerFrom, isMailerConfigured, transporter } from "@/lib/mailer";

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!isMailerConfigured()) {
    return Response.json({ success: false, error: "SMTP is not configured" }, { status: 500 });
  }

  await transporter.sendMail({
    from: getMailerFrom("OORK-SPACE"),
    to: email,
    subject: "Hello from your app",
    text: "you are assigned for a task",
  });

  return Response.json({ success: true });
}