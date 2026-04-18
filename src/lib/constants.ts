/**
 * Love Auto Group — Site-wide constants
 */

export const SITE_CONFIG = {
  name: 'Love Auto Group',
  tagline: 'Carefully Selected. Fully Reconditioned. Thoroughly Inspected.',
  phone: '(630) 359-3643',
  phoneRaw: '+16303593643',
  email: 'loveautogroup@gmail.com',
  address: {
    street: '735 N Yale Ave',
    city: 'Villa Park',
    state: 'IL',
    zip: '60181',
    full: '735 N Yale Ave, Villa Park, IL 60181',
  },
  hours: {
    monday: '2:00 PM - 7:00 PM',
    tuesday: '11:00 AM - 7:00 PM',
    wednesday: '11:00 AM - 7:00 PM',
    thursday: '11:00 AM - 7:00 PM',
    friday: '11:00 AM - 7:00 PM',
    saturday: '12:00 PM - 7:00 PM',
    sunday: 'Closed',
  },
  social: {
    facebook: 'https://www.facebook.com/LoveAutoGroup',
    instagram: 'https://www.instagram.com/loveautogroup',
    google: 'https://g.page/loveautogroup',
  },
  url: 'https://loveautogroup.com',
  geo: { lat: 41.8895, lng: -87.978 },
  googleReviews: { rating: 4.7, count: 125 },
  yearFounded: 2014,
} as const;

export const BRAND = {
  colors: {
    red: '#dc2626',
    redDark: '#b91c1c',
    black: '#0a0a0a',
    white: '#ffffff',
    offWhite: '#f9fafb',
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
  },
  fonts: {
    heading: '"Montserrat", sans-serif',
    body: '"Inter", sans-serif',
  },
} as const;

export const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Inventory', href: '/inventory' },
  { label: 'Financing', href: '/financing' },
  { label: 'Sell Your Car', href: '/sell-your-car' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
] as const;

export const TRUST_PILLARS = [
  {
    title: 'Every Vehicle Inspected & Reconditioned',
    description:
      'Our in-house team thoroughly inspects and reconditions every vehicle before it hits the lot. No surprises, no shortcuts.',
    icon: 'shield-check',
  },
  {
    title: 'Transparent Pricing',
    description:
      'The price you see is the price you pay. No hidden fees, no bait-and-switch. We believe in earning your trust.',
    icon: 'tag',
  },
  {
    title: 'Family Owned Since 2014',
    description:
      'Love Auto Group is a family owned business right here in Villa Park. We treat every customer like a neighbor.',
    icon: 'heart',
  },
] as const;
