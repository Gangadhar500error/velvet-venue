"use client";

import { Camera } from "lucide-react";
import { CustomerFormValues, Gender, RegistrationSource, CustomerStatus } from "../types";
import { cityOptions } from "../data";

export const fieldClass =
  "w-full h-10 px-3 rounded-[10px] border border-[#E8EAF0] bg-white text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C89B3C]/25 focus:border-[#C89B3C]";

export const labelClass = "block text-xs font-medium text-[#6B7280] mb-1.5";

interface CustomerFormProps {
  values: CustomerFormValues;
  onChange: <K extends keyof CustomerFormValues>(key: K, value: CustomerFormValues[K]) => void;
  mode?: "create" | "edit";
}

export function CustomerFormFields({ values, onChange }: CustomerFormProps) {
  return (
    <div className="space-y-5">
      <Section title="Basic Information" subtitle="Primary identity and contact details">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#C89B3C] to-[#B8862B] text-white text-xl font-semibold flex items-center justify-center shrink-0 relative">
            {(values.name || "NC")
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
            <button
              type="button"
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border border-[#E8EAF0] text-[#C89B3C] flex items-center justify-center shadow-sm"
              aria-label="Upload photo"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="pt-1">
            <p className="text-sm font-medium text-[#111827]">Profile Photo</p>
            <p className="text-xs text-[#9CA3AF] mt-0.5">JPG or PNG up to 2MB</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <Field label="Full Name" required>
            <input
              className={fieldClass}
              value={values.name}
              onChange={(e) => onChange("name", e.target.value)}
              placeholder="Rahul Sharma"
            />
          </Field>
          <Field label="Email" required>
            <input
              type="email"
              className={fieldClass}
              value={values.email}
              onChange={(e) => onChange("email", e.target.value)}
              placeholder="name@email.com"
            />
          </Field>
          <Field label="Mobile" required>
            <input
              className={fieldClass}
              value={values.phone}
              onChange={(e) => onChange("phone", e.target.value)}
              placeholder="+91 98765 43210"
            />
          </Field>
          <Field label="Gender">
            <select
              className={fieldClass}
              value={values.gender}
              onChange={(e) => onChange("gender", e.target.value as Gender | "")}
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </Field>
          <Field label="City">
            <select
              className={fieldClass}
              value={values.city}
              onChange={(e) => onChange("city", e.target.value)}
            >
              <option value="">Select city</option>
              {cityOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Country">
            <input
              className={fieldClass}
              value={values.country}
              onChange={(e) => onChange("country", e.target.value)}
              placeholder="India"
            />
          </Field>
          <Field label="Date of Birth">
            <input
              type="date"
              className={fieldClass}
              value={values.dob}
              onChange={(e) => onChange("dob", e.target.value)}
            />
          </Field>
          <Field label="Registration Source">
            <select
              className={fieldClass}
              value={values.source}
              onChange={(e) => onChange("source", e.target.value as RegistrationSource)}
            >
              <option value="website">Website</option>
              <option value="mobile_app">Mobile App</option>
              <option value="referral">Referral</option>
              <option value="admin">Admin</option>
              <option value="partner">Partner</option>
            </select>
          </Field>
          <Field label="Status">
            <select
              className={fieldClass}
              value={values.status}
              onChange={(e) => onChange("status", e.target.value as CustomerStatus)}
            >
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
              <option value="blocked">Blocked</option>
            </select>
          </Field>
        </div>
      </Section>
    </div>
  );
}

export function Section({
  title,
  subtitle,
  children,
  actions,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-[#E8EAF0] rounded-[14px] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="flex items-center justify-between gap-3 px-4 md:px-5 py-3.5 border-b border-[#E8EAF0]">
        <div>
          <h2 className="text-sm font-semibold text-[#111827]">{title}</h2>
          {subtitle && <p className="text-xs text-[#9CA3AF] mt-0.5">{subtitle}</p>}
        </div>
        {actions}
      </div>
      <div className="p-4 md:p-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className={labelClass}>
        {label}
        {required && <span className="text-[#C89B3C] ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}
