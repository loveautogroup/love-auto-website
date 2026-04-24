export const SITE_CONFIG = {
  name: "Love Auto Group",
  tagline: "Quality Used Vehicles in Villa Park, IL",
  phone: "(630) 359-3643",
  phoneRaw: "6303593643",
  email: "loveautogroup@gmail.com",
  address: {
    street: "735 N Yale Ave",
    city: "Villa Park",
    state: "IL",
    zip: "60181",
    full: "735 N Yale Ave, Villa Park, IL 60181",
  },
  url: "https://www.loveautogroup.net",
  established: 2014,
  hours: [
    { day: "Sunday", hours: "Closed" },
    { day: "Monday", hours: "2:00 PM – 7:00 PM" },
    { day: "Tuesday", hours: "11:00 AM – 7:00 PM" },
    { day: "Wednesday", hours: "11:00 AM – 7:00 PM" },
    { day: "Thursday", hours: "11:00 AM – 7:00 PM" },
    { day: "Friday", hours: "11:00 AM – 7:00 PM" },
    { day: "Saturday", hours: "12:00 PM – 7:00 PM" },
  ],
  social: {
    facebook: "https://www.facebook.com/loveautogroup",
    google: "https://g.page/loveautogroup",
    googleReviews: "https://g.page/loveautogroup/review",
  },
  reviews: {
    google: {
      rating: 4.7,
      count: 125,
      readUrl: "https://g.page/loveautogroup",
      writeUrl: "https://g.page/loveautogroup/review",
    },
  },
  geo: {
    lat: 41.8895,
    lng: -87.978,
  },
} as const;

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Inventory", href: "/inventory" },
  { label: "Financing", href: "/financing" },
  { label: "Sell Your Car", href: "/sell-your-car" },
  { label: "About", href: "/about" },
  // Blog removed Apr 2026 — content lives at src/data/blog.ts and the
  // /blog routes are deleted. Restore by re-adding routes and putting
  //   { label: "Blog", href: "/blog" }
  // back into NAV_LINKS.
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
] as const;
