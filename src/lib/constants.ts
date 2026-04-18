// ============================================================================
// Love Auto Group - Business Constants
// Single source of truth for all business info used across the site.
// ============================================================================

export const SITE_URL = "https://loveautogroup.com";

export const BUSINESS_NAME = "Love Auto Group";

export const ADDRESS = {
  street: "735 N Yale Ave",
  city: "Villa Park",
  state: "IL",
  zip: "60181",
  full: "735 N Yale Ave, Villa Park, IL 60181",
} as const;

export const PHONE = {
  display: "(630) 359-3643",
  href: "tel:+16303593643",
  raw: "+16303593643",
} as const;

export const EMAIL = "loveautogroup@gmail.com";

export const HOURS = [
  { day: "Monday", hours: "2:00 PM - 7:00 PM" },
  { day: "Tuesday", hours: "11:00 AM - 7:00 PM" },
  { day: "Wednesday", hours: "11:00 AM - 7:00 PM" },
  { day: "Thursday", hours: "11:00 AM - 7:00 PM" },
  { day: "Friday", hours: "11:00 AM - 7:00 PM" },
  { day: "Saturday", hours: "12:00 PM - 7:00 PM" },
  { day: "Sunday", hours: "Closed" },
] as const;

/** Schema.org openingHoursSpecification for structured data */
export const OPENING_HOURS_SPECIFICATION = [
  { dayOfWeek: "Monday", opens: "14:00", closes: "19:00" },
  { dayOfWeek: "Tuesday", opens: "11:00", closes: "19:00" },
  { dayOfWeek: "Wednesday", opens: "11:00", closes: "19:00" },
  { dayOfWeek: "Thursday", opens: "11:00", closes: "19:00" },
  { dayOfWeek: "Friday", opens: "11:00", closes: "19:00" },
  { dayOfWeek: "Saturday", opens: "12:00", closes: "19:00" },
] as const;

export const NAP = {
  name: BUSINESS_NAME,
  address: ADDRESS,
  phone: PHONE,
  email: EMAIL,
} as const;

export const NAV_LINKS = [
  { label: "Inventory", href: "/inventory" },
  { label: "Financing", href: "/financing" },
  { label: "About", href: "/about" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
] as const;

export const SOCIAL_LINKS = {
  facebook: "#",
  instagram: "#",
  google: "#",
} as const;
