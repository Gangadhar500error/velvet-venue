"use client";

import { useMemo, useRef, useState } from "react";
import { CheckCircle2, Download, Eye, FileText, Upload } from "lucide-react";
import { VenueDocument, DocumentStatus } from "../types";
import { formatDate } from "../data";

interface DocumentsManagerProps {
  documents: VenueDocument[];
  onChange: (documents: VenueDocument[]) => void;
  mode?: "create" | "edit" | "view";
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function isOptional(name: string) {
  return name === "Other Documents";
}

function daysUntil(dateStr?: string) {
  if (!dateStr) return null;
  const target = new Date(dateStr + "T12:00:00").getTime();
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.ceil((target - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function DocumentsManager({ documents, onChange, mode = "edit" }: DocumentsManagerProps) {
  const updateDoc = (id: string, patch: Partial<VenueDocument>) => {
    onChange(documents.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  };

  const handleFile = (doc: VenueDocument, file: File | undefined) => {
    if (!file) return;
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    updateDoc(doc.id, {
      status: "uploaded",
      fileName: file.name,
      fileSize: formatBytes(file.size),
      uploadedDate: todayISO(),
      verifiedBy: "—",
      expiryDate: expiry.toISOString().slice(0, 10),
    });
  };

  const stats = useMemo(() => {
    const required = documents.filter((d) => !isOptional(d.name));
    const verified = documents.filter((d) => d.status === "verified").length;
    const pending = documents.filter(
      (d) => d.status === "pending" || d.status === "uploaded"
    ).length;
    const expired = documents.filter((d) => {
      const days = daysUntil(d.expiryDate);
      return days !== null && days < 0;
    }).length;
    const completionBase = required.length || documents.length || 1;
    const completion = Math.round((verified / completionBase) * 100);
    return { verified, pending, expired, completion };
  }, [documents]);

  if (documents.length === 0) {
    return (
      <div className="rounded-[12px] border border-dashed border-[#E8EAF0] bg-[#FCFCFD] px-4 py-12 text-center">
        <FileText className="w-8 h-8 text-[#D1D5DB] mx-auto mb-2" />
        <p className="text-sm text-[#9CA3AF]">No document slots for this venue.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-[12px] border border-[#E8EAF0] bg-[#FCFCFD] px-4 py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div>
            <p className="text-sm font-semibold text-[#111827]">Document Completion</p>
            <p className="text-[12px] text-[#9CA3AF] mt-0.5">{stats.completion}% complete</p>
          </div>
          <div className="flex flex-wrap gap-3 text-[12px]">
            <span className="text-[#16A34A] font-medium">{stats.verified} Verified</span>
            <span className="text-[#D97706] font-medium">{stats.pending} Pending</span>
            <span className="text-[#DC2626] font-medium">{stats.expired} Expired</span>
          </div>
        </div>
        <div className="h-2 rounded-full bg-[#F3F4F6] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#C89B3C] transition-all"
            style={{ width: `${Math.min(100, stats.completion)}%` }}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-[#E8EAF0] text-left text-[11px] uppercase tracking-wider text-[#6B7280]">
              {["Document", "Status", "Uploaded Date", "Verified By", "Expiry Date", "Actions"].map(
                (h) => (
                  <th key={h} className="pb-2.5 pr-3 font-semibold">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <DocumentTableRow
                key={doc.id}
                doc={doc}
                mode={mode}
                onFile={(file) => handleFile(doc, file)}
                onVerify={() => updateDoc(doc.id, { status: "verified", verifiedBy: "Admin User" })}
              />
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[12px] text-[#9CA3AF]">
        PDF, JPG or PNG · Max 10 MB per file · Other Documents slot is optional
      </p>
    </div>
  );
}

function DocumentTableRow({
  doc,
  mode,
  onFile,
  onVerify,
}: {
  doc: VenueDocument;
  mode: "create" | "edit" | "view";
  onFile: (file: File) => void;
  onVerify: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const hasFile = Boolean(doc.fileName);
  const canManage = mode !== "view" || true;
  const days = daysUntil(doc.expiryDate);
  const expiryWarning = days !== null && days >= 0 && days <= 30;
  const expired = days !== null && days < 0;

  return (
    <tr className="border-b border-[#F3F4F6] last:border-0 align-middle">
      <td className="py-3 pr-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#FFF3EB]">
            <FileText className="h-4 w-4 text-[#C89B3C]" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-[#111827]">
              {doc.name}
              {isOptional(doc.name) && (
                <span className="ml-1.5 text-[11px] font-normal text-[#9CA3AF]">(Optional)</span>
              )}
            </p>
            {hasFile ? (
              <p className="text-[12px] text-[#9CA3AF] truncate mt-0.5">
                {[doc.fileName, doc.fileSize].filter(Boolean).join(" · ")}
              </p>
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) onFile(file);
                }}
                className={`mt-1.5 inline-flex items-center gap-1.5 rounded-lg border border-dashed px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
                  dragging
                    ? "border-[#C89B3C] bg-[#FFF8F3] text-[#C89B3C]"
                    : "border-[#E5E7EB] text-[#6B7280] hover:border-[#FFD4B0] hover:text-[#C89B3C] hover:bg-[#FFF8F3]"
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload file
              </button>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onFile(file);
                e.target.value = "";
              }}
            />
          </div>
        </div>
      </td>
      <td className="py-3 pr-3">
        <DocStatusBadge status={doc.status} />
      </td>
      <td className="py-3 pr-3 text-[#4B5563]">
        {doc.uploadedDate ? formatDate(doc.uploadedDate) : "—"}
      </td>
      <td className="py-3 pr-3 text-[#4B5563]">{doc.verifiedBy || "—"}</td>
      <td className="py-3 pr-3">
        {doc.expiryDate ? (
          <div>
            <p className="text-[#4B5563]">{formatDate(doc.expiryDate)}</p>
            {expiryWarning && (
              <p className="text-[11px] font-medium text-[#D97706] mt-0.5">
                Expires in {days} day{days === 1 ? "" : "s"}
              </p>
            )}
            {expired && (
              <p className="text-[11px] font-medium text-[#DC2626] mt-0.5">Expired</p>
            )}
          </div>
        ) : (
          <span className="text-[#9CA3AF]">—</span>
        )}
      </td>
      <td className="py-3">
        {hasFile ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <ActionBtn icon={Eye} label="View" onClick={() => window.alert(`Viewing ${doc.fileName}`)} />
            <ActionBtn
              icon={Download}
              label="Download"
              onClick={() => window.alert(`Downloading ${doc.fileName}`)}
            />
            {canManage && (
              <ActionBtn
                icon={Upload}
                label="Replace"
                tone="primary"
                onClick={() => inputRef.current?.click()}
              />
            )}
            {canManage && doc.status !== "verified" && (
              <ActionBtn icon={CheckCircle2} label="Verify" tone="success" onClick={onVerify} />
            )}
          </div>
        ) : (
          <span className="text-[12px] text-[#9CA3AF]">—</span>
        )}
      </td>
    </tr>
  );
}

function DocStatusBadge({ status }: { status: DocumentStatus }) {
  const styles: Record<DocumentStatus, string> = {
    verified: "bg-[#ECFDF3] text-[#16A34A] border-[#D3F8E1]",
    uploaded: "bg-[#EFF6FF] text-[#2563EB] border-[#DBEAFE]",
    pending: "bg-[#FCFAF8] text-[#D97706] border-[#FDE9CB]",
    rejected: "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]",
    suspended: "bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  onClick,
  tone = "default",
}: {
  icon: typeof Eye;
  label: string;
  onClick: () => void;
  tone?: "default" | "primary" | "success";
}) {
  const toneCls: Record<string, string> = {
    default:
      "border-[#E8EAF0] text-[#4B5563] hover:border-[#FFD4B0] hover:text-[#C89B3C] hover:bg-[#FFF8F3]",
    primary: "border-[#FFD4B0] text-[#C89B3C] bg-[#FFF8F3] hover:bg-[#FFF3EB]",
    success: "border-[#D3F8E1] text-[#16A34A] bg-[#F0FDF4] hover:bg-[#ECFDF3]",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border text-[12px] font-medium transition-colors ${toneCls[tone]}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}
