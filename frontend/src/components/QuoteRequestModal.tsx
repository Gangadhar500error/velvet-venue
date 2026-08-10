"use client";

import { useState, FormEvent, useEffect } from "react";
import { X, MapPin, Star, IndianRupee } from "lucide-react";
import Image from "next/image";
import { Workspace } from "@/app/(main)/venues/[city]/data/workspaces";

interface QuoteRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Workspace | null;
}

export default function QuoteRequestModal({ isOpen, onClose, workspace }: QuoteRequestModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    type: "",
    seats: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Pre-fill form when workspace changes
  useEffect(() => {
    if (workspace && isOpen) {
      setFormData({
        name: "",
        email: "",
        phone: "",
        type: workspace.type,
        seats: "",
      });
    }
  }, [workspace, isOpen]);

  if (!isOpen || !workspace) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    console.log("Quote Request Submitted:", {
      workspace: workspace.id,
      ...formData,
    });

    setIsSubmitting(false);
    setIsSubmitted(true);

    // Reset form and close modal after 2 seconds
    setTimeout(() => {
      setFormData({
        name: "",
        email: "",
        phone: "",
        type: "",
        seats: "",
      });
      setIsSubmitted(false);
      onClose();
    }, 2000);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        name: "",
        email: "",
        phone: "",
        type: "",
        seats: "",
      });
      setIsSubmitted(false);
      onClose();
    }
  };

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl relative flex flex-col overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition z-10 disabled:opacity-50"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Success Message */}
        {isSubmitted && (
          <div className="absolute inset-0 bg-white flex items-center justify-center z-20 rounded-3xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h3>
              <p className="text-gray-600">We'll get back to you shortly.</p>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row overflow-y-auto">
          {/* Left Side - Workspace Details */}
          <div className="lg:w-2/5 bg-gray-50 p-6 border-b lg:border-b-0 lg:border-r border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4 font-display">Venue Details</h2>

            {/* Workspace Image */}
            <div className="relative w-full h-48 rounded-lg overflow-hidden mb-4">
              <Image
                src={workspace.image}
                alt={workspace.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
              {workspace.badge && (
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500 text-white">
                  {workspace.badge}
                </div>
              )}
            </div>

            {/* Workspace Name */}
            <h3 className="text-lg font-bold text-gray-900 mb-2 font-display">{workspace.name}</h3>

            {/* Location */}
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
              <MapPin className="w-4 h-4" />
              <span className="font-body">{workspace.area}, {workspace.city}</span>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-semibold text-gray-900">{workspace.rating}</span>
              </div>
              <span className="text-sm text-gray-500 font-body">
                ({workspace.reviewCount} reviews)
              </span>
            </div>

            {/* Type */}
            <div className="mb-3">
              <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                {workspace.type}
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-2 mb-4">
              <IndianRupee className="w-5 h-5 text-orange-500" />
              <div>
                <span className="text-sm text-gray-600 font-body">Starts from </span>
                <span className="text-2xl font-bold text-gray-900 font-display">
                  ₹{workspace.price}
                </span>
              </div>
            </div>

            {/* Amenities */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Amenities</h4>
              <div className="flex flex-wrap gap-2">
                {workspace.amenities.slice(0, 6).map((amenity) => (
                  <span
                    key={amenity}
                    className="px-2 py-1 bg-white border border-gray-200 text-gray-700 text-xs rounded-md font-body"
                  >
                    {amenity}
                  </span>
                ))}
                {workspace.amenities.length > 6 && (
                  <span className="px-2 py-1 bg-white border border-gray-200 text-gray-700 text-xs rounded-md font-body">
                    +{workspace.amenities.length - 6} more
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="lg:w-3/5 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1 font-display">Request a Quote</h2>
            <p className="text-sm text-gray-600 mb-6">
              Fill out the form below and we'll get back to you with a customized quote.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  placeholder="Enter your email address"
                />
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  placeholder="Enter your phone number"
                />
              </div>

              {/* Type */}
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="type"
                  name="type"
                  required
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                >
                  <option value="">Select venue type</option>
                  <option value="Wedding Venue">Wedding Venue</option>
                  <option value="Banquet Hall">Banquet Hall</option>
                  <option value="Resort">Resort</option>
                  <option value="Farm House">Farm House</option>
                </select>
              </div>

              {/* Guests / Capacity */}
              <div>
                <label htmlFor="seats" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Number of Guests <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="seats"
                  name="seats"
                  required
                  min="1"
                  value={formData.seats}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  placeholder="Number of guests expected"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || isSubmitted}
                className="w-full py-3 px-6 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {isSubmitting ? "Submitting..." : isSubmitted ? "Submitted!" : "Submit Request"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
