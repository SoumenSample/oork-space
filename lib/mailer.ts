// import nodemailer from "nodemailer";

// export const sendEmailOTP = async (email: string, otp: string) => {
//   try {
//     // Log for debugging (in development)
//     console.log(`Attempting to send OTP email to: ${email}`);
//     console.log(`OTP: ${otp}`);

//     // transporter
//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS, // Gmail App Password
//       },
//     });

//     // email template
//     const mailOptions = {
//       from: `"Workspace Auth" <${process.env.EMAIL_USER}>`,
//       to: email,
//       subject: "Verify Your Email - OTP Code",
//       html: `
//         <div style="font-family:Arial; padding:20px;">
//           <h2>Email Verification</h2>
//           <p>Your verification code is:</p>

//           <div style="
//             font-size:32px;
//             font-weight:bold;
//             letter-spacing:8px;
//             color:#4f46e5;
//             margin:20px 0;
//           ">
//             ${otp}
//           </div>

//           <p>This code expires in 10 minutes.</p>

//           <p style="color:#888; font-size:12px;">
//             If you didn’t request this, ignore this email.
//           </p>
//         </div>
//       `,
//     };

//     // send email
//     await transporter.sendMail(mailOptions);

//     console.log(`OTP email sent successfully to: ${email}`);
//     return { success: true };
//   } catch (error) {
//     console.error("Failed to send OTP email:", error);
//     console.error("Email user:", process.env.EMAIL_USER);
//     console.error("Email pass length:", process.env.EMAIL_PASS?.length);
//     return { success: false };
//   }
// };


import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "kayalabhi04@gmail.com",
    pass: "jzdwcsrquixkekyf", // app password
  },
});

export const sendEmailOTP = async (email: string, otp: string) => {
  try {
    await transporter.sendMail({
      from: `"Workspace Auth" <${process.env.EMAIL_USER || process.env.EMAIL}>`,
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