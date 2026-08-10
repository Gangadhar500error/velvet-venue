"use client";



import { Loader2, type LucideIcon } from "lucide-react";

import { useTheme } from "../ThemeProvider";



type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline" | "success";

type ButtonSize = "sm" | "md" | "lg";



interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {

  variant?: ButtonVariant;

  size?: ButtonSize;

  icon?: LucideIcon;

  loading?: boolean;

}



const lightVariants: Record<ButtonVariant, string> = {

  primary:

    "bg-[#C89B3C] hover:bg-[#B8862B] text-white shadow-sm border border-transparent",

  secondary:

    "bg-white hover:bg-[#F8F9FB] text-[#111827] border border-[#E8EAF0] shadow-sm",

  outline:

    "bg-transparent hover:bg-[#FFF3EB] text-[#C89B3C] border border-[#C89B3C]/30",

  ghost:

    "bg-transparent hover:bg-[#FFF3EB] text-[#4B5563] hover:text-[#C89B3C] border border-transparent",

  danger:

    "bg-white hover:bg-[#FEF2F2] text-[#DC2626] border border-[#FEF2F2] shadow-sm",

  success:

    "bg-white hover:bg-[#ECFDF3] text-[#16A34A] border border-[#ECFDF3] shadow-sm",

};



const darkVariants: Record<ButtonVariant, string> = {

  primary:

    "bg-[#C89B3C] hover:bg-[#B8862B] text-white shadow-sm border border-transparent",

  secondary:

    "bg-[#243244] hover:bg-[#334155] text-[#F8FAFC] border border-[#334155] shadow-sm",

  outline:

    "bg-transparent hover:bg-[rgba(200, 155, 60,0.12)] text-[#FB923C] border border-[#C89B3C]/35",

  ghost:

    "bg-transparent hover:bg-[rgba(200, 155, 60,0.1)] text-[#CBD5E1] hover:text-[#FB923C] border border-transparent",

  danger:

    "bg-[rgba(239,68,68,0.12)] hover:bg-[rgba(239,68,68,0.2)] text-[#F87171] border border-[rgba(239,68,68,0.35)] shadow-sm",

  success:

    "bg-[rgba(34,197,94,0.12)] hover:bg-[rgba(34,197,94,0.2)] text-[#4ADE80] border border-[rgba(34,197,94,0.35)] shadow-sm",

};



const sizes: Record<ButtonSize, string> = {

  sm: "h-9 px-3 text-xs gap-1.5",

  md: "h-10 px-4 text-sm gap-2",

  lg: "h-11 px-5 text-sm gap-2",

};



export function Button({

  variant = "secondary",

  size = "md",

  icon: Icon,

  loading,

  className = "",

  children,

  disabled,

  ...props

}: ButtonProps) {

  const { isDarkMode } = useTheme();

  const variants = isDarkMode ? darkVariants : lightVariants;



  return (

    <button

      className={`

        inline-flex items-center justify-center rounded-[10px] font-medium

        transition-all duration-150 active:scale-[0.98]

        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C89B3C]/35 focus-visible:ring-offset-1

        disabled:opacity-50 disabled:pointer-events-none

        ${variants[variant]} ${sizes[size]} ${className}

        ${isDarkMode ? "focus-visible:ring-offset-[#0F172A]" : ""}

      `}

      disabled={disabled || loading}

      {...props}

    >

      {loading ? (

        <Loader2 className="w-4 h-4 animate-spin" />

      ) : Icon ? (

        <Icon className="w-4 h-4" />

      ) : null}

      {children}

    </button>

  );

}


