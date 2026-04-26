"use client";

/**
 * InquiryModal — modal wrapper around LeadForm for VDP and sticky CTA
 * inquiries. Renders a backdrop + centered card with the form inside.
 * Auto-closes 4 seconds after a successful submission.
 *
 * Portal: renders at document.body to escape any ancestor stacking context.
 * Without this, a `position: sticky` ancestor in the VDP layout was creating
 * a stacking context that scoped our z-[60] modal underneath the floating
 * StickyCTA + TextUsButton pills (themselves at z-40, but in the body's
 * stacking context, so they outranked the modal's contained context).
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import LeadForm, { type LeadFormProps } from "@/components/LeadForm";

interface InquiryModalProps extends LeadFormProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export default function InquiryModal({
  open,
  onClose,
  title = "Get in touch",
  subtitle,
  ...formProps
}: InquiryModalProps) {
  // Mount-only flag — guards createPortal against SSR where `document`
  // doesn't exist. The component is "use client" but Next.js still does
  // an initial pass where document references are unsafe.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll while open + handle Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const modalUI = (
    <div
      // z-[60] beats the floating StickyCTA + TextUsButton (both z-40 but
      // mounted in root layout, AFTER <main> in DOM order — z-50 alone
      // wasn't enough to keep them under the modal). Backdrop bumped to
      // bg-black/80 for cleaner visual separation from photo-card badges.
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-brand-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-brand-gray-900">{title}</h2>
            {subtitle && (
              <p className="mt-0.5 text-sm text-brand-gray-500">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-brand-gray-400 hover:text-brand-gray-700"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="p-6">
          <LeadForm
            {...formProps}
            compact
            onSuccess={(leadId) => {
              if (formProps.onSuccess) formProps.onSuccess(leadId);
              setTimeout(() => onClose(), 4000);
            }}
          />
        </div>
      </div>
    </div>
  );

  return createPortal(modalUI, document.body);
}
