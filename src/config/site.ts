/**
 * Site-wide configuration.
 * Edit these values to customize your travel agency.
 */

export const SITE_CONFIG = {
  /** WhatsApp number (client/owner) - international format, no + or spaces */
  whatsapp: {
    phone: "+201229172336", // e.g. Egypt: +20 12 2917 2336
    defaultMessage: "Hi! I'm interested in your tours. Can you help me?",
  },
  contact: {
    email: "safarisharm9@gmail.com",
    phone: "+201229172336",
    location: "A&M Tours  - Sharm El-Sheikh",
  },
  /** Emergency & useful contacts for tourists */
  emergency: {
    police: "122",
    ambulance: "123",
    touristPolice: "126",
    embassyInfo: "Contact your embassy for assistance",
  },
};

export function getWhatsAppUrl(message?: string): string {
  const msg = encodeURIComponent(message || SITE_CONFIG.whatsapp.defaultMessage);
  return `https://wa.me/${SITE_CONFIG.whatsapp.phone}?text=${msg}`;
}
