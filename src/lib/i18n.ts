/**
 * i18n — EN / ES translation dictionary.
 *
 * Client-side only (localStorage). No URL routing needed for a static
 * Cloudflare Pages export — language preference is persisted in localStorage
 * and applied via the LanguageContext provider in layout.tsx.
 *
 * Scope: UI chrome + high-visibility surface area. Dealer Center content
 * (VDP descriptions, vehicle specs) stays in English because it comes from
 * the DMS feed and isn't editable per-language.
 */

export type Locale = "en" | "es";

export const translations = {
  en: {
    nav: {
      home: "Home",
      inventory: "Inventory",
      financing: "Financing",
      sellYourCar: "Sell Your Car",
      about: "About",
      faq: "FAQ",
      contact: "Contact",
    },
    header: {
      browseInventory: "Browse Inventory",
      freeCarfax: "Free Carfax on every vehicle",
      hours: "Mon 2PM–7PM | Tue–Fri 11AM–7PM | Sat 12PM–7PM",
    },
    footer: {
      quickLinks: "Quick Links",
      businessHours: "Business Hours",
      contactUs: "Contact Us",
      about:
        "Family owned since 2014. We specialize in quality Japanese vehicles, carefully selected and fully reconditioned in Villa Park, IL.",
      rights: "All rights reserved.",
      privacy: "Privacy Policy",
      terms: "Terms",
    },
    hero: {
      headline: "Find Your Next Ride",
      headlineSub: "at Love Auto Group",
      subtext:
        "Quality used vehicles, inspected, reconditioned and ready to drive. Family owned in Villa Park, IL since 2014.",
      cta: "Browse Inventory",
      ctaFinancing: "Get Pre-Approved",
      searchLabel: "Search",
      makeLabel: "Make",
      makeAll: "All Makes",
      priceLabel: "Max Price",
      priceAny: "Any Price",
      bodyLabel: "Body Style",
      bodyAll: "All Types",
      pills: {
        under10: "Under $10K",
        under15: "Under $15K",
        awd: "AWD",
        suvs: "SUVs",
        sedans: "Sedans",
        lowMiles: "Low Mileage",
        justArrived: "Just Arrived",
      },
    },
    ctas: {
      viewDetails: "View Details →",
      getPreApproved: "Get Pre-Approved",
      getCashOffer: "Get a Cash Offer",
      viewInventory: "View Inventory",
      contact: "Contact Us",
      callUs: "Call Us",
    },
    delivery: {
      heading: "Ships Anywhere in the US",
      body: "Can’t make it to Villa Park? We can arrange nationwide delivery. Buyer pays transport — call us for a quote.",
      cta: "(630) 359-3643 — Ask about delivery",
    },
    weBuyCars: {
      eyebrow: "Selling Your Car?",
      heading: "We Buy Cars — Any Make, Any Model",
      body: "Get a real cash offer from a real dealer. No pressure, no obligation, no trade-in required. We buy private party vehicles every week — bring it in and we’ll make you an offer on the spot.",
      cta: "Get a Cash Offer",
      ctaPhone: "Or call us",
    },
    trust: {
      reconTitle: "Ivan’s Recon Checklist",
      reconSub: "Every car inspected & reconditioned before it leaves our lot",
    },
  },

  es: {
    nav: {
      home: "Inicio",
      inventory: "Inventario",
      financing: "Financiamiento",
      sellYourCar: "Vende Tu Auto",
      about: "Nosotros",
      faq: "Preguntas",
      contact: "Contacto",
    },
    header: {
      browseInventory: "Ver Inventario",
      freeCarfax: "Carfax gratis en cada vehículo",
      hours:
        "Lun 2PM–7PM | Mar–Vie 11AM–7PM | Sáb 12PM–7PM",
    },
    footer: {
      quickLinks: "Enlaces Rápidos",
      businessHours: "Horario",
      contactUs: "Contáctenos",
      about:
        "Negocio familiar desde 2014. Nos especializamos en vehículos japoneses de calidad, seleccionados y recondiconados en Villa Park, IL.",
      rights: "Todos los derechos reservados.",
      privacy: "Política de Privacidad",
      terms: "Términos",
    },
    hero: {
      headline: "Encuentra Tu Próximo Auto",
      headlineSub: "en Love Auto Group",
      subtext:
        "Vehículos usados de calidad, inspeccionados, reacondicionados y listos para manejar. Negocio familiar en Villa Park, IL desde 2014.",
      cta: "Ver Inventario",
      ctaFinancing: "Pre-Aprobación",
      searchLabel: "Buscar",
      makeLabel: "Marca",
      makeAll: "Todas las Marcas",
      priceLabel: "Precio Máx.",
      priceAny: "Cualquier Precio",
      bodyLabel: "Tipo de Auto",
      bodyAll: "Todos los Tipos",
      pills: {
        under10: "Menos de $10K",
        under15: "Menos de $15K",
        awd: "Tracción Total",
        suvs: "SUVs",
        sedans: "Sedanes",
        lowMiles: "Bajo Kilometraje",
        justArrived: "Recién Llegados",
      },
    },
    ctas: {
      viewDetails: "Ver Detalles →",
      getPreApproved: "Pre-Aprobación",
      getCashOffer: "Obtener Oferta",
      viewInventory: "Ver Inventario",
      contact: "Contáctenos",
      callUs: "Llámenos",
    },
    delivery: {
      heading: "Enviamos a Todo EE.UU.",
      body: "¿No puede venir a Villa Park? Podemos coordinar entrega a domicilio. El comprador paga el transporte — llámenos para cotizar.",
      cta: "(630) 359-3643 — Preguntar sobre envío",
    },
    weBuyCars: {
      eyebrow: "¿Vendes Tu Auto?",
      heading: "Compramos Autos — Cualquier Marca",
      body: "Obtén una oferta real de un concesionario real. Sin presión, sin compromiso. Compramos autos privados cada semana — tráelo y te hacemos una oferta en el acto.",
      cta: "Obtener Oferta en Efectivo",
      ctaPhone: "O llámenos",
    },
    trust: {
      reconTitle: "Lista de Revisión de Ivan",
      reconSub:
        "Cada auto es inspeccionado y reacondicionado antes de salir de nuestro lote",
    },
  },
} as const;

export type Translations = typeof translations.en;
