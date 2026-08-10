"use client";



import { motion } from "framer-motion";

import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

import { useTheme } from "../ThemeProvider";



interface KpiCardProps {

  label: string;

  value: string;

  subtitle?: string;

  growth?: number;

  icon: LucideIcon;

  accent?: string;

  delay?: number;

}



export function KpiCard({

  label,

  value,

  subtitle,

  growth,

  icon: Icon,

  accent = "#C89B3C",

  delay = 0,

}: KpiCardProps) {

  const { isDarkMode } = useTheme();

  const isPositive = growth !== undefined && growth >= 0;



  return (

    <motion.div

      initial={{ opacity: 0, y: 8 }}

      animate={{ opacity: 1, y: 0 }}

      transition={{ duration: 0.15, delay }}

      whileHover={{ y: -4 }}

      className={`border rounded-[18px] p-6 transition-shadow duration-150 ${

        isDarkMode

          ? "bg-[#1E293B] border-[#334155] shadow-[0_1px_3px_rgba(0,0,0,0.35)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.45)]"

          : "bg-white border-[#E8EBEF] shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_28px_rgba(15,23,42,0.06)]"

      }`}

    >

      <div className="flex items-start justify-between gap-3 mb-4">

        <div

          className="w-10 h-10 rounded-xl flex items-center justify-center"

          style={{ backgroundColor: `${accent}${isDarkMode ? "22" : "14"}`, color: accent }}

        >

          <Icon className="w-5 h-5" />

        </div>

        {growth !== undefined && (

          <span

            className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full ${

              isPositive

                ? isDarkMode

                  ? "bg-[rgba(34,197,94,0.18)] text-[#4ADE80]"

                  : "bg-[#ECFDF3] text-[#16A34A]"

                : isDarkMode

                  ? "bg-[rgba(239,68,68,0.18)] text-[#F87171]"

                  : "bg-[#FEF2F2] text-[#DC2626]"

            }`}

          >

            {isPositive ? (

              <ArrowUpRight className="w-3.5 h-3.5" />

            ) : (

              <ArrowDownRight className="w-3.5 h-3.5" />

            )}

            {Math.abs(growth)}%

          </span>

        )}

      </div>

      <p className={`text-[13px] font-medium mb-1 ${isDarkMode ? "text-[#CBD5E1]" : "text-[#4B5563]"}`}>

        {label}

      </p>

      <p

        className={`text-[28px] leading-none font-semibold tracking-tight ${

          isDarkMode ? "text-[#F8FAFC]" : "text-[#111827]"

        }`}

      >

        {value}

      </p>

      {subtitle && (

        <p className={`text-xs mt-2 ${isDarkMode ? "text-[#94A3B8]" : "text-[#9CA3AF]"}`}>{subtitle}</p>

      )}

    </motion.div>

  );

}



export function KpiSkeleton() {

  const { isDarkMode } = useTheme();



  return (

    <div

      className={`border rounded-[18px] p-6 animate-pulse ${

        isDarkMode ? "bg-[#1E293B] border-[#334155]" : "bg-white border-[#E8EBEF]"

      }`}

    >

      <div className={`w-10 h-10 rounded-xl mb-4 ${isDarkMode ? "bg-[#243244]" : "bg-[#F3F4F6]"}`} />

      <div className={`h-3 w-24 rounded mb-3 ${isDarkMode ? "bg-[#243244]" : "bg-[#F3F4F6]"}`} />

      <div className={`h-7 w-20 rounded ${isDarkMode ? "bg-[#243244]" : "bg-[#F3F4F6]"}`} />

    </div>

  );

}


