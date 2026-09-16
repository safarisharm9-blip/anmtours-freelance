"use client";

import React from "react";

export default function FloatingActions() {
  // 1. ⚠️ ضع رقم الواتساب الخاص بك هنا (بالكود الدولي وبدون أصفار في البداية أو علامة +)
  // مثال للرقم المصري: "201002003004" أو الرقم السعودي: "966501002003"
  const phoneNumber = "201000000000"; 

  // 2. نص الرسالة التلقائية بالإنجليزية للأجانب
  const message = encodeURIComponent("Hello, I would like to book a tour and inquire about your services.");

  // الرابط الفعلي الصحيح الذي يفتح محادثتك مباشرة
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <>
      {/* تأثير نبض واهتزاز مستمر لجذب عين العميل فوراً وسهولة رؤية الزر */}
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

      {/* مكان تثبيت الزر أسفل الشاشة */}
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
            direction: "ltr"
          }}
        >
          {/* أيقونة الواتساب الرسمية */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.995-11.997 11.996C5.97 23.954 3.1 23.436.057 24z"/>
          </svg>
          
          {/* العبارة النصية بالإنجليزية */}
          <span>Book Now on WhatsApp</span>
        </a>
      </div>
    </>
  );
}
