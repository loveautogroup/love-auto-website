"use client";

import { useState } from "react";

export default function FinancingForm() {
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
          Application Received!
        </h3>
        <p className="text-brand-gray-600">
          We&apos;ll review your info and reach out shortly with financing
          options. In the meantime, feel free to{" "}
          <a href="/inventory" className="text-brand-red hover:underline">
            browse our inventory
          </a>
          .
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
      <h2 className="text-xl font-bold text-brand-gray-900">
        Financing Pre-Approval
      </h2>
      <p className="text-sm text-brand-gray-500">
        Fill out the form below and we&apos;ll get back to you with options.
        Fields marked with * are required.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="fin-name"
            className="block text-sm font-medium text-brand-gray-900 mb-1"
          >
            Full Name <span className="text-brand-red">*</span>
          </label>
          <input
            id="fin-name"
            name="name"
            type="text"
            required
            className="w-full border border-brand-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
            placeholder="Your full name"
          />
        </div>
        <div>
          <label
            htmlFor="fin-phone"
            className="block text-sm font-medium text-brand-gray-900 mb-1"
          >
            Phone <span className="text-brand-red">*</span>
          </label>
          <input
            id="fin-phone"
            name="phone"
            type="tel"
            required
            className="w-full border border-brand-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
            placeholder="(555) 123-4567"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="fin-email"
          className="block text-sm font-medium text-brand-gray-900 mb-1"
        >
          Email <span className="text-brand-red">*</span>
        </label>
        <input
          id="fin-email"
          name="email"
          type="email"
          required
          className="w-full border border-brand-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
          placeholder="you@email.com"
        />
      </div>

      <div>
        <label
          htmlFor="fin-vehicle"
          className="block text-sm font-medium text-brand-gray-900 mb-1"
        >
          Vehicle of Interest
        </label>
        <input
          id="fin-vehicle"
          name="vehicle"
          type="text"
          className="w-full border border-brand-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
          placeholder="e.g., 2019 Lexus RX 350 (optional)"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="fin-credit"
            className="block text-sm font-medium text-brand-gray-900 mb-1"
          >
            Estimated Credit Score <span className="text-brand-red">*</span>
          </label>
          <select
            id="fin-credit"
            name="creditScore"
            required
            className="w-full border border-brand-gray-200 rounded-lg px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-red"
          >
            <option value="">Select range</option>
            <option value="excellent">Excellent (720+)</option>
            <option value="good">Good (680–719)</option>
            <option value="fair">Fair (620–679)</option>
            <option value="below">Below 620</option>
            <option value="unsure">Not sure</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="fin-budget"
            className="block text-sm font-medium text-brand-gray-900 mb-1"
          >
            Monthly Budget
          </label>
          <select
            id="fin-budget"
            name="monthlyBudget"
            className="w-full border border-brand-gray-200 rounded-lg px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-red"
          >
            <option value="">Select range</option>
            <option value="200">Up to $200/mo</option>
            <option value="300">$200–$300/mo</option>
            <option value="400">$300–$400/mo</option>
            <option value="500">$400–$500/mo</option>
            <option value="500+">$500+/mo</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-brand-red hover:bg-brand-red-dark text-white py-3.5 rounded-xl font-semibold text-lg transition-colors"
      >
        Submit Pre-Approval
      </button>

      <p className="text-xs text-brand-gray-400 text-center">
        This is a pre-qualification only, not a credit application. Your
        information is confidential.
      </p>
    </form>
  );
}
