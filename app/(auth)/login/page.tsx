"use client";

import Link from "next/link";
import { Crimson_Pro, DM_Sans } from "next/font/google";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const crimson = Crimson_Pro({
  subsets: ["latin"],
  weight: ["400", "700"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
});

type FieldErrors = {
  email?: string;
  password?: string;
  generic?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const validate = () => {
    const nextErrors: FieldErrors = {};

    if (!email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      nextErrors.email = "Enter a valid email";
    }

    if (!password) {
      nextErrors.password = "Password is required";
    } else if (password.length < 6) {
      nextErrors.password = "Minimum 6 characters";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim(), password, rememberMe }),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/");
        return;
      }

      setErrors({ generic: data.message || "Login failed. Try again." });
    } catch {
      setErrors({ generic: "Unable to login right now. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`${crimson.className} ${dmSans.variable} page-wrapper`}>
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

      <div className="login-card">
        <div className="card-glow" />

        <div className="card-header">
          <div className="logo-ring">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="white" aria-hidden>
              <path d="M12 2C8 2 5 5 5 9c0 2.5 1 4.7 2.6 6.3C8.8 16.5 10 18.2 10 20h4c0-1.8 1.2-3.5 2.4-4.7C18 13.7 19 11.5 19 9c0-4-3-7-7-7Z" />
              <path d="M10 20c0 1.1.9 2 2 2s2-.9 2-2h-4Z" opacity="0.6" />
              <circle cx="12" cy="9" r="2.5" fill="rgba(255,255,255,0.45)" />
            </svg>
          </div>
          <h1 className="card-title">Welcome Back</h1>
          <p className="card-subtitle">Sign in to continue your journey</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address
            </label>
            <div className="input-wrapper">
              <span className="input-icon" aria-hidden>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="4" width="20" height="16" rx="3" />
                  <path d="m2 7 8.3 6.2a3 3 0 0 0 3.4 0L22 7" />
                </svg>
              </span>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <span className="input-focus-bar" />
            </div>
            {errors.email ? <p className="field-error">{errors.email}</p> : null}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <div className="input-wrapper">
              <span className="input-icon" aria-hidden>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="3" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="form-input with-eye"
                placeholder="••••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                className="eye-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                    <line x1="2" y1="2" x2="22" y2="22" />
                  </svg>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
              <span className="input-focus-bar" />
            </div>
            {errors.password ? <p className="field-error">{errors.password}</p> : null}
          </div>

          <div className="options-row">
            <button
              type="button"
              className="checkbox-wrapper"
              onClick={() => setRememberMe((prev) => !prev)}
            >
              <span className={`custom-checkbox ${rememberMe ? "checked" : ""}`}>
                <svg viewBox="0 0 12 10" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 5 4.5 9 11 1" />
                </svg>
              </span>
              <span className="checkbox-label">Remember me</span>
            </button>
            <Link href="/forget-password" className="forgot-link">
              Forgot password?
            </Link>
          </div>

          {errors.generic ? <p className="field-error generic">{errors.generic}</p> : null}

          <button
            type="submit"
            className={`btn-login ${isLoading ? "loading" : ""}`}
            disabled={isLoading}
          >
            <span className="btn-text">
              {isLoading ? "Signing In..." : "Sign In"} <span className="btn-arrow">→</span>
            </span>
            <span className="spinner" />
          </button>
        </form>

        <div className="divider">
          <div className="divider-line" />
          <span className="divider-text">or continue with</span>
          <div className="divider-line" />
        </div>

        <div className="social-row">
          <button type="button" className="btn-social" disabled>
            <svg viewBox="0 0 24 24" aria-hidden>
              <path fill="#EA4335" d="M5.26 9.77A7.03 7.03 0 0 1 12 5c1.69 0 3.22.6 4.42 1.58l3.3-3.3A11.95 11.95 0 0 0 12 1C7.31 1 3.26 3.8 1.28 7.8l3.98 1.97Z" />
              <path fill="#34A853" d="M16.04 18.01A7 7 0 0 1 12 19a7.03 7.03 0 0 1-6.73-4.98L1.28 16c1.97 4.01 6.02 6.8 10.72 6.8 2.87 0 5.61-1.04 7.65-2.94l-3.61-1.85Z" />
              <path fill="#4A90D9" d="M22.72 12c0-.85-.08-1.66-.22-2.45H12v4.64h5.99a5.14 5.14 0 0 1-2.2 3.37l3.61 1.85C21.56 17.53 22.72 14.95 22.72 12Z" />
              <path fill="#FBBC05" d="M5.27 14.02A7.1 7.1 0 0 1 4.95 12c0-.7.1-1.39.27-2.02L1.27 7.99A11.97 11.97 0 0 0 0 12c0 1.93.46 3.75 1.27 5.37l3.98-1.97-.98-.38Z" />
            </svg>
            Google
          </button>
          <button type="button" className="btn-social" disabled>
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z" />
            </svg>
            GitHub
          </button>
        </div>

        {/* <p className="signup-row">
          Don&apos;t have an account?
          <Link href="/signup" className="signup-link">
            Create one →
          </Link>
        </p> */}
      </div>

      <style jsx>{`
        :global(html),
        :global(body) {
          overflow-x: hidden;
        }

        :global(:root) {
          --rose-200: #fecdd3;
          --rose-300: #fda4af;
          --rose-400: #fb7185;
          --rose-500: #f43f5e;
          --rose-600: #e11d48;
          --rose-700: #be123c;
        }

        @keyframes orbFloat {
          0%,
          100% {
            transform: translate(0, 0) rotate(0deg);
          }
          33% {
            transform: translate(40px, -60px) rotate(120deg);
          }
          66% {
            transform: translate(-30px, 40px) rotate(240deg);
          }
        }

        @keyframes orbFloat2 {
          0%,
          100% {
            transform: translate(0, 0);
          }
          33% {
            transform: translate(-50px, 70px);
          }
          66% {
            transform: translate(60px, -40px);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }

        @keyframes cardReveal {
          from {
            opacity: 0;
            transform: translateY(48px) scale(0.96);
            filter: blur(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes fieldSlide {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes petalFall {
          0% {
            transform: translateY(-20px) rotate(0deg) scale(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(110vh) rotate(720deg) scale(0.5);
            opacity: 0;
          }
        }

        @keyframes rotateSlow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes rotateSlowReverse {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(-360deg);
          }
        }

        @keyframes logoGlow {
          0%,
          100% {
            filter: drop-shadow(0 0 8px var(--rose-400));
          }
          50% {
            filter: drop-shadow(0 0 20px var(--rose-300)) drop-shadow(0 0 40px var(--rose-500));
          }
        }

        @keyframes rippleAnim {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }

        @keyframes iconBob {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }

        @keyframes checkmark {
          from {
            stroke-dashoffset: 24;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        .page-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          position: relative;
          overflow: hidden;
          background: #0a0006;
          color: #fff;
        }

        .bg-scene {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
        }

        .bg-base {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 70% at 30% 20%, #3d0020 0%, transparent 55%),
            radial-gradient(ellipse 60% 60% at 80% 80%, #1a0010 0%, transparent 55%),
            radial-gradient(ellipse 50% 40% at 50% 50%, #200010 0%, transparent 70%),
            #0a0006;
        }

        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          mix-blend-mode: screen;
        }

        .orb-1 {
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(244, 63, 94, 0.4) 0%, rgba(159, 18, 57, 0.15) 60%, transparent 80%);
          top: -15%;
          left: -10%;
          animation: orbFloat 18s ease-in-out infinite;
        }

        .orb-2 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(225, 29, 72, 0.3) 0%, rgba(244, 63, 94, 0.1) 60%, transparent 80%);
          bottom: -10%;
          right: -10%;
          animation: orbFloat2 22s ease-in-out infinite;
        }

        .orb-3 {
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(251, 113, 133, 0.25) 0%, transparent 70%);
          top: 50%;
          left: 60%;
          animation: orbFloat 14s ease-in-out infinite reverse;
        }

        .grid-lines {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(251, 113, 133, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(251, 113, 133, 0.04) 1px, transparent 1px);
          background-size: 60px 60px;
        }

        .scene-ring {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(244, 63, 94, 0.12);
          pointer-events: none;
        }

        .scene-ring-1 {
          width: 800px;
          height: 800px;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: rotateSlow 40s linear infinite;
        }

        .scene-ring-2 {
          width: 600px;
          height: 600px;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          border-color: rgba(251, 113, 133, 0.08);
          animation: rotateSlowReverse 30s linear infinite;
        }

        .petal {
          position: absolute;
          border-radius: 50% 0 50% 0;
          animation: petalFall linear infinite;
          top: -20px;
        }

        .petal-1 { left: 2%; width: 10px; height: 11px; background: hsl(342deg, 80%, 66%); animation-duration: 10s; animation-delay: 0.6s; opacity: 0.55; }
        .petal-2 { left: 8%; width: 14px; height: 12px; background: hsl(350deg, 80%, 68%); animation-duration: 13s; animation-delay: 1.4s; opacity: 0.6; }
        .petal-3 { left: 14%; width: 12px; height: 16px; background: hsl(347deg, 80%, 63%); animation-duration: 9s; animation-delay: 2.8s; opacity: 0.52; }
        .petal-4 { left: 20%; width: 16px; height: 14px; background: hsl(355deg, 80%, 67%); animation-duration: 15s; animation-delay: 0.9s; opacity: 0.63; }
        .petal-5 { left: 26%; width: 9px; height: 10px; background: hsl(344deg, 80%, 62%); animation-duration: 11s; animation-delay: 3.1s; opacity: 0.48; }
        .petal-6 { left: 31%; width: 13px; height: 9px; background: hsl(358deg, 80%, 65%); animation-duration: 16s; animation-delay: 4.2s; opacity: 0.64; }
        .petal-7 { left: 36%; width: 17px; height: 13px; background: hsl(349deg, 80%, 69%); animation-duration: 14s; animation-delay: 1.7s; opacity: 0.58; }
        .petal-8 { left: 41%; width: 11px; height: 12px; background: hsl(345deg, 80%, 64%); animation-duration: 12s; animation-delay: 5.3s; opacity: 0.49; }
        .petal-9 { left: 46%; width: 15px; height: 16px; background: hsl(352deg, 80%, 67%); animation-duration: 8.5s; animation-delay: 2.1s; opacity: 0.57; }
        .petal-10 { left: 52%; width: 9px; height: 11px; background: hsl(341deg, 80%, 62%); animation-duration: 13.5s; animation-delay: 6.4s; opacity: 0.53; }
        .petal-11 { left: 58%; width: 12px; height: 14px; background: hsl(356deg, 80%, 68%); animation-duration: 9.8s; animation-delay: 4.8s; opacity: 0.61; }
        .petal-12 { left: 63%; width: 14px; height: 15px; background: hsl(348deg, 80%, 66%); animation-duration: 12.8s; animation-delay: 1.2s; opacity: 0.56; }
        .petal-13 { left: 69%; width: 16px; height: 10px; background: hsl(354deg, 80%, 63%); animation-duration: 15.3s; animation-delay: 7.1s; opacity: 0.59; }
        .petal-14 { left: 74%; width: 10px; height: 9px; background: hsl(343deg, 80%, 61%); animation-duration: 10.7s; animation-delay: 3.6s; opacity: 0.47; }
        .petal-15 { left: 79%; width: 13px; height: 12px; background: hsl(357deg, 80%, 67%); animation-duration: 14.7s; animation-delay: 2.5s; opacity: 0.62; }
        .petal-16 { left: 84%; width: 8px; height: 10px; background: hsl(346deg, 80%, 64%); animation-duration: 11.9s; animation-delay: 5.7s; opacity: 0.5; }
        .petal-17 { left: 90%; width: 15px; height: 13px; background: hsl(351deg, 80%, 69%); animation-duration: 9.2s; animation-delay: 0.3s; opacity: 0.65; }
        .petal-18 { left: 96%; width: 11px; height: 15px; background: hsl(344deg, 80%, 66%); animation-duration: 16.5s; animation-delay: 6.8s; opacity: 0.54; }

        .login-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.09) 0%, rgba(244, 63, 94, 0.06) 50%, rgba(255, 255, 255, 0.04) 100%);
          backdrop-filter: blur(24px) saturate(1.4);
          -webkit-backdrop-filter: blur(24px) saturate(1.4);
          border: 1px solid rgba(253, 164, 175, 0.2);
          border-radius: 28px;
          padding: 3rem 2.5rem;
          animation: cardReveal 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
          box-shadow:
            0 0 0 0.5px rgba(244, 63, 94, 0.1) inset,
            0 32px 80px rgba(0, 0, 0, 0.5),
            0 0 80px rgba(244, 63, 94, 0.12);
        }

        .card-glow {
          position: absolute;
          inset: -1px;
          border-radius: 28px;
          background: linear-gradient(135deg, rgba(244, 63, 94, 0.3), transparent 40%, rgba(251, 113, 133, 0.15) 100%);
          z-index: -1;
          filter: blur(1px);
          opacity: 0.6;
        }

        .card-header {
          text-align: center;
          margin-bottom: 2.5rem;
          animation: fieldSlide 0.7s 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .logo-ring {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--rose-700), var(--rose-400));
          margin-bottom: 1.25rem;
          animation: logoGlow 3s ease-in-out infinite;
          box-shadow: 0 8px 32px rgba(244, 63, 94, 0.4);
        }

        .card-title {
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, #fff 0%, var(--rose-200) 50%, var(--rose-400) 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }

        .card-subtitle {
          margin-top: 0.5rem;
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.65);
          font-family: var(--font-dm-sans), sans-serif;
        }

        .form-group {
          margin-bottom: 1.5rem;
          position: relative;
        }

        .form-group:nth-child(1) {
          animation: fieldSlide 0.7s 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .form-group:nth-child(2) {
          animation: fieldSlide 0.7s 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .form-label {
          display: block;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--rose-300);
          margin-bottom: 0.5rem;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--rose-400);
          z-index: 1;
          transition: color 0.3s, transform 0.3s;
          animation: iconBob 3s ease-in-out infinite;
        }

        .form-input {
          width: 100%;
          padding: 0.9rem 1rem 0.9rem 2.8rem;
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(253, 164, 175, 0.35);
          border-radius: 14px;
          color: white;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.95rem;
          outline: none;
          transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
          backdrop-filter: blur(8px);
        }

        .form-input::placeholder {
          color: rgba(255, 255, 255, 0.25);
        }

        .form-input:hover {
          border-color: rgba(251, 113, 133, 0.5);
          background: rgba(255, 255, 255, 0.09);
        }

        .form-input:focus {
          border-color: var(--rose-400);
          background: rgba(244, 63, 94, 0.08);
          box-shadow: 0 0 0 3px rgba(244, 63, 94, 0.18), 0 4px 20px rgba(244, 63, 94, 0.15);
        }

        .form-input:focus ~ .input-focus-bar {
          transform: scaleX(1);
        }

        .with-eye {
          padding-right: 3rem;
        }

        .input-focus-bar {
          position: absolute;
          bottom: -1px;
          left: 0;
          height: 2px;
          width: 100%;
          background: linear-gradient(90deg, var(--rose-600), var(--rose-400), var(--rose-300));
          border-radius: 0 0 14px 14px;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .eye-toggle {
          position: absolute;
          right: 1rem;
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.4);
          display: flex;
          align-items: center;
          padding: 0;
          transition: color 0.3s;
          z-index: 2;
        }

        .eye-toggle:hover {
          color: var(--rose-400);
        }

        .options-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
          animation: fieldSlide 0.7s 0.65s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .checkbox-wrapper {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          user-select: none;
          background: transparent;
          border: none;
          color: inherit;
          padding: 0;
        }

        .custom-checkbox {
          width: 18px;
          height: 18px;
          border: 1.5px solid var(--rose-600);
          border-radius: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .custom-checkbox.checked {
          background: var(--rose-500);
          border-color: var(--rose-500);
        }

        .custom-checkbox svg {
          width: 11px;
          height: 11px;
          stroke: white;
          stroke-dasharray: 24;
          stroke-dashoffset: 24;
          transition: stroke-dashoffset 0.3s;
        }

        .custom-checkbox.checked svg {
          stroke-dashoffset: 0;
          animation: checkmark 0.3s ease forwards;
        }

        .checkbox-label {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.65);
        }

        .forgot-link {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.85rem;
          color: var(--rose-400);
          text-decoration: none;
          position: relative;
          transition: color 0.3s;
        }

        .forgot-link::after {
          content: "";
          position: absolute;
          bottom: -1px;
          left: 0;
          height: 1px;
          width: 0;
          background: var(--rose-400);
          transition: width 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .forgot-link:hover {
          color: var(--rose-300);
        }

        .forgot-link:hover::after {
          width: 100%;
        }

        .btn-login {
          width: 100%;
          padding: 1rem;
          border: none;
          border-radius: 14px;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: 0.03em;
          color: white;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, var(--rose-700) 0%, var(--rose-500) 50%, var(--rose-400) 100%);
          background-size: 200% 200%;
          transition: transform 0.2s, box-shadow 0.3s;
          animation: fieldSlide 0.7s 0.75s cubic-bezier(0.22, 1, 0.36, 1) both;
          box-shadow: 0 8px 32px rgba(244, 63, 94, 0.35);
        }

        .btn-login:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 48px rgba(244, 63, 94, 0.45);
          background-position: 100% 50%;
        }

        .btn-login:active {
          transform: scale(0.98);
        }

        .btn-login:disabled {
          cursor: not-allowed;
          opacity: 0.85;
        }

        .btn-login::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, transparent 50%, rgba(255, 255, 255, 0.05) 100%);
          pointer-events: none;
        }

        .ripple {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          transform: scale(0);
          animation: rippleAnim 0.6s linear;
          pointer-events: none;
        }

        .btn-text {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .btn-arrow {
          display: inline-block;
          transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .btn-login:hover .btn-arrow {
          transform: translateX(4px);
        }

        .btn-login.loading .btn-text {
          opacity: 0;
        }

        .spinner {
          position: absolute;
          width: 22px;
          height: 22px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: rotateSlow 0.8s linear infinite;
          display: none;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .btn-login.loading .spinner {
          display: block;
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin: 1.75rem 0;
          animation: fieldSlide 0.7s 0.85s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(253, 164, 175, 0.2), transparent);
        }

        .divider-text {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.78rem;
          color: rgba(255, 255, 255, 0.3);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .social-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          animation: fieldSlide 0.7s 0.95s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .btn-social {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: rgba(255, 255, 255, 0.8);
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.85rem;
          transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
          cursor: not-allowed;
        }

        .btn-social svg {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }

        .signup-row {
          text-align: center;
          margin-top: 1.75rem;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.88rem;
          color: rgba(255, 255, 255, 0.65);
          animation: fieldSlide 0.7s 1.05s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .signup-link {
          color: var(--rose-400);
          text-decoration: none;
          font-weight: 600;
          position: relative;
          margin-left: 0.25rem;
          transition: color 0.3s;
        }

        .signup-link::after {
          content: "";
          position: absolute;
          bottom: -1px;
          left: 0;
          height: 1px;
          width: 0;
          background: var(--rose-400);
          transition: width 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .signup-link:hover {
          color: var(--rose-300);
        }

        .signup-link:hover::after {
          width: 100%;
        }

        .field-error {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.78rem;
          color: var(--rose-300);
          margin-top: 0.35rem;
          padding-left: 0.25rem;
        }

        .field-error.generic {
          margin-bottom: 0.9rem;
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 2.25rem 1.5rem;
            border-radius: 20px;
          }

          .card-title {
            font-size: 1.65rem;
          }

          .social-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
