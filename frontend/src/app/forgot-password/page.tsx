import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your Velvet Venues account password",
  alternates: { canonical: "/forgot-password" },
};

export default function ForgotPasswordPage() {
  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 relative overflow-hidden">
      {/* Decorative SVGs */}
      <svg
        className="absolute left-0 top-0 w-64 h-64 opacity-20"
        fill="none"
        viewBox="0 0 400 400"
      >
        <circle cx="200" cy="200" r="200" fill="#a5b4fc" />
      </svg>
      <svg
        className="absolute right-0 bottom-0 w-64 h-64 opacity-20"
        fill="none"
        viewBox="0 0 400 400"
      >
        <circle cx="200" cy="200" r="200" fill="#fbcfe8" />
      </svg>

      <div className="w-full max-w-md mx-auto bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-8 md:p-10 border border-white/40 relative z-10">
        <div className="flex flex-col items-center mb-6">
          <Link href="/">
            <Image
              src="/assets/valvetvenue.png"
              width={280}
              height={84}
              alt="Velvet Venues Logo"
              className="h-14 w-auto"
              priority
              unoptimized
            />
          </Link>
          <h2 className="text-3xl font-extrabold text-gray-800 mb-2">Forgot Password</h2>
          <p className="text-gray-500 mb-4 text-center">
            Enter your email and we’ll send you a reset link
          </p>
        </div>

        <form className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Send reset link
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link href="/signin" className="text-sm text-indigo-600 hover:text-indigo-700 underline">
            Back to sign in
          </Link>
        </div>

        <div className="text-xs text-gray-400 text-center mt-6">
          ©2025 Velvet Venues. All Rights Reserved.
          <br />
          <a href="#" className="underline">
            Privacy Policy
          </a>
        </div>
      </div>
    </section>
  );
}


