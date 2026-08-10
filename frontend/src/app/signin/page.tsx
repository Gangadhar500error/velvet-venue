"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, AlertCircle, Loader2 } from "lucide-react";

import { venueImages } from "@/data/venueImages";

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

export default function SigninPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberme, setRememberme] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api";

  // Duplicate images for seamless infinite scroll
  const duplicatedImages = [...workspaceImages, ...workspaceImages, ...workspaceImages];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include", // Include cookies for session-based auth
        body: JSON.stringify({
          user_name: email, // API expects 'user_name' field
          password,
          rememberme,
          isajax: 1, // Required for JSON response from LoginController
        }),
      });

      const data = await response.json();

      // Handle error response format: {error: ['message']} or {error: {user_name: 'message'}}
      if (data.error) {
        const errorMessage = Array.isArray(data.error) 
          ? data.error[0] 
          : data.error.user_name || data.error || "Login failed";
        throw new Error(errorMessage);
      }

      // Handle success response format: {success: {customer: 'Login success'}}
      if (data.success && data.success.customer) {
        // Session-based auth - cookies are automatically set
        // Store success status
        localStorage.setItem("login_success", "true");
        localStorage.setItem("is_authenticated", "true");

        // Redirect to admin dashboard
        router.push("/admin");
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left Side - Workspace Grid Gallery (Bottom to Top Scroll) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gray-900 h-screen">
        {/* Infinite Scrolling Grid Container */}
        <div className="relative w-full h-full overflow-hidden">
          {/* Smooth Scrolling Grid - Bottom to Top */}
          <motion.div
            className="grid grid-cols-2"
            initial={{ y: 0 }}
            animate={{
              y: "-33.333%",
            }}
            transition={{
              duration: 50,
              repeat: Infinity,
              ease: "linear",
              repeatType: "loop",
            }}
            style={{
              willChange: "transform",
            }}
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

          {/* Top Gradient Fade */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-gray-900 to-transparent z-20 pointer-events-none" />
          
          {/* Bottom Gradient Fade */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-900 to-transparent z-20 pointer-events-none" />
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 h-screen overflow-hidden flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 relative">
        {/* Background Image Scroll - Top to Bottom */}
        <div className="absolute inset-0 overflow-hidden opacity-[0.03]">
          <motion.div
            className="grid grid-cols-2"
            initial={{ y: 0 }}
            animate={{
              y: "33.333%",
            }}
            transition={{
              duration: 50,
              repeat: Infinity,
              ease: "linear",
              repeatType: "loop",
            }}
            style={{
              willChange: "transform",
            }}
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

        {/* Subtle Background Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03] z-10"
          style={{
            backgroundImage: `radial-gradient(circle, #000 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Decorative Gradient Blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C89B3C]/8 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 z-10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#008385]/8 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 z-10" />
        
        {/* Additional Light Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/40 z-10 pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md mx-auto px-6 relative z-20"
        >
          <div className="mb-5 mx-auto flex justify-center">
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

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-7">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 font-body">{error}</p>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-700 mb-2 font-body"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C89B3C] focus:border-[#C89B3C] outline-none transition-all font-body text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700 mb-2 font-body"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C89B3C] focus:border-[#C89B3C] outline-none transition-all font-body text-gray-900 placeholder-gray-400"
                  />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={rememberme}
                      onChange={(e) => setRememberme(e.target.checked)}
                      className="w-4 h-4 text-[#C89B3C] border-gray-300 rounded focus:ring-[#C89B3C] focus:ring-2 cursor-pointer"
                    />
                    <span className="ml-2 text-sm text-gray-600 font-body group-hover:text-gray-900 transition-colors">
                      Remember me
                    </span>
                  </label>
                  <Link 
                    href="/forgot-password" 
                    className="text-sm font-medium text-[#C89B3C] hover:text-[#C89B3C]/80 transition-colors font-body"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#C89B3C] text-white py-3.5 rounded-lg font-semibold hover:bg-[#C89B3C]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg shadow-[#C89B3C]/20 font-body flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-5">
              <div className="grow border-t border-gray-200"></div>
              <span className="px-4 text-sm text-gray-500 font-body">OR</span>
              <div className="grow border-t border-gray-200"></div>
            </div>

            {/* Social Login */}
            <button 
              type="button"
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all font-body"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Sign in with Google</span>
            </button>

            <p className="mt-5 text-center text-sm text-gray-600 font-body">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-semibold text-[#C89B3C] hover:text-[#C89B3C]/80 transition-colors"
              >
                Create account
              </Link>
            </p>
          </div>

          <p className="mt-4 text-center text-xs text-gray-500 font-body">
            ©2026 Velvet Venues. All Rights Reserved.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
