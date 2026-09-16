"use client";

import React from "react";
import { MessageCircle } from "lucide-react";

export default function FloatingActions() {
  // WhatsApp Phone Number (with country code, no + or leading zeros)
  // Example for Egypt: "201002003004" or Saudi: "966501002003"
  const phoneNumber = "201000000000";

  // Auto message in English for international customers
  const message = encodeURIComponent("Hello, I would like to book a tour and inquire about your services.");

  // WhatsApp Direct Link
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <>
      {/* Pulse and glow animation effect */}
      <style>{`
        @keyframes whatsapp-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 4px 12px rgba(37, 211, 102, 0.4); }
          50% { transform: scale(1.05); box-shadow: 0 8px 24px rgba(37, 211, 102, 0.7); }
        }
        .whatsapp-floating-btn {
          animation: whatsapp-pulse 2.5s infinite ease-in-out;
          transition: all 0.3s ease !important;
        }
        .whatsapp-floating-btn:hover {
          transform: scale(1.1) translateY(-3px) !important;
          background-color: #20ba5a !important;
        }
      `}</style>

      {/* Floating Button - Bottom Right */}
      <div style={{ position: "fixed", bottom: "30px", right: "20px", zIndex: 1000 }}>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="whatsapp-floating-btn"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            backgroundColor: "#25D366",
            color: "white",
            padding: "14px 24px",
            borderRadius: "50px",
            textShadow: "none",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            textDecoration: "none",
            fontWeight: "bold",
            fontSize: "15px",
            fontFamily: "sans-serif",
          }}
        >
          {/* WhatsApp Icon */}
          <MessageCircle size={22} strokeWidth={1.5} />

          {/* Button Text */}
          <span>Book Now on WhatsApp</span>
        </a>
      </div>
    </>
  );
}
