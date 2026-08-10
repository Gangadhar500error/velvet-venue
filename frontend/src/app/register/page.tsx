"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  AlertCircle,
  Loader2,
  User,
  Phone,
  CheckCircle2,
} from "lucide-react";

import { venueImages } from "@/data/venueImages";
import { signup } from "@/lib/auth";

const workspaceImages = [
  { id: 1, image: venueImages.wedding, title: "Wedding Venues" },
  { id: 2, image: venueImages.banquet, title: "Banquet Halls" },
  { id: 3, image: venueImages.farmHouse, title: "Farm Houses" },
  { id: 4, image: venueImages.resort, title: "Resorts & Hotels" },
  { id: 5, image: venueImages.outdoor, title: "Outdoor Venues" },
  { id: 6, image: venueImages.convention, title: "Conference Halls" },
  { id: 7, image: venueImages.lawn, title: "Garden Venues" },
  { id: 8, image: venueImages.party, title: "Party Halls" },
  { id: 9, image: venueImages.luxury, title: "Luxury Venues" },
  { id: 10, image: venueImages.hotel, title: "Premium Venues" },
  { id: 11, image: venueImages.beach, title: "Beach Venues" },
  { id: 12, image: venueImages.birthday, title: "Function Halls" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"customer" | "vendor">("customer");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const duplicatedImages = [
    ...workspaceImages,
    ...workspaceImages,
    ...workspaceImages,
  ];

  const validate = () => {
    if (!fullName.trim()) return "Full name is required";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return "Enter a valid email address";
    if (!mobile.trim() || mobile.replace(/\D/g, "").length < 10)
      return "Enter a valid 10-digit mobile number";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password))
      return "Password must contain uppercase, lowercase, and a number";
    if (password !== confirmPassword) return "Passwords do not match";
    if (!acceptTerms) return "Please accept the Terms of Service to continue";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const nameParts = fullName.trim().split(/\s+/);
      const first_name = nameParts[0] || "";
      const last_name = nameParts.slice(1).join(" ") || first_name;

      await signup({
        role,
        first_name,
        last_name,
        email: email.trim(),
        phone: mobile.trim() || undefined,
        password,
        confirm_password: confirmPassword,
      });

      setSuccess("Account created successfully. Redirecting to sign in...");
      setTimeout(() => router.push("/signin"), 1500);
      return;
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "An error occurred during registration";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left Side - Workspace Grid Gallery */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gray-900 h-screen">
        <div className="relative w-full h-full overflow-hidden">
          <motion.div
            className="grid grid-cols-2"
            initial={{ y: 0 }}
            animate={{ y: "-33.333%" }}
            transition={{
              duration: 50,
              repeat: Infinity,
              ease: "linear",
              repeatType: "loop",
            }}
            style={{ willChange: "transform" }}
          >
            {duplicatedImages.map((item, index) => (
              <div
                key={`left-${item.id}-${index}`}
                className="relative w-full overflow-hidden"
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  width={800}
                  height={600}
                  className="w-full h-auto object-cover block"
                  sizes="50vw"
                  unoptimized
                />
              </div>
            ))}
          </motion.div>

          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-gray-900 to-transparent z-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-900 to-transparent z-20 pointer-events-none" />
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-full lg:w-1/2 h-screen overflow-hidden flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 relative">
        <div className="absolute inset-0 overflow-hidden opacity-[0.03]">
          <motion.div
            className="grid grid-cols-2"
            initial={{ y: 0 }}
            animate={{ y: "33.333%" }}
            transition={{
              duration: 50,
              repeat: Infinity,
              ease: "linear",
              repeatType: "loop",
            }}
            style={{ willChange: "transform" }}
          >
            {duplicatedImages.map((item, index) => (
              <div
                key={`right-${item.id}-${index}`}
                className="relative w-full overflow-hidden"
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  width={800}
                  height={600}
                  className="w-full h-auto object-cover grayscale block"
                  sizes="50vw"
                  unoptimized
                />
              </div>
            ))}
          </motion.div>
        </div>

        <div
          className="absolute inset-0 opacity-[0.03] z-10"
          style={{
            backgroundImage: `radial-gradient(circle, #000 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />

        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C89B3C]/8 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 z-10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#008385]/8 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 z-10" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/40 z-10 pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl mx-auto px-6 relative z-20"
        >
          <div className="mb-4 flex justify-center">
            <Link href="/" className="inline-block">
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
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-7">
            <div className="mb-5 text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 font-display">
                Create Account
              </h1>
              <p className="mt-1 text-sm text-gray-600 font-body">
                Register to book venues and manage your events
              </p>
            </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2"
                >
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-red-800 font-body">
                    {error}
                  </p>
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2"
                >
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-green-800 font-body">
                    {success}
                  </p>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3.5">
                <div className="sm:col-span-2 min-w-0">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 font-body">
                    Account Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole("customer")}
                      className={`py-2.5 px-3 rounded-lg text-sm font-medium border transition-all font-body ${
                        role === "customer"
                          ? "border-[#C89B3C] bg-[#C89B3C]/10 text-[#C89B3C]"
                          : "border-gray-300 text-gray-600 hover:border-gray-400"
                      }`}
                    >
                      Customer
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("vendor")}
                      className={`py-2.5 px-3 rounded-lg text-sm font-medium border transition-all font-body ${
                        role === "vendor"
                          ? "border-[#C89B3C] bg-[#C89B3C]/10 text-[#C89B3C]"
                          : "border-gray-300 text-gray-600 hover:border-gray-400"
                      }`}
                    >
                      Venue Owner
                    </button>
                  </div>
                </div>

                <div className="min-w-0">
                  <label
                    htmlFor="fullName"
                    className="block text-xs font-semibold text-gray-700 mb-1.5 font-body"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="fullName"
                      name="name"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full min-w-0 pl-11 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C89B3C] focus:border-[#C89B3C] outline-none transition-all font-body text-gray-900 placeholder-gray-400 bg-gray-50/50 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="min-w-0">
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold text-gray-700 mb-1.5 font-body"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="user_name"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full min-w-0 pl-11 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C89B3C] focus:border-[#C89B3C] outline-none transition-all font-body text-gray-900 placeholder-gray-400 bg-gray-50/50 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="min-w-0">
                  <label
                    htmlFor="mobile"
                    className="block text-xs font-semibold text-gray-700 mb-1.5 font-body"
                  >
                    Mobile Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="mobile"
                      name="mobile"
                      type="tel"
                      inputMode="tel"
                      required
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="10-digit mobile number"
                      className="w-full min-w-0 pl-11 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C89B3C] focus:border-[#C89B3C] outline-none transition-all font-body text-gray-900 placeholder-gray-400 bg-gray-50/50 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="min-w-0">
                  <label
                    htmlFor="city"
                    className="block text-xs font-semibold text-gray-700 mb-1.5 font-body"
                  >
                    City <span className="font-normal text-gray-400">(Optional)</span>
                  </label>
                  <div className="relative">
                    <input
                      id="city"
                      name="city"
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Your city"
                      className="w-full min-w-0 px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C89B3C] focus:border-[#C89B3C] outline-none transition-all font-body text-gray-900 placeholder-gray-400 bg-gray-50/50 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="min-w-0">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold text-gray-700 mb-1.5 font-body"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="w-full min-w-0 pl-11 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C89B3C] focus:border-[#C89B3C] outline-none transition-all font-body text-gray-900 placeholder-gray-400 bg-gray-50/50 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="min-w-0">
                  <label
                    htmlFor="confirmPassword"
                    className="block text-xs font-semibold text-gray-700 mb-1.5 font-body"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="password_confirmation"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full min-w-0 pl-11 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C89B3C] focus:border-[#C89B3C] outline-none transition-all font-body text-gray-900 placeholder-gray-400 bg-gray-50/50 focus:bg-white"
                    />
                  </div>
                </div>

                <label className="flex items-start cursor-pointer group gap-2 sm:col-span-2 min-w-0">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-[#C89B3C] border-gray-300 rounded focus:ring-[#C89B3C] focus:ring-2 cursor-pointer shrink-0"
                  />
                  <span className="text-xs leading-relaxed text-gray-600 font-body group-hover:text-gray-900 transition-colors">
                    I agree to the{" "}
                    <Link
                      href="#"
                      className="text-[#C89B3C] hover:text-[#C89B3C]/80 font-medium"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="#"
                      className="text-[#C89B3C] hover:text-[#C89B3C]/80 font-medium"
                    >
                      Privacy Policy
                    </Link>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="sm:col-span-2 w-full bg-[#C89B3C] text-white py-3 rounded-lg text-sm font-semibold hover:bg-[#C89B3C]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg shadow-[#C89B3C]/20 font-body flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Creating account...</span>
                    </>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>

              <div className="flex items-center my-4">
                <div className="grow border-t border-gray-200" />
                <span className="px-3 text-xs text-gray-500 font-body">OR</span>
                <div className="grow border-t border-gray-200" />
              </div>

              <button
                type="button"
                className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-700 font-semibold py-2.5 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all font-body text-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Sign up with Google</span>
              </button>

              <p className="mt-4 text-center text-sm text-gray-600 font-body">
                Already have an account?{" "}
                <Link
                  href="/signin"
                  className="font-semibold text-[#C89B3C] hover:text-[#C89B3C]/80 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>

          <p className="mt-3 text-center text-xs text-gray-500 font-body">
            ©2026 Velvet Venues. All Rights Reserved.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
