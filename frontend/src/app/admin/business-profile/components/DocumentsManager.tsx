"use client";

import { useRef, useState } from "react";
import {
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Upload,
} from "lucide-react";
import { BusinessDocument, DocumentStatus } from "../types";
import { formatDate } from "../data";
import { notify, toast } from "../../_components/ui/Toast";
import {
  downloadUploadedFile,
  mapDocumentFromUpload,
  openUploadedFile,
  uploadBusinessDocument,
} from "@/lib/business-profiles";

interface DocumentsManagerProps {
  documents: BusinessDocument[];
  onChange: (documents: BusinessDocument[]) => void;
  mode?: "create" | "edit" | "view";
  /** When set, Replace/Upload stores the file on the server immediately. */
  businessId?: string;
  /** Create flow: keep raw Files so they can be uploaded after profile create. */
  onPendingFile?: (docId: string, file: File) => void;
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
  return name === "Trade License" || name === "Other Supporting Documents";
}

function mapUploadedDoc(
  slot: BusinessDocument,
  uploaded: ReturnType<typeof mapDocumentFromUpload>
): BusinessDocument {
  return {
    ...slot,
    ...uploaded,
    // Keep stable slot id for local list keys when backend returns a new row.
    id: slot.id.startsWith("doc-") || slot.id.startsWith("tmp-") ? uploaded.id : slot.id,
    name: slot.name,
  };
}

export function DocumentsManager({
  documents,
  onChange,
  mode = "edit",
  businessId,
  onPendingFile,
}: DocumentsManagerProps) {
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const updateDoc = (id: string, patch: Partial<BusinessDocument>) => {
    onChange(documents.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  };

  const handleFile = async (doc: BusinessDocument, file: File | undefined) => {
    if (!file) return;

    const localPatch: Partial<BusinessDocument> = {
      status: "uploaded",
      fileName: file.name,
      fileSize: formatBytes(file.size),
      uploadedDate: todayISO(),
      verifiedBy: "—",
      fileUrl: URL.createObjectURL(file),
    };

    if (businessId && businessId !== "new") {
      setUploadingId(doc.id);
      try {
        const result = await uploadBusinessDocument(
          businessId,
          file,
          doc.name,
          doc.name
        );
        const mapped = mapDocumentFromUpload(result.document);
        onChange(
          documents.map((d) => (d.id === doc.id ? mapUploadedDoc(d, mapped) : d))
        );
        toast("Document uploaded.", "success");
      } catch (err) {
        notify.error(err instanceof Error ? err.message : "Failed to upload document");
        // Keep local preview so View/Download still work until they retry save/upload.
        updateDoc(doc.id, localPatch);
        onPendingFile?.(doc.id, file);
      } finally {
        setUploadingId(null);
      }
      return;
    }

    onPendingFile?.(doc.id, file);
    updateDoc(doc.id, localPatch);
  };

  const handleView = (doc: BusinessDocument) => {
    try {
      openUploadedFile(doc.fileUrl);
    } catch (err) {
      notify.error(
        err instanceof Error
          ? err.message
          : "File is not available. Please replace or re-upload the document."
      );
    }
  };

  const handleDownload = async (doc: BusinessDocument) => {
    try {
      await downloadUploadedFile(doc.fileUrl, doc.fileName || doc.name);
    } catch (err) {
      notify.error(
        err instanceof Error
          ? err.message
          : "File is not available. Please replace or re-upload the document."
      );
    }
  };

  if (documents.length === 0) {
    return (
      <div className="rounded-[12px] border border-dashed border-[#E8EAF0] bg-[#FCFCFD] px-4 py-12 text-center">
        <FileText className="w-8 h-8 text-[#D1D5DB] mx-auto mb-2" />
        <p className="text-sm text-[#9CA3AF]">No document slots for this business.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-[#E8EAF0] text-left text-[11px] uppercase tracking-wider text-[#6B7280]">
              {["Document", "Status", "Uploaded Date", "Verified By", "Actions"].map((h) => (
                <th key={h} className="pb-2.5 pr-3 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <DocumentTableRow
                key={doc.id}
                doc={doc}
                mode={mode}
                uploading={uploadingId === doc.id}
                onFile={(file) => void handleFile(doc, file)}
                onView={() => handleView(doc)}
                onDownload={() => void handleDownload(doc)}
                onVerify={() =>
                  updateDoc(doc.id, { status: "verified", verifiedBy: "Admin User" })
                }
              />
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[12px] text-[#9CA3AF]">
        PDF, JPG or PNG · Max 10 MB per file · Trade License and Other Supporting Documents are optional
      </p>
    </div>
  );
}

function DocumentTableRow({
  doc,
  mode,
  uploading,
  onFile,
  onView,
  onDownload,
  onVerify,
}: {
  doc: BusinessDocument;
  mode: "create" | "edit" | "view";
  uploading: boolean;
  onFile: (file: File) => void;
  onView: () => void;
  onDownload: () => void;
  onVerify: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const hasFile = Boolean(doc.fileName);
  const canManage = mode !== "view";

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
                {uploading ? " · Uploading…" : null}
              </p>
            ) : (
              <button
                type="button"
                disabled={uploading}
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
      <td className="py-3">
        {hasFile ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <ActionBtn icon={Eye} label="View" onClick={onView} disabled={uploading} />
            <ActionBtn
              icon={Download}
              label="Download"
              onClick={onDownload}
              disabled={uploading}
            />
            {(canManage || mode === "view") && (
              <ActionBtn
                icon={Upload}
                label="Replace"
                tone="primary"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              />
            )}
            {canManage && doc.status !== "verified" && (
              <ActionBtn
                icon={CheckCircle2}
                label="Verify"
                tone="success"
                onClick={onVerify}
                disabled={uploading}
              />
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
  disabled = false,
}: {
  icon: typeof Eye;
  label: string;
  onClick: () => void;
  tone?: "default" | "primary" | "success";
  disabled?: boolean;
}) {
  const toneCls: Record<string, string> = {
    default:
      "border-[#E8EAF0] text-[#4B5563] hover:border-[#FFD4B0] hover:text-[#C89B3C] hover:bg-[#FFF8F3]",
    primary:
      "border-[#FFD4B0] text-[#C89B3C] bg-[#FFF8F3] hover:bg-[#FFF3EB]",
    success:
      "border-[#D3F8E1] text-[#16A34A] bg-[#F0FDF4] hover:bg-[#ECFDF3]",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border text-[12px] font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none ${toneCls[tone]}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}
