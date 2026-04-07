"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";

type Props = { isOpen: boolean; onClose: () => void; initialMode?: "sign-in" | "sign-up" };

type SignInForm = { email: string; password: string };
type SignUpForm = { username: string; email: string; password: string; confirm: string; agree: boolean };
type Errors<T> = Partial<Record<keyof T, string>>;

export default function AuthModal({ isOpen, onClose, initialMode = "sign-in" }: Props) {
  const [mode, setMode] = useState<"sign-in" | "sign-up">(initialMode);
  const [visible, setVisible] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [signIn, setSignIn] = useState<SignInForm>({ email: "", password: "" });
  const [signUp, setSignUp] = useState<SignUpForm>({ username: "", email: "", password: "", confirm: "", agree: false });
  const [siErrors, setSiErrors] = useState<Errors<SignInForm>>({});
  const [suErrors, setSuErrors] = useState<Errors<SignUpForm>>({});
  const [siSuccess, setSiSuccess] = useState(false);
  const [suSuccess, setSuSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  // OTP state
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => setVisible(true), 10);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = "";
      setVisible(false);
    };
  }, [isOpen]);

  const toggle = () => {
    setMode(m => m === "sign-in" ? "sign-up" : "sign-in");
    setSiErrors({}); setSuErrors({});
    setError("");
    setOtpStep(false);
    setOtp(Array(6).fill(""));
  };

  // Validation
  const validateSignIn = () => {
    const e: Errors<SignInForm> = {};
    if (!signIn.email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(signIn.email)) e.email = "Enter a valid email";
    if (!signIn.password) e.password = "Password is required";
    else if (signIn.password.length < 6) e.password = "Min 6 characters";
    setSiErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateSignUp = () => {
    const e: Errors<SignUpForm> = {};
    if (!signUp.username) e.username = "Username is required";
    else if (signUp.username.length < 3) e.username = "Min 3 characters";
    if (!signUp.email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(signUp.email)) e.email = "Enter a valid email";
    if (!signUp.password) e.password = "Password is required";
    else if (signUp.password.length < 8) e.password = "Min 8 characters";
    if (!signUp.confirm) e.confirm = "Please confirm password";
    else if (signUp.confirm !== signUp.password) e.confirm = "Passwords do not match";
    if (!signUp.agree) e.agree = "You must accept terms";
    setSuErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignIn = async () => {
    if (!validateSignIn()) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: signIn.email, password: signIn.password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.message === "Please verify your email first") {
          // Still allow login but show OTP step
          setOtpStep(true);
          setError("");
          setLoading(false);
          return;
        }
        throw new Error(data.message || "Login failed");
      }

      setSiSuccess(true);
      setTimeout(() => { 
        setSiSuccess(false); 
        const userId = data.user?.id ? String(data.user.id) : "";
        login({ id: userId, email: data.user?.email || signIn.email, name: data.user?.name });
        if (userId) {
          router.push(`/${userId}`);
          return;
        }
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err.message);
    }

    setLoading(false);
  };

  const handleSignUp = async () => {
    if (!validateSignUp()) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: signUp.username, email: signUp.email, password: signUp.password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Signup failed");

      setSuSuccess(true);
      setTimeout(() => { 
        setSuSuccess(false); 
        setMode("sign-in"); 
        setOtpStep(true);
      }, 1800);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Signup failed");
    }

    setLoading(false);
  };

  const handleOtpChange = (v: string, i: number) => {
    if (!/^[0-9]?$/.test(v)) return;
    const copy = [...otp];
    copy[i] = v;
    setOtp(copy);
  };

  const handleVerifyOtp = async () => {
    setOtpError("");
    setOtpLoading(true);
    const emailToVerify = mode === "sign-in" ? signIn.email : signUp.email;

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: emailToVerify,
          otp: otp.join(""),
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Verification failed");

      // Success - login and redirect
      const userId = data.user?.id ? String(data.user.id) : "";
      login({ id: userId, email: data.user?.email || emailToVerify, name: data.user?.name });
      if (userId) {
        router.push(`/${userId}`);
      } else {
        router.push("/");
      }
    } catch (err: unknown) {
      const error = err as Error;
      setOtpError(error.message);
    }

    setOtpLoading(false);
  };

  if (!isOpen) return null;
  const isSignIn = mode === "sign-in";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');

        .am-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: linear-gradient(135deg, rgba(180, 83, 120, 0.15) 0%, rgba(100, 108, 255, 0.15) 100%);
          backdrop-filter: blur(20px);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.4s ease;
          font-family: 'Outfit', sans-serif;
        }
        .am-overlay.am-vis { opacity: 1; }

        .am-box {
          position: relative;
          width: min(900px, 96vw);
          height: min(580px, 94vh);
          border-radius: 24px;
          overflow: hidden;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 25px 80px rgba(180, 83, 120, 0.25), 0 10px 40px rgba(100, 108, 255, 0.15);
        }
        .am-overlay.am-vis .am-box {
          transform: translateY(0);
          opacity: 1;
        }

        /* Background */
        .am-bg {
          position: absolute; inset: 0;
          background: linear-gradient(145deg, #1a1625 0%, #231e35 50%, #1a1625 100%);
        }

        /* Gradient orbs */
        .am-orb {
          position: absolute; border-radius: 50%; pointer-events: none;
          filter: blur(80px);
          transition: all 0.6s ease;
        }
        .am-orb-1 {
          width: 350px; height: 350px;
          top: -100px; left: -100px;
          background: radial-gradient(circle, rgba(255, 183, 178, 0.25), transparent 70%);
        }
        .am-orb-2 {
          width: 300px; height: 300px;
          bottom: -80px; right: -80px;
          background: radial-gradient(circle, rgba(159, 168, 255, 0.25), transparent 70%);
        }
        .am-orb-3 {
          width: 200px; height: 200px;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle, rgba(255, 134, 176, 0.15), transparent 70%);
        }

        /* Layout */
        .am-layout {
          position: absolute; inset: 0;
          display: flex;
        }

        /* Panel (rose gold side) */
        .am-panel {
          width: 42%;
          height: 100%;
          position: relative;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 3rem 2.5rem;
          text-align: center;
          overflow: hidden;
          flex-shrink: 0;
          transition: order 0s;
        }
        .am-panel::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(145deg, #b45373 0%, #c96a8a 40%, #e88ba3 70%, #f5b7c4 100%);
          z-index: 0;
        }
        .am-panel::after {
          content: '';
          position: absolute;
          width: 280px; height: 280px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.15);
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          z-index: 1;
        }
        .am-panel-inner { position: relative; z-index: 2; }

        .am-panel-ring {
          position: absolute; border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.1);
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          z-index: 1;
          animation: am-ring-pulse 4s ease-in-out infinite;
        }
        @keyframes am-ring-pulse {
          0%,100% { transform: translate(-50%,-50%) scale(1); opacity: 0.4; }
          50%      { transform: translate(-50%,-50%) scale(1.05); opacity: 0.8; }
        }

        .am-panel-logo {
          font-family: 'Outfit', sans-serif;
          font-size: 1.8rem; font-weight: 700;
          color: #fff; margin-bottom: 2.5rem;
          letter-spacing: -0.02em;
          text-shadow: 0 2px 20px rgba(0,0,0,0.3);
        }
        .am-panel-logo span { color: rgba(255,255,255,0.6); }

        .am-panel-title {
          font-family: 'Outfit', sans-serif;
          font-size: clamp(1.5rem, 2.5vw, 2.2rem);
          font-weight: 700; color: #fff;
          margin-bottom: 0.75rem;
          line-height: 1.2;
          text-shadow: 0 2px 20px rgba(0,0,0,0.3);
        }
        .am-panel-desc {
          font-size: 0.85rem;
          color: rgba(255,255,255,0.75);
          line-height: 1.7; margin-bottom: 2rem;
          max-width: 280px;
        }
        .am-panel-switch {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.6rem 1.6rem;
          border-radius: 999px;
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.35);
          color: #fff; font-size: 0.85rem; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
          backdrop-filter: blur(8px);
          font-family: 'Outfit', sans-serif;
        }
        .am-panel-switch:hover {
          background: rgba(255,255,255,0.3);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        }

        /* Form side */
        .am-form-side {
          flex: 1;
          display: flex; align-items: center; justify-content: center;
          padding: 2.5rem 2rem;
          overflow-y: auto;
        }
        .am-form-inner { width: 100%; max-width: 340px; }

        .am-form-title {
          font-family: 'Outfit', sans-serif;
          font-size: 1.7rem; font-weight: 700;
          color: #fff; margin-bottom: 0.2rem;
        }
        .am-form-sub {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.4);
          margin-bottom: 1.5rem;
        }

        /* Social */
        .am-social { display: flex; gap: 0.6rem; margin-bottom: 1.2rem; }
        .am-social-btn {
          flex: 1; padding: 0.6rem 0.5rem;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.8);
          font-size: 0.78rem; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 0.4rem;
          font-family: 'Outfit', sans-serif;
          transition: all 0.2s;
        }
        .am-social-btn:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.2);
          transform: translateY(-1px);
        }

        .am-divider {
          display: flex; align-items: center; gap: 0.6rem;
          margin: 1rem 0;
        }
        .am-divider::before,.am-divider::after {
          content:''; flex:1; height:1px;
          background: rgba(255,255,255,0.08);
        }
        .am-divider span {
          font-size: 0.7rem; color: rgba(255,255,255,0.25);
          white-space: nowrap;
        }

        /* Fields */
        .am-field { margin-bottom: 0.9rem; }
        .am-label {
          display: flex; align-items: center; gap: 0.3rem;
          font-size: 0.75rem; font-weight: 600;
          color: rgba(255,255,255,0.5);
          margin-bottom: 0.4rem; letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .am-required {
          color: #ff8fab; font-size: 0.8rem; line-height: 1;
        }
        .am-input-wrap {
          position: relative;
        }
        .am-input-icon {
          position: absolute; left: 0.9rem; top: 50%;
          transform: translateY(-50%);
          font-size: 0.95rem; color: rgba(255,255,255,0.3);
          pointer-events: none; z-index: 1;
        }
        .am-input-right {
          position: absolute; right: 0.9rem; top: 50%;
          transform: translateY(-50%);
          cursor: pointer; font-size: 0.9rem;
          color: rgba(255,255,255,0.3);
          transition: color 0.2s; z-index: 1;
          background: none; border: none;
        }
        .am-input-right:hover { color: rgba(255,255,255,0.6); }

        .am-input {
          width: 100%;
          padding: 0.75rem 2.8rem 0.75rem 2.6rem;
          background: rgba(255,255,255,0.06);
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          color: #fff; font-size: 0.9rem;
          font-family: 'Outfit', sans-serif;
          outline: none;
          transition: border-color 0.25s, background 0.25s, box-shadow 0.25s;
        }
        .am-input::placeholder { color: rgba(255,255,255,0.25); }
        .am-input:focus {
          border-color: #c96a8a;
          background: rgba(201, 106, 138, 0.08);
          box-shadow: 0 0 0 3px rgba(201, 106, 138, 0.15), inset 0 1px 0 rgba(255,255,255,0.04);
        }
        .am-input.am-err {
          border-color: #ff6b9d;
          background: rgba(255, 107, 157, 0.08);
        }
        .am-input.am-err:focus {
          box-shadow: 0 0 0 3px rgba(255, 107, 157, 0.15);
        }
        .am-input.am-ok { border-color: rgba(159, 168, 255, 0.5); }

        .am-error-msg {
          font-size: 0.7rem; color: #ff8fab;
          margin-top: 0.35rem;
          display: flex; align-items: center; gap: 0.3rem;
        }

        /* Password strength */
        .am-strength {
          display: flex; gap: 3px; margin-top: 0.45rem;
        }
        .am-strength-bar {
          flex: 1; height: 3px; border-radius: 2px;
          background: rgba(255,255,255,0.1);
          transition: background 0.3s;
        }

        /* Checkbox */
        .am-check-row {
          display: flex; align-items: flex-start; gap: 0.65rem;
          margin-bottom: 1rem;
        }
        .am-checkbox {
          width: 20px; height: 20px; border-radius: 6px;
          border: 1.5px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.05);
          cursor: pointer; flex-shrink: 0; margin-top: 1px;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .am-checkbox.checked {
          background: linear-gradient(135deg, #c96a8a, #9f68ff);
          border-color: #c96a8a;
        }
        .am-check-label {
          font-size: 0.76rem; color: rgba(255,255,255,0.45);
          line-height: 1.5; cursor: pointer;
        }
        .am-check-label a { color: #ff8fab; text-decoration: none; }
        .am-check-label a:hover { text-decoration: underline; }

        /* CTA */
        .am-cta {
          width: 100%; padding: 0.8rem;
          border: none; border-radius: 14px;
          background: linear-gradient(135deg, #c96a8a 0%, #9f68ff 100%);
          color: #fff; font-size: 0.95rem; font-weight: 600;
          cursor: pointer; font-family: 'Outfit', sans-serif;
          box-shadow: 0 4px 20px rgba(201, 106, 138, 0.35);
          transition: all 0.25s;
          position: relative; overflow: hidden;
        }
        .am-cta::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.2), transparent);
          opacity: 0; transition: opacity 0.2s;
        }
        .am-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(201, 106, 138, 0.45); }
        .am-cta:hover::before { opacity: 1; }
        .am-cta:active { transform: translateY(0); }
        .am-cta:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
        .am-cta.am-success {
          background: linear-gradient(135deg, #6ee7b7, #34d399) !important;
          box-shadow: 0 4px 20px rgba(110, 231, 183, 0.4) !important;
        }

        /* Toggle */
        .am-toggle-text {
          font-size: 0.76rem; color: rgba(255,255,255,0.35);
          text-align: center; margin-top: 1.1rem;
        }
        .am-toggle-text b {
          color: #ff8fab; cursor: pointer; font-weight: 600;
        }
        .am-toggle-text b:hover { text-decoration: underline; }

        /* Close */
        .am-close {
          position: absolute; top: 1rem; right: 1rem; z-index: 20;
          width: 34px; height: 34px; border-radius: 50%;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.5); font-size: 1.1rem;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s; line-height: 1;
        }
        .am-close:hover {
          background: rgba(255,255,255,0.15); color: #fff;
          transform: rotate(90deg);
        }

        /* Error banner */
        .am-error-banner {
          background: rgba(255, 107, 157, 0.15);
          border: 1px solid rgba(255, 107, 157, 0.3);
          border-radius: 10px;
          padding: 0.6rem 0.8rem;
          margin-bottom: 1rem;
          font-size: 0.75rem; color: #ff8fab;
          text-align: center;
        }

        /* OTP */
        .am-otp-wrap {
          display: flex; gap: 0.5rem; justify-content: center; margin-bottom: 1rem;
        }
        .am-otp-input {
          width: 44px; height: 50px;
          text-align: center;
          font-size: 1.2rem; font-weight: 600;
          border-radius: 10px;
          border: 1.5px solid rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.06);
          color: #fff;
          outline: none;
          transition: all 0.2s;
        }
        .am-otp-input:focus {
          border-color: #c96a8a;
          background: rgba(201, 106, 138, 0.1);
        }

        /* Mobile */
        @media (max-width: 640px) {
          .am-panel { display: none; }
          .am-form-side { padding: 2rem 1.5rem; }
          .am-box { height: auto; min-height: min(600px, 95vh); }
        }
      `}</style>

      <div
        className={`am-overlay ${visible ? "am-vis" : ""}`}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="am-box">
          <button className="am-close" onClick={onClose}>✕</button>

          {/* Background layers */}
          <div className="am-bg" />
          <div className="am-orb am-orb-1" />
          <div className="am-orb am-orb-2" />
          <div className="am-orb am-orb-3" />

          <div className="am-layout" style={{ flexDirection: isSignIn ? "row" : "row-reverse" }}>

            {/* ── Rose Gold Panel ── */}
            <div className="am-panel">
              <div className="am-panel-ring" style={{ width: 200, height: 200 }} />
              <div className="am-panel-ring" style={{ width: 320, height: 320, animationDelay: "1s" }} />
              <div className="am-panel-ring" style={{ width: 420, height: 420, animationDelay: "2s" }} />
              <div className="am-panel-inner">
                <div className="am-panel-logo">ooak<span>space</span></div>
                <div className="am-panel-title">
                  {isSignIn ? "New here?" : "One of us?"}
                </div>
                <div className="am-panel-desc">
                  {isSignIn
                    ? "Create an account and start your journey with ooakspace's powerful tools."
                    : "Already have an account? Sign in and pick up right where you left off."}
                </div>
                <button className="am-panel-switch" onClick={toggle}>
                  {isSignIn ? "Create Account →" : "← Sign In"}
                </button>
              </div>
            </div>

            {/* ── Form Side ── */}
            <div className="am-form-side">
              {otpStep ? (
                <OtpForm
                  otp={otp}
                  onChange={handleOtpChange}
                  onSubmit={handleVerifyOtp}
                  loading={otpLoading}
                  error={otpError}
                  onBack={() => setOtpStep(false)}
                />
              ) : isSignIn ? (
                <SignInForm
                  data={signIn} setData={setSignIn}
                  errors={siErrors}
                  showPass={showPass} setShowPass={setShowPass}
                  onSubmit={handleSignIn}
                  success={siSuccess}
                  onToggle={toggle}
                  loading={loading}
                  error={error}
                />
              ) : (
                <SignUpForm
                  data={signUp} setData={setSignUp}
                  errors={suErrors}
                  showPass={showPass} setShowPass={setShowPass}
                  showConfirm={showConfirm} setShowConfirm={setShowConfirm}
                  onSubmit={handleSignUp}
                  success={suSuccess}
                  onToggle={toggle}
                  loading={loading}
                  error={error}
                />
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

// ─── Reusable field ───────────────────────────────────────────
function Field({
  label, icon, error, children,
}: {
  label: string; icon: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="am-field">
      <div className="am-label">
        {icon} {label} <span className="am-required">*</span>
      </div>
      <div className="am-input-wrap">{children}</div>
      {error && (
        <div className="am-error-msg">
          <span>⚠</span> {error}
        </div>
      )}
    </div>
  );
}

// ─── Password strength ─────────────────────────────────────────
function strengthLevel(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const strengthColors = ["transparent", "#ff6b6b", "#ffa94d", "#ffd43b", "#c96a8a"];
const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];

// ─── Google SVG ───────────────────────────────────────────────
const GoogleSVG = () => (
  <svg width="14" height="14" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

// ─── OTP Form ─────────────────────────────────────────────
function OtpForm({ otp, onChange, onSubmit, loading, error, onBack }: {
  otp: string[];
  onChange: (v: string, i: number) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string;
  onBack: () => void;
}) {
  return (
    <div className="am-form-inner">
      <div className="am-form-title">Verify Email</div>
      <div className="am-form-sub">Enter the 6-digit code sent to your email</div>

      {error && <div className="am-error-banner">{error}</div>}

      <div className="am-otp-wrap">
        {otp.map((v, i) => (
          <input
            key={i}
            className="am-otp-input"
            value={v}
            maxLength={1}
            onChange={(e) => onChange(e.target.value, i)}
            autoFocus={i === 0}
          />
        ))}
      </div>

      <button className="am-cta" onClick={onSubmit} disabled={loading || otp.join("").length < 6}>
        {loading ? "Verifying..." : "Verify Code"}
      </button>

      <div className="am-toggle-text">
        Did not receive code? <b>Resend</b>
      </div>
      
      <div className="am-toggle-text">
        <b onClick={onBack}>← Back to form</b>
      </div>
    </div>
  );
}

// ─── Sign In Form ─────────────────────────────────────────────
function SignInForm({ data, setData, errors, showPass, setShowPass, onSubmit, success, onToggle, loading, error }: {
  data: SignInForm;
  setData: React.Dispatch<React.SetStateAction<SignInForm>>;
  errors: Errors<SignInForm>;
  showPass: boolean;
  setShowPass: (v: boolean) => void;
  onSubmit: () => void;
  success: boolean;
  onToggle: () => void;
  loading: boolean;
  error: string;
}) {
  return (
    <div className="am-form-inner">
      <div className="am-form-title">Welcome back</div>
      <div className="am-form-sub">Sign in to your ooakspace account</div>

      <div className="am-social">
        <button className="am-social-btn"><GoogleSVG /> Google</button>
        <button className="am-social-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Facebook
        </button>
      </div>

      <div className="am-divider"><span>or sign in with email</span></div>

      {error && <div className="am-error-banner">{error}</div>}

      <Field label="Email Address" icon="✉️" error={errors.email}>
        <span className="am-input-icon">✉️</span>
        <input
          className={`am-input ${errors.email ? "am-err" : data.email ? "am-ok" : ""}`}
          type="email" placeholder="you@example.com"
          value={data.email}
          onChange={e => setData(d => ({ ...d, email: e.target.value }))}
        />
        {data.email && !errors.email && <span className="am-input-right" style={{ pointerEvents: "none" }}>✓</span>}
      </Field>

      <Field label="Password" icon="🔒" error={errors.password}>
        <span className="am-input-icon">🔒</span>
        <input
          className={`am-input ${errors.password ? "am-err" : data.password ? "am-ok" : ""}`}
          type={showPass ? "text" : "password"} placeholder="Your password"
          value={data.password}
          onChange={e => setData(d => ({ ...d, password: e.target.value }))}
        />
        <button className="am-input-right" onClick={() => setShowPass(!showPass)}>
          {showPass ? "🙈" : "👁️"}
        </button>
      </Field>

      <button className="am-forgot" style={{ 
        display: "block", textAlign: "right",
        fontSize: "0.75rem", color: "rgba(255,255,255,0.35)",
        cursor: "pointer", marginTop: "-0.4rem", marginBottom: "0.9rem",
        background: "none", border: "none", fontFamily: "'Outfit', sans-serif",
        transition: "color 0.2s"
      }}>Forgot password?</button>

      <button className={`am-cta ${success ? "am-success" : ""}`} onClick={onSubmit} disabled={loading}>
        {success ? "✓ Signed In!" : loading ? "Signing in..." : "Sign In →"}
      </button>

      <div className="am-toggle-text">
        Do not have an account? <b onClick={onToggle}>Sign up here</b>
      </div>
    </div>
  );
}

// ─── Sign Up Form ─────────────────────────────────────────────
function SignUpForm({ data, setData, errors, showPass, setShowPass, showConfirm, setShowConfirm, onSubmit, success, onToggle, loading, error }: {
  data: SignUpForm;
  setData: React.Dispatch<React.SetStateAction<SignUpForm>>;
  errors: Errors<SignUpForm>;
  showPass: boolean; setShowPass: (v: boolean) => void;
  showConfirm: boolean; setShowConfirm: (v: boolean) => void;
  onSubmit: () => void;
  success: boolean;
  onToggle: () => void;
  loading: boolean;
  error: string;
}) {
  const strength = strengthLevel(data.password);

  return (
    <div className="am-form-inner">
      <div className="am-form-title">Create account</div>
      <div className="am-form-sub">Join ooakspace — it is free forever</div>

      <div className="am-social">
        <button className="am-social-btn"><GoogleSVG /> Google</button>
        <button className="am-social-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Facebook
        </button>
      </div>

      <div className="am-divider"><span>or register with email</span></div>

      {error && <div className="am-error-banner">{error}</div>}

      <Field label="Username" icon="👤" error={errors.username}>
        <span className="am-input-icon">👤</span>
        <input
          className={`am-input ${errors.username ? "am-err" : data.username ? "am-ok" : ""}`}
          type="text" placeholder="coolname123"
          value={data.username}
          onChange={e => setData(d => ({ ...d, username: e.target.value }))}
        />
        {data.username && !errors.username && <span className="am-input-right" style={{ pointerEvents: "none" }}>✓</span>}
      </Field>

      <Field label="Email Address" icon="✉️" error={errors.email}>
        <span className="am-input-icon">✉️</span>
        <input
          className={`am-input ${errors.email ? "am-err" : data.email ? "am-ok" : ""}`}
          type="email" placeholder="you@example.com"
          value={data.email}
          onChange={e => setData(d => ({ ...d, email: e.target.value }))}
        />
        {data.email && !errors.email && <span className="am-input-right" style={{ pointerEvents: "none" }}>✓</span>}
      </Field>

      <Field label="Password" icon="🔒" error={errors.password}>
        <span className="am-input-icon">🔒</span>
        <input
          className={`am-input ${errors.password ? "am-err" : data.password ? "am-ok" : ""}`}
          type={showPass ? "text" : "password"} placeholder="Min 8 characters"
          value={data.password}
          onChange={e => setData(d => ({ ...d, password: e.target.value }))}
        />
        <button className="am-input-right" onClick={() => setShowPass(!showPass)}>
          {showPass ? "🙈" : "👁️"}
        </button>
        {data.password && (
          <>
            <div className="am-strength">
              {[1,2,3,4].map(i => (
                <div key={i} className="am-strength-bar"
                  style={{ background: i <= strength ? strengthColors[strength] : undefined }} />
              ))}
            </div>
            <div style={{ fontSize: "0.7rem", color: strengthColors[strength], marginTop: "0.25rem" }}>
              {strengthLabels[strength]}
            </div>
          </>
        )}
      </Field>

      <Field label="Confirm Password" icon="🔏" error={errors.confirm}>
        <span className="am-input-icon">🔏</span>
        <input
          className={`am-input ${errors.confirm ? "am-err" : data.confirm ? "am-ok" : ""}`}
          type={showConfirm ? "text" : "password"} placeholder="Repeat password"
          value={data.confirm}
          onChange={e => setData(d => ({ ...d, confirm: e.target.value }))}
        />
        <button className="am-input-right" onClick={() => setShowConfirm(!showConfirm)}>
          {showConfirm ? "🙈" : "👁️"}
        </button>
      </Field>

      {/* Terms checkbox */}
      <div className="am-check-row">
        <div
          className={`am-checkbox ${data.agree ? "checked" : ""}`}
          onClick={() => setData(d => ({ ...d, agree: !d.agree }))}
        >
          {data.agree && <span style={{ fontSize: "0.75rem", color: "#fff", fontWeight: 700 }}>✓</span>}
        </div>
        <div
          className="am-check-label"
          onClick={() => setData(d => ({ ...d, agree: !d.agree }))}
        >
          I agree to the <a href="#" onClick={e => e.stopPropagation()}>Terms of Service</a> and{" "}
          <a href="#" onClick={e => e.stopPropagation()}>Privacy Policy</a>
        </div>
      </div>
      {errors.agree && <div className="am-error-msg" style={{ marginTop: "-0.5rem", marginBottom: "0.5rem" }}>⚠ {errors.agree}</div>}

      <button className={`am-cta ${success ? "am-success" : ""}`} onClick={onSubmit} disabled={loading}>
        {success ? "✓ Account Created!" : loading ? "Creating..." : "Create Account →"}
      </button>

      <div className="am-toggle-text">
        Already have an account? <b onClick={onToggle}>Sign in here</b>
      </div>
    </div>
  );
}
