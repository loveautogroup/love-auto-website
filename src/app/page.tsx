import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Used Cars for Sale Villa Park IL | Bank Financing Available | Love Auto Group",
  description:
    "Shop quality used cars, trucks & SUVs at Love Auto Group in Villa Park, IL. We work with banks and credit unions to get you the best rate. Call (630) 359-3643.",
};

const featuredVehicles = [
  {
    year: 2020,
    make: "Toyota",
    model: "Camry SE",
    price: 16995,
    mileage: "42,310",
  },
  {
    year: 2019,
    make: "Honda",
    model: "CR-V EX",
    price: 18495,
    mileage: "55,120",
  },
  {
    year: 2021,
    make: "Ford",
    model: "F-150 XLT",
    price: 27995,
    mileage: "38,750",
  },
];

export default function HomePage() {
  return (
    <main className="flex flex-col">
      {/* ─── Header / Nav ─── */}
      <header className="bg-[#1B4F72] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <span className="text-2xl font-bold tracking-tight">
              Love Auto Group
            </span>
            <span className="ml-2 hidden text-sm opacity-80 sm:inline">
              Villa Park, IL
            </span>
          </div>
          <a
            href="tel:+16303593643"
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#1B4F72] transition hover:bg-gray-100"
          >
            (630) 359-3643
          </a>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="bg-gradient-to-br from-[#1B4F72] to-[#154360] px-4 py-20 text-center text-white sm:py-28">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-extrabold leading-tight sm:text-5xl">
            Quality Used Cars for Sale in Villa Park, IL
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-blue-100 sm:text-xl">
            We work with banks and credit unions to get you approved.
            Competitive rates, flexible terms. Drive home today.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="/inventory"
              className="inline-block rounded-lg bg-amber-500 px-8 py-3 text-lg font-bold text-white shadow-lg transition hover:bg-amber-600"
            >
              Browse Inventory
            </a>
            <a
              href="tel:+16303593643"
              className="inline-block rounded-lg border-2 border-white px-8 py-3 text-lg font-bold text-white transition hover:bg-white hover:text-[#1B4F72]"
            >
              Call Us
            </a>
          </div>
        </div>
      </section>

      {/* ─── Trust Bar ─── */}
      <section className="border-b bg-gray-50 px-4 py-10">
        <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-3">
          {[
            {
              title: "Every Vehicle Inspected",
              text: "Each car undergoes a thorough multi-point inspection before it hits our lot.",
            },
            {
              title: "Bank & Credit Union Financing",
              text: "We partner with trusted banks and credit unions to shop your loan and get you competitive rates.",
            },
            {
              title: "Family-Owned Since 2018",
              text: "Locally owned and operated by Jeremiah and the Love Auto team right here in Villa Park.",
            },
          ].map((item) => (
            <div key={item.title} className="text-center">
              <h3 className="mt-3 text-lg font-bold text-[#1B4F72]">
                {item.title}
              </h3>
              <p className="mt-1 text-sm text-gray-600">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Featured Vehicles ─── */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-bold text-[#1B4F72] sm:text-3xl">
            Featured Vehicles
          </h2>
          <p className="mt-2 text-center text-gray-500">
            Hand-picked from our current inventory
          </p>

          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featuredVehicles.map((v) => (
              <div
                key={`${v.year}-${v.make}-${v.model}`}
                className="overflow-hidden rounded-xl border shadow-sm transition hover:shadow-md"
              >
                {/* photo placeholder */}
                <div className="flex h-48 items-center justify-center bg-gray-200 text-gray-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M3 7h2l2-3h10l2 3h2a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V8a1 1 0 011-1z"
                    />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900">
                    {v.year} {v.make} {v.model}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {v.mileage} miles
                  </p>
                  <p className="mt-2 text-2xl font-extrabold text-[#1B4F72]">
                    ${v.price.toLocaleString()}
                  </p>
                  <a
                    href="/inventory"
                    className="mt-4 inline-block w-full rounded-lg bg-[#1B4F72] py-2 text-center font-semibold text-white transition hover:bg-[#154360]"
                  >
                    View Details
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Why Choose Us ─── */}
      <section className="bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-[#1B4F72] sm:text-3xl">
            Why Choose Love Auto Group?
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {[
              {
                title: "Flexible Financing Options",
                desc: "We work with multiple banks and credit unions to find you the best rate — whether you have great credit or are rebuilding.",
              },
              {
                title: "Transparent Pricing",
                desc: "The price you see is the price you pay. No hidden fees, no last-minute add-ons, no bait-and-switch tactics.",
              },
              {
                title: "Quality You Can Trust",
                desc: "Every vehicle is inspected and road-tested. We stand behind what we sell because our reputation depends on it.",
              },
              {
                title: "Community First",
                desc: "We live and work in Villa Park. Our customers are our neighbors, and we treat them like family.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-lg border bg-white p-6 shadow-sm"
              >
                <h3 className="text-lg font-bold text-[#1B4F72]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Financing CTA / Lead Form ─── */}
      <section className="bg-[#1B4F72] px-4 py-16 text-white">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Get Pre-Approved in Minutes
          </h2>
          <p className="mt-3 text-blue-100">
            Fill out the short form below and a member of our team will reach
            out to discuss your options — no obligation, no credit impact.
          </p>

          <form
            className="mt-8 space-y-4 text-left"
            action="/api/lead"
            method="POST"
          >
            <div>
              <label
                htmlFor="name"
                className="mb-1 block text-sm font-medium text-blue-100"
              >
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full rounded-lg border-0 px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500"
                placeholder="John Smith"
              />
            </div>
            <div>
              <label
                htmlFor="phone"
                className="mb-1 block text-sm font-medium text-blue-100"
              >
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                className="w-full rounded-lg border-0 px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500"
                placeholder="(630) 555-0123"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-blue-100"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="w-full rounded-lg border-0 px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500"
                placeholder="john@example.com"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-amber-500 py-3 text-lg font-bold text-white transition hover:bg-amber-600"
            >
              Get Pre-Approved Now
            </button>
          </form>
        </div>
      </section>

      {/* ─── Reviews ─── */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold text-[#1B4F72] sm:text-3xl">
            What Our Customers Say
          </h2>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="flex text-amber-400" aria-label="4.86 out of 5 stars">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className="h-7 w-7"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
                </svg>
              ))}
            </div>
            <span className="text-2xl font-bold text-gray-800">4.86 / 5</span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Based on Google Reviews
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              {
                name: "Maria G.",
                text: "Jeremiah made the whole process easy. I drove off the lot the same day with a great car and affordable payments!",
              },
              {
                name: "Darnell W.",
                text: "Best experience I've had buying a car. No pressure, no games. They really work with you on financing.",
              },
              {
                name: "Samantha R.",
                text: "I was nervous about buying a used car but Love Auto put me at ease. The vehicle was exactly as described.",
              },
            ].map((review) => (
              <blockquote
                key={review.name}
                className="rounded-lg border bg-gray-50 p-6 text-left"
              >
                <p className="text-sm leading-relaxed text-gray-700">
                  &ldquo;{review.text}&rdquo;
                </p>
                <footer className="mt-3 text-sm font-semibold text-[#1B4F72]">
                  &mdash; {review.name}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Location & Hours ─── */}
      <section className="border-t bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-[#1B4F72] sm:text-3xl">
            Visit Love Auto Group
          </h2>

          <div className="mt-10 grid gap-10 lg:grid-cols-2">
            {/* Map placeholder */}
            <div className="flex h-72 items-center justify-center rounded-xl bg-gray-200 text-gray-400 lg:h-full lg:min-h-[300px]">
              <div className="text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mx-auto h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <p className="mt-2 text-sm">Google Map Embed</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#1B4F72]">
                Love Auto Group
              </h3>
              <address className="mt-2 not-italic leading-relaxed text-gray-600">
                735 N Yale Ave
                <br />
                Villa Park, IL 60181
              </address>
              <p className="mt-3">
                <a
                  href="tel:+16303593643"
                  className="text-lg font-semibold text-[#1B4F72] hover:underline"
                >
                  (630) 359-3643
                </a>
              </p>

              <h4 className="mt-6 font-bold text-gray-800">Hours</h4>
              <ul className="mt-2 space-y-1 text-sm text-gray-600">
                <li className="flex justify-between">
                  <span>Monday &ndash; Friday</span>
                  <span>9:00 AM &ndash; 7:00 PM</span>
                </li>
                <li className="flex justify-between">
                  <span>Saturday</span>
                  <span>9:00 AM &ndash; 5:00 PM</span>
                </li>
                <li className="flex justify-between">
                  <span>Sunday</span>
                  <span>Closed</span>
                </li>
              </ul>

              <div className="mt-6 flex gap-3">
                <a
                  href="https://maps.google.com/?q=735+N+Yale+Ave+Villa+Park+IL+60181"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-[#1B4F72] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#154360]"
                >
                  Get Directions
                </a>
                <a
                  href="tel:+16303593643"
                  className="rounded-lg border border-[#1B4F72] px-5 py-2 text-sm font-semibold text-[#1B4F72] transition hover:bg-[#1B4F72] hover:text-white"
                >
                  Call Now
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-[#0e2f46] px-4 py-10 text-center text-sm text-blue-200">
        <p>
          &copy; 2026 Love Auto Group. All rights reserved.
        </p>
        <p className="mt-1">
          735 N Yale Ave, Villa Park, IL 60181 &middot;{" "}
          <a href="tel:+16303593643" className="hover:text-white">
            (630) 359-3643
          </a>
        </p>
      </footer>
    </main>
  );
}
