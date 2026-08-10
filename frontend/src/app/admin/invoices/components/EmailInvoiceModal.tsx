"use client";

import { useEffect, useState } from "react";
import { Mail, X } from "lucide-react";
import { Button } from "../../_components/ui/Button";
import { toast } from "../../_components/ui/Toast";

interface EmailInvoiceModalProps {
  open: boolean;
  invoiceNo: string;
  defaultEmail: string;
  onClose: () => void;
}

const inputCls =
  "w-full h-10 px-3 rounded-[10px] border border-[#E8EAF0] bg-[#FCFCFD] text-sm text-[#111827] outline-none focus:bg-white focus:ring-2 focus:ring-[#C89B3C]/20 focus:border-[#C89B3C]";

export function EmailInvoiceModal({
  open,
  invoiceNo,
  defaultEmail,
  onClose,
}: EmailInvoiceModalProps) {
  const [to, setTo] = useState(defaultEmail);
  const [subject, setSubject] = useState(`Invoice ${invoiceNo}`);
  const [message, setMessage] = useState(
    `Dear Customer,\n\nPlease find attached invoice ${invoiceNo} for your booking payment.\n\nThank you for choosing VelvetVenues.\n\nRegards,\nVelvetVenues Finance Team`
  );
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTo(defaultEmail);
    setSubject(`Invoice ${invoiceNo}`);
    setMessage(
      `Dear Customer,\n\nPlease find attached invoice ${invoiceNo} for your booking payment.\n\nThank you for choosing VelvetVenues.\n\nRegards,\nVelvetVenues Finance Team`
    );
  }, [open, defaultEmail, invoiceNo]);

  if (!open) return null;

  const send = async () => {
    if (!to.trim() || !to.includes("@")) {
      toast("Please enter a valid recipient email.", "warning");
      return;
    }
    setSending(true);
    await new Promise((r) => setTimeout(r, 700));
    setSending(false);
    toast(`Invoice ${invoiceNo} emailed successfully.`, "success");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg rounded-[14px] border border-[#E8EAF0] bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E8EAF0] bg-[#FFF3EB]/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#FFF3EB] text-[#C89B3C] flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#111827]">Email Invoice</p>
              <p className="text-xs text-[#9CA3AF]">PDF attachment included</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[#6B7280] hover:bg-white"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[#6B7280]">Recipient</span>
            <input
              className={inputCls}
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="customer@email.com"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[#6B7280]">Subject</span>
            <input
              className={inputCls}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[#6B7280]">Message</span>
            <textarea
              className={`${inputCls} h-32 py-2.5 resize-none`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>
          <div className="rounded-[10px] border border-dashed border-[#E8EAF0] bg-[#FCFCFD] px-3 py-2.5 text-sm text-[#6B7280]">
            Attachment: <span className="font-semibold text-[#111827]">{invoiceNo}.pdf</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3.5 bg-[#FCFCFD] border-t border-[#E8EAF0]">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" icon={Mail} onClick={send} disabled={sending}>
            {sending ? "Sending…" : "Send Invoice"}
          </Button>
        </div>
      </div>
    </div>
  );
}
