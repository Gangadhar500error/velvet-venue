"use client";



import { AnimatePresence, motion } from "framer-motion";

import { X } from "lucide-react";

import { Button } from "./Button";

import { useTheme } from "../ThemeProvider";



interface DrawerProps {

  open: boolean;

  onClose: () => void;

  title: string;

  subtitle?: string;

  width?: number;

  children: React.ReactNode;

  footer?: React.ReactNode;

}



export function Drawer({

  open,

  onClose,

  title,

  subtitle,

  width = 700,

  children,

  footer,

}: DrawerProps) {

  const { isDarkMode } = useTheme();



  return (

    <AnimatePresence>

      {open && (

        <>

          <motion.div

            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"

            initial={{ opacity: 0 }}

            animate={{ opacity: 1 }}

            exit={{ opacity: 0 }}

            onClick={onClose}

          />

          <motion.aside

            className={`fixed top-0 right-0 z-[70] h-full shadow-2xl flex flex-col border-l ${

              isDarkMode ? "bg-[#1E293B] border-[#334155]" : "bg-white border-[#E8EAF0]"

            }`}

            style={{ width: `min(100vw, ${width}px)` }}

            initial={{ x: "100%" }}

            animate={{ x: 0 }}

            exit={{ x: "100%" }}

            transition={{ type: "spring", stiffness: 320, damping: 34 }}

            role="dialog"

            aria-modal="true"

            aria-label={title}

          >

            <div

              className={`flex items-start justify-between gap-4 px-6 py-5 border-b ${

                isDarkMode ? "border-[#334155]" : "border-[#E8EAF0]"

              }`}

            >

              <div>

                <h2 className={`text-lg font-semibold ${isDarkMode ? "text-[#F8FAFC]" : "text-[#111827]"}`}>

                  {title}

                </h2>

                {subtitle && (

                  <p className={`text-sm mt-1 ${isDarkMode ? "text-[#CBD5E1]" : "text-[#4B5563]"}`}>{subtitle}</p>

                )}

              </div>

              <button

                onClick={onClose}

                className={`p-2 rounded-lg transition-colors ${

                  isDarkMode

                    ? "text-[#94A3B8] hover:bg-[rgba(200, 155, 60,0.12)] hover:text-[#FB923C]"

                    : "hover:bg-[#FFF3EB] text-[#4B5563] hover:text-[#C89B3C]"

                }`}

                aria-label="Close drawer"

              >

                <X className="w-5 h-5" />

              </button>

            </div>



            <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>



            {footer && (

              <div

                className={`sticky bottom-0 px-6 py-4 border-t flex flex-wrap items-center justify-end gap-2 ${

                  isDarkMode ? "border-[#334155] bg-[#1E293B]" : "border-[#E8EAF0] bg-white"

                }`}

              >

                {footer}

              </div>

            )}

          </motion.aside>

        </>

      )}

    </AnimatePresence>

  );

}



export function DrawerFooterActions({

  onCancel,

  onSaveDraft,

  onSave,

  onSaveAndNew,

  saving,

}: {

  onCancel: () => void;

  onSaveDraft?: () => void;

  onSave: () => void;

  onSaveAndNew?: () => void;

  saving?: boolean;

}) {

  return (

    <>

      <Button variant="ghost" onClick={onCancel}>

        Cancel

      </Button>

      {onSaveDraft && (

        <Button variant="secondary" onClick={onSaveDraft}>

          Save Draft

        </Button>

      )}

      <Button variant="outline" onClick={onSave} loading={saving}>

        Save

      </Button>

      {onSaveAndNew && (

        <Button variant="primary" onClick={onSaveAndNew} loading={saving}>

          Save & Create New

        </Button>

      )}

    </>

  );

}


