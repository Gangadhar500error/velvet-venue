"use client";

import { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  Save,
  Shield,
} from "lucide-react";
import { PageHeader } from "../../_components/ui/PageHeader";

type ProfileForm = {
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  location: string;
  country: string;
  timezone: string;
  language: string;
  userId: string;
  employeeId: string;
  role: string;
  department: string;
  createdDate: string;
  updatedDate: string;
  lastLogin: string;
  accountStatus: "Active" | "Inactive";
  recoveryEmail: string;
  recoveryPhone: string;
  twoFactorEnabled: boolean;
};

const INITIAL_FORM: ProfileForm = {
  firstName: "Admin",
  lastName: "User",
  displayName: "Admin User",
  email: "admin@velvetvenues.com",
  phone: "+91 98765 43210",
  gender: "Male",
  dateOfBirth: "1992-04-14",
  location: "Hyderabad, Telangana",
  country: "India",
  timezone: "Asia/Kolkata",
  language: "English",
  userId: "VV-ADM-1001",
  employeeId: "EMP-204",
  role: "Super Admin",
  department: "Operations",
  createdDate: "2024-01-05",
  updatedDate: "2026-08-02",
  lastLogin: "2026-08-04 14:20",
  accountStatus: "Active",
  recoveryEmail: "security@velvetvenues.com",
  recoveryPhone: "",
  twoFactorEnabled: false,
};

const inputClass =
  "w-full h-10 px-3 rounded-[10px] border border-[#E8EAF0] bg-white text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C89B3C]/25 focus:border-[#C89B3C]";
const inputReadOnlyClass =
  "w-full h-10 px-3 rounded-[10px] border border-[#E8EAF0] bg-[#F8FAFC] text-sm text-[#374151]";
const labelClass = "text-xs font-medium text-[#6B7280]";

export default function AdminProfilePage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [draft, setDraft] = useState(INITIAL_FORM);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const passwordStrength = getPasswordStrength(passwords.newPassword);

  const setField = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const enterEditMode = () => {
    setDraft(form);
    setIsEditMode(true);
  };

  const cancelEdit = () => {
    setDraft(form);
    setIsEditMode(false);
  };

  const saveChanges = () => {
    setForm(draft);
    setIsEditMode(false);
  };

  const resetDraft = () => setDraft(INITIAL_FORM);

  useEffect(() => {
    if (!isPasswordModalOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isPasswordModalOpen]);

  return (
    <div className="space-y-4 animate-fadeIn">
      <PageHeader
        title="Profile"
        subtitle="Manage administrator identity, access preferences, and security controls."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Profile" },
        ]}
      />

      <section className="rounded-[14px] border border-[#E8EAF0] bg-white p-6 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-center gap-5">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#C89B3C] to-[#B8862B] text-white text-2xl font-semibold flex items-center justify-center shadow-sm">
            {form.firstName[0]}
            {form.lastName[0]}
          </div>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Info label="Admin Name" value={form.displayName} />
            <Info label="Role" value={form.role} />
            <Info label="Email" value={form.email} />
            <Info label="Phone" value={form.phone} />
            <Info label="Location" value={form.location} />
            <Info label="Member Since" value={formatDate(form.createdDate)} />
            <Info label="Last Login" value={form.lastLogin} />
            <Info label="Account Status" value={form.accountStatus} tone="text-[#16A34A]" />
            <Info label="Verification" value="Verified" tone="text-[#16A34A]" />
          </div>
          <div className="flex xl:flex-col gap-2">
            {!isEditMode ? (
              <button
                onClick={enterEditMode}
                className="h-10 px-4 rounded-xl bg-[#C89B3C] text-white text-sm font-medium hover:bg-[#B8862B] transition-colors"
              >
                Edit Profile
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <div className="space-y-4">
        <div className="space-y-4">
          <Card title="Personal Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="First Name" value={draft.firstName} onChange={(v) => setField("firstName", v)} editable={isEditMode} />
              <Field label="Last Name" value={draft.lastName} onChange={(v) => setField("lastName", v)} editable={isEditMode} />
              <Field label="Display Name" value={draft.displayName} onChange={(v) => setField("displayName", v)} editable={isEditMode} />
              <Field label="Email" value={draft.email} onChange={(v) => setField("email", v)} editable={isEditMode} type="email" />
              <Field label="Phone Number" value={draft.phone} onChange={(v) => setField("phone", v)} editable={isEditMode} />
              <Field label="Gender" value={draft.gender} onChange={(v) => setField("gender", v)} editable={isEditMode} />
              <Field label="Date of Birth" value={draft.dateOfBirth} onChange={(v) => setField("dateOfBirth", v)} editable={isEditMode} type="date" />
              <Field label="Location" value={draft.location} onChange={(v) => setField("location", v)} editable={isEditMode} />
              <Field label="Country" value={draft.country} onChange={(v) => setField("country", v)} editable={isEditMode} />
              <Field label="Timezone" value={draft.timezone} onChange={(v) => setField("timezone", v)} editable={isEditMode} />
              <Field label="Language" value={draft.language} onChange={(v) => setField("language", v)} editable={isEditMode} />
            </div>
          </Card>

          <Card title="Account Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="User ID" value={draft.userId} onChange={(v) => setField("userId", v)} editable={isEditMode} />
              <Field label="Employee ID (Optional)" value={draft.employeeId} onChange={(v) => setField("employeeId", v)} editable={isEditMode} />
              <Field label="Role" value={draft.role} onChange={(v) => setField("role", v)} editable={isEditMode} />
              <Field label="Department (Optional)" value={draft.department} onChange={(v) => setField("department", v)} editable={isEditMode} />
              <Field label="Created Date" value={draft.createdDate} onChange={(v) => setField("createdDate", v)} editable={isEditMode} type="date" />
              <Field label="Last Updated" value={draft.updatedDate} onChange={(v) => setField("updatedDate", v)} editable={isEditMode} type="date" />
              <Field label="Last Login" value={draft.lastLogin} onChange={(v) => setField("lastLogin", v)} editable={isEditMode} />
              <Field label="Account Status" value={draft.accountStatus} onChange={(v) => setField("accountStatus", v as ProfileForm["accountStatus"])} editable={isEditMode} />
            </div>
          </Card>

          <Card title="Security">
            <div className="space-y-3">
              <SecureRow
                icon={Lock}
                label="Password"
                value="***********"
                action={
                  isEditMode ? (
                    <button
                      onClick={() => setIsPasswordModalOpen(true)}
                      className="h-8 px-3 rounded-lg border border-[#E5E7EB] text-[12px] font-medium text-[#374151] hover:bg-[#F8FAFC]"
                    >
                      Change Password
                    </button>
                  ) : null
                }
              />
              <SecureRow
                icon={Shield}
                label="Two Factor Authentication"
                value={draft.twoFactorEnabled ? "Enabled" : "Disabled"}
                action={
                  isEditMode ? (
                    <button
                      onClick={() => setField("twoFactorEnabled", !draft.twoFactorEnabled)}
                      className="h-8 px-3 rounded-lg border border-[#E5E7EB] text-[12px] font-medium text-[#374151] hover:bg-[#F8FAFC]"
                    >
                      {draft.twoFactorEnabled ? "Disable" : "Enable"}
                    </button>
                  ) : null
                }
              />
              <SecureRow icon={Mail} label="Recovery Email" value={draft.recoveryEmail || "Not set"} />
              <SecureRow icon={Phone} label="Recovery Phone" value={draft.recoveryPhone || "Not set"} />
            </div>
          </Card>

        </div>
      </div>

      {isEditMode ? (
        <div className="sticky bottom-0 z-30 rounded-[14px] border border-[#E8EAF0] bg-white/95 backdrop-blur p-4 shadow-sm">
          <div className="flex flex-wrap justify-end gap-2">
            <button
              onClick={cancelEdit}
              className="h-10 px-4 rounded-xl border border-[#E5E7EB] text-sm font-medium text-[#374151] hover:bg-[#F8FAFC]"
            >
              Cancel
            </button>
            <button
              onClick={resetDraft}
              className="h-10 px-4 rounded-xl border border-[#E5E7EB] text-sm font-medium text-[#374151] hover:bg-[#F8FAFC]"
            >
              Reset
            </button>
            <button
              onClick={saveChanges}
              className="h-10 px-4 rounded-xl bg-[#C89B3C] text-white text-sm font-medium hover:bg-[#B8862B] inline-flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </div>
      ) : null}

      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/45" onClick={() => setIsPasswordModalOpen(false)} />
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[14px] border border-[#E8EAF0] bg-white p-5 shadow-2xl animate-fadeIn" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-[#111827]">Change Password</h3>
            <p className="text-sm text-[#6B7280] mt-1">Use a strong password for better account security.</p>
            <div className="space-y-3 mt-4">
              <PasswordField
                label="Current Password"
                value={passwords.currentPassword}
                show={showCurrentPassword}
                onToggle={() => setShowCurrentPassword((v) => !v)}
                onChange={(v) => setPasswords((prev) => ({ ...prev, currentPassword: v }))}
              />
              <PasswordField
                label="New Password"
                value={passwords.newPassword}
                show={showNewPassword}
                onToggle={() => setShowNewPassword((v) => !v)}
                onChange={(v) => setPasswords((prev) => ({ ...prev, newPassword: v }))}
              />
              <PasswordField
                label="Confirm Password"
                value={passwords.confirmPassword}
                show={showConfirmPassword}
                onToggle={() => setShowConfirmPassword((v) => !v)}
                onChange={(v) => setPasswords((prev) => ({ ...prev, confirmPassword: v }))}
              />
              <div>
                <div className="flex items-center justify-between text-[12px] mb-1">
                  <span className="text-[#6B7280]">Password Strength</span>
                  <span className="font-semibold text-[#111827]">{passwordStrength.label}</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#E5E7EB] overflow-hidden">
                  <div className={`h-full rounded-full ${passwordStrength.color}`} style={{ width: `${passwordStrength.score}%` }} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="h-9 px-3.5 rounded-lg border border-[#E5E7EB] text-sm font-medium text-[#374151] hover:bg-[#F8FAFC]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
                  setIsPasswordModalOpen(false);
                }}
                className="h-9 px-3.5 rounded-lg bg-[#C89B3C] text-white text-sm font-medium hover:bg-[#B8862B]"
              >
                Save Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[14px] border border-[#E8EAF0] bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-[#111827] mb-4">{title}</h2>
      {children}
    </section>
  );
}

function Info({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <p className="text-[11px] text-[#9CA3AF]">{label}</p>
      <p className={`text-sm font-medium ${tone || "text-[#111827]"}`}>{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  editable,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  editable: boolean;
  type?: string;
}) {
  return (
    <label className="block">
      <span className={`${labelClass} mb-1.5 block`}>{label}</span>
      <input
        type={type}
        value={value}
        readOnly={!editable}
        onChange={(e) => onChange(e.target.value)}
        className={editable ? inputClass : inputReadOnlyClass}
      />
    </label>
  );
}

function SecureRow({
  icon: Icon,
  label,
  value,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[#EEF2F7] bg-[#FCFCFD] px-3 py-2.5">
      <div className="flex items-center gap-2.5">
        <Icon className="w-4 h-4 text-[#C89B3C]" />
        <div>
          <p className="text-[12px] text-[#6B7280]">{label}</p>
          <p className="text-sm font-medium text-[#111827]">{value}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

function PasswordField({
  label,
  value,
  show,
  onToggle,
  onChange,
}: {
  label: string;
  value: string;
  show: boolean;
  onToggle: () => void;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className={`${labelClass} mb-1.5 block`}>{label}</span>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} pr-10`}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563]"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </label>
  );
}

function formatDate(date: string) {
  const d = new Date(`${date}T12:00:00`);
  return Number.isNaN(d.getTime()) ? date : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score += 30;
  if (/[A-Z]/.test(password)) score += 20;
  if (/[a-z]/.test(password)) score += 15;
  if (/\d/.test(password)) score += 20;
  if (/[^A-Za-z0-9]/.test(password)) score += 15;

  if (score >= 80) return { score, label: "Strong", color: "bg-[#16A34A]" };
  if (score >= 50) return { score, label: "Medium", color: "bg-[#B8862B]" };
  return { score, label: "Weak", color: "bg-[#DC2626]" };
}

