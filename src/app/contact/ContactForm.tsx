"use client";

import { useState } from "react";

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="bg-brand-green/10 border border-brand-green/20 rounded-xl p-8 text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-12 h-12 text-brand-green mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="text-xl font-bold text-brand-gray-900 mb-2">
          Message Sent!
        </h3>
        <p className="text-brand-gray-600">
          Thanks for reaching out. We&apos;ll get back to you as soon as
          possible, usually within a few hours during business hours.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
      className="bg-white rounded-xl border border-brand-gray-200 p-6 space-y-5"
    >
      <div>
        <label
          htmlFor="contact-name"
          className="block text-sm font-medium text-brand-gray-900 mb-1"
        >
          Full Name <span className="text-brand-red">*</span>
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          required
          className="w-full border border-brand-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent"
          placeholder="Your full name"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="contact-phone"
            className="block text-sm font-medium text-brand-gray-900 mb-1"
          >
            Phone <span className="text-brand-red">*</span>
          </label>
          <input
            id="contact-phone"
            name="phone"
            type="tel"
            required
            className="w-full border border-brand-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent"
            placeholder="(555) 123-4567"
          />
        </div>
        <div>
          <label
            htmlFor="contact-email"
            className="block text-sm font-medium text-brand-gray-900 mb-1"
          >
            Email <span className="text-brand-red">*</span>
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            className="w-full border border-brand-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent"
            placeholder="you@email.com"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="contact-vehicle"
          className="block text-sm font-medium text-brand-gray-900 mb-1"
        >
          Vehicle of Interest
        </label>
        <input
          id="contact-vehicle"
          name="vehicle"
          type="text"
          className="w-full border border-brand-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent"
          placeholder="e.g., 2019 Lexus RX 350 (optional)"
        />
      </div>

      <div>
        <label
          htmlFor="contact-message"
          className="block text-sm font-medium text-brand-gray-900 mb-1"
        >
          Message <span className="text-brand-red">*</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          className="w-full border border-brand-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent resize-y"
          placeholder="How can we help?"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-brand-red hover:bg-brand-red-dark text-white py-3 rounded-xl font-semibold transition-colors"
      >
        Send Message
      </button>

      <p className="text-xs text-brand-gray-400 text-center">
        We typically respond within a few hours during business hours.
      </p>
    </form>
  );
}
