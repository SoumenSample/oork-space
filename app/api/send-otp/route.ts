import { transporter } from "@/lib/mailer";

let otpStore: Record<string, number> = {}; // temporary

export async function POST(req: Request) {
  const { email } = await req.json();

  const otp = Math.floor(100000 + Math.random() * 900000);

  otpStore[email] = otp;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "OTP Verification",
      text: `Your OTP is ${otp}`,
    });

    return Response.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send OTP";
    return Response.json({ success: false, error: message });
  }
}

// export store for verify API
export { otpStore };