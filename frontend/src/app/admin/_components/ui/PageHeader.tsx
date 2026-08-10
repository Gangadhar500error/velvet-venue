"use client";



import Link from "next/link";

import { ChevronRight } from "lucide-react";

import { useTheme } from "../ThemeProvider";



export interface BreadcrumbItem {

  label: string;

  href?: string;

}



export function PageBreadcrumb({ items }: { items: BreadcrumbItem[] }) {

  const { isDarkMode } = useTheme();



  return (

    <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-1.5 text-sm">

      {items.map((item, index) => {

        const isLast = index === items.length - 1;

        return (

          <div key={`${item.label}-${index}`} className="flex items-center gap-1.5">

            {index > 0 && (

              <ChevronRight

                className={`w-3.5 h-3.5 ${isDarkMode ? "text-[#64748B]" : "text-[#9CA3AF]"}`}

              />

            )}

            {item.href && !isLast ? (

              <Link

                href={item.href}

                className={`font-medium transition-colors hover:text-[#C89B3C] ${

                  isDarkMode ? "text-[#CBD5E1]" : "text-[#4B5563]"

                }`}

              >

                {item.label}

              </Link>

            ) : (

              <span

                className={

                  isLast

                    ? `font-semibold ${isDarkMode ? "text-[#F8FAFC]" : "text-[#111827]"}`

                    : isDarkMode

                      ? "text-[#CBD5E1]"

                      : "text-[#4B5563]"

                }

              >

                {item.label}

              </span>

            )}

          </div>

        );

      })}

    </nav>

  );

}



interface PageHeaderProps {

  title: string;

  subtitle?: string;

  breadcrumbs: BreadcrumbItem[];

  actions?: React.ReactNode;

}



export function PageHeader({ title, subtitle, breadcrumbs, actions }: PageHeaderProps) {

  const { isDarkMode } = useTheme();



  return (

    <div className="space-y-4">

      <PageBreadcrumb items={breadcrumbs} />

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">

        <div className="space-y-1.5 max-w-3xl">

          <h1

            className={`text-2xl md:text-[28px] font-semibold tracking-tight ${

              isDarkMode ? "text-[#F8FAFC]" : "text-[#111827]"

            }`}

          >

            {title}

          </h1>

          {subtitle && (

            <p className={`text-sm leading-relaxed ${isDarkMode ? "text-[#CBD5E1]" : "text-[#4B5563]"}`}>

              {subtitle}

            </p>

          )}

        </div>

        {actions && (

          <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>

        )}

      </div>

    </div>

  );

}


