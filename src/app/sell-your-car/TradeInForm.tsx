"use client";

import { useState } from "react";

export default function TradeInForm() {
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
          Submitted!
        </h3>
        <p className="text-brand-gray-600">
          We&apos;ve received your vehicle info. We&apos;ll review it and get
          back to you with an offer, usually within 24 hours.
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
        Tell Us About Your Vehicle
      </h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="trade-year"
            className="block text-sm font-medium text-brand-gray-900 mb-1"
          >
            Year <span className="text-brand-red">*</span>
          </label>
          <input
            id="trade-year"
            name="year"
            type="number"
            required
            min="1990"
            max="2027"
            className="w-full border border-brand-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
            placeholder="2020"
          />
        </div>
        <div>
          <label
            htmlFor="trade-make"
            className="block text-sm font-medium text-brand-gray-900 mb-1"
          >
            Make <span className="text-brand-red">*</span>
          </label>
          <input
            id="trade-make"
            name="make"
            type="text"
            required
            className="w-full border border-brand-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
            placeholder="Honda"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="trade-model"
            className="block text-sm font-medium text-brand-gray-900 mb-1"
          >
            Model <span className="text-brand-red">*</span>
          </label>
          <input
            id="trade-model"
            name="model"
            type="text"
            required
            className="w-full border border-brand-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
            placeholder="Civic"
          />
        </div>
        <div>
          <label
            htmlFor="trade-trim"
            className="block text-sm font-medium text-brand-gray-900 mb-1"
          >
            Trim
          </label>
          <input
            id="trade-trim"
            name="trim"
            type="text"
            className="w-full border border-brand-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
            placeholder="EX-L (optional)"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="trade-mileage"
            className="block text-sm font-medium text-brand-gray-900 mb-1"
          >
            Mileage <span className="text-brand-red">*</span>
          </label>
          <input
            id="trade-mileage"
            name="mileage"
            type="number"
            required
            className="w-full border border-brand-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
            placeholder="85,000"
          />
        </div>
        <div>
          <label
            htmlFor="trade-condition"
            className="block text-sm font-medium text-brand-gray-900 mb-1"
          >
            Condition <span className="text-brand-red">*</span>
          </label>
          <select
            id="trade-condition"
            name="condition"
            required
            className="w-full border border-brand-gray-200 rounded-lg px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-red"
          >
            <option value="">Select</option>
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
          </select>
        </div>
      </div>

      <hr className="border-brand-gray-100" />

      <h3 className="font-semibold text-brand-gray-900">Your Contact Info</h3>

      <div>
        <label
          htmlFor="trade-name"
          className="block text-sm font-medium text-brand-gray-900 mb-1"
        >
          Full Name <span className="text-brand-red">*</span>
        </label>
        <input
          id="trade-name"
          name="name"
          type="text"
          required
          className="w-full border border-brand-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
          placeholder="Your full name"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="trade-phone"
            className="block text-sm font-medium text-brand-gray-900 mb-1"
          >
            Phone <span className="text-brand-red">*</span>
          </label>
          <input
            id="trade-phone"
            name="phone"
            type="tel"
            required
            className="w-full border border-brand-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
            placeholder="(555) 123-4567"
          />
        </div>
        <div>
          <label
            htmlFor="trade-email"
            className="block text-sm font-medium text-brand-gray-900 mb-1"
          >
            Email <span className="text-brand-red">*</span>
          </label>
          <input
            id="trade-email"
            name="email"
            type="email"
            required
            className="w-full border border-brand-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
            placeholder="you@email.com"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-brand-red hover:bg-brand-red-dark text-white py-3.5 rounded-xl font-semibold text-lg transition-colors"
      >
        Get My Offer
      </button>
    </form>
  );
}
