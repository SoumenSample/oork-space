"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Crimson_Pro, DM_Sans } from "next/font/google";
const crimson = Crimson_Pro({
  subsets: ["latin"],
  weight: ["400", "700"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
});

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  // 1️⃣ Send OTP
  const sendOtp = async () => {
    const res = await fetch("/api/send-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    if (data.success) {
      alert("OTP sent");
      setStep(2);
    }
  };

  // 2️⃣ Verify OTP
  const verifyOtp = async () => {
    const res = await fetch("/api/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    });
    console.log(email,otp);

    const data = await res.json();
    console.log(data);
    if (data.success) {
      alert("OTP verified");
      setStep(3);
    } else {
      alert("Invalid OTP");
    }
  };

  // 3️⃣ Reset Password
  const resetPassword = async () => {
    const res = await fetch("/api/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (data.success) {
      alert("Password updated 🎉");
      router.push("/login");
    } else {
      alert(data.message);
    }
  };

  return (
    <div className={`flex justify-center items-center min-h-screen ${crimson.className} ${dmSans.variable} page-wrapper`}>
        <div className="bg-scene" aria-hidden>
        <div className="bg-base" />
        <div className="grid-lines" />
        <div className="scene-ring scene-ring-1" />
        <div className="scene-ring scene-ring-2" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        {Array.from({ length: 18 }, (_, index) => (
          <div key={`petal-${index}`} className={`petal petal-${index + 1}`} />
        ))}
      </div>
      <div className="bg-white p-6 shadow rounded w-96">

        {step === 1 && (
          <>
            <h2 className="text-lg font-bold mb-4">Enter Email</h2>
            <input
              className="border w-full p-2 mb-3"
              placeholder="Email"
              onChange={(e) => setEmail(e.target.value)}
            />
            <button onClick={sendOtp} className="bg-blue-500 text-white w-full py-2">
              Send OTP
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-lg font-bold mb-4">Enter OTP</h2>
            <input
              className="border w-full p-2 mb-3"
              placeholder="OTP"
              onChange={(e) => setOtp(e.target.value)}
            />
            <button onClick={verifyOtp} className="bg-green-500 text-white w-full py-2">
              Verify OTP
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-lg font-bold mb-4">New Password</h2>
            <input
              type="password"
              className="border w-full p-2 mb-3"
              placeholder="New Password"
              onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={resetPassword} className="bg-black text-white w-full py-2">
              Update Password
            </button>
          </>
        )}

      </div>
    </div>
  );
}