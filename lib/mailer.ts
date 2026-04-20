import nodemailer from "nodemailer";

const SMTP_USER = process.env.SMTP_USER || process.env.EMAIL_USER || process.env.EMAIL || "";
const SMTP_PASS = process.env.SMTP_PASS || process.env.EMAIL_PASS || "";
const SMTP_SERVICE = process.env.SMTP_SERVICE || "gmail";

export function isMailerConfigured() {
  return Boolean(SMTP_USER && SMTP_PASS);
}

export function getMailerFrom(defaultName = "Workspace Auth") {
  const fromAddress = process.env.MAIL_FROM || SMTP_USER || process.env.EMAIL || "";
  return fromAddress ? `"${defaultName}" <${fromAddress}>` : undefined;
}

export const transporter = nodemailer.createTransport({
  service: SMTP_SERVICE,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

export const sendEmailOTP = async (email: string, otp: string) => {
  if (!isMailerConfigured()) {
    console.warn("SMTP is not configured. Skipping OTP email.");
    return { success: false };
  }

  try {
    await transporter.sendMail({
      from: getMailerFrom("Workspace Auth"),
      to: email,
      subject: "Verify Your Email - OTP Code",
      html: `
        <div style="font-family:Arial;padding:20px;line-height:1.5;">
          <h2 style="margin:0 0 8px;">Email Verification</h2>
          <p style="margin:0 0 14px;">Your verification code is:</p>
          <div style="font-size:30px;font-weight:700;letter-spacing:6px;color:#e11d48;margin:12px 0 16px;">${otp}</div>
          <p style="margin:0 0 8px;">This code expires in 10 minutes.</p>
          <p style="margin:0;color:#888;font-size:12px;">If you did not request this, you can ignore this email.</p>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    return { success: false };
  }
};