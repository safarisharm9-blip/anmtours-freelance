"use client";

import React from "react";

export default function FloatingActions() {
  // 1. ⚠️ ضع رقم الواتساب الخاص بك هنا (بالكود الدولي وبدون أصفار في البداية أو علامة +)
  // مثال للرقم المصري: "201002003004" أو الرقم السعودي: "966501002003"
  const phoneNumber = "201000000000"; 

  // 2. نص الرسالة التلقائية التي تظهر للعميل في صندوق الكتابة ليرسلها لك مباشرة
  const message = encodeURIComponent("مرحباً، أود حجز موعد والاستفسار عن خدماتكم.");

  // الرابط الفعلي الصحيح الذي يفتح محادثتك مباشرة
  const whatsappUrl = `https://wa.me{phoneNumber}?text=${message}`;

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
            direction: "rtl" // يضمن ظهور الأيقونة تليها العبارة العربية بشكل متناسق ومريح للعين
          }}
        >
          {/* أيقونة الواتساب الرسمية */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.457L0 24zm6.59-4.846c1.66.986 3.288 1.486 4.96 1.488 5.25.003 9.522-4.261 9.525-9.516.002-2.546-.988-4.941-2.79-6.745C16.536 2.57 14.141 1.577 11.6 1.577c-5.251 0-9.521 4.261-9.525 9.516-.001 1.84.504 3.409 1.43 4.954l-.972 3.548 3.639-.954zm10.974-5.066c-.29-.145-1.716-.848-1.98-.942-.266-.096-.459-.145-.653.146-.193.291-.748.942-.919 1.138-.17.195-.34.219-.63.075-.29-.145-1.223-.45-2.33-1.439-.862-.769-1.443-1.717-1.612-2.008-.17-.29-.018-.447.127-.591.13-.13.29-.34.436-.51.145-.17.193-.291.291-.485.097-.194.048-.364-.025-.51-.072-.145-.653-1.573-.895-2.154-.235-.567-.475-.49-.653-.49-.17 0-.364-.002-.557-.002-.193 0-.509.073-.775.364-.266.29-1.018.995-1.018 2.428 0 1.432 1.042 2.815 1.188 3.009.145.194 2.05 3.13 4.966 4.387.693.301 1.236.482 1.659.616.697.221 1.332.19 1.833.114.558-.085 1.716-.702 1.96-1.379.243-.678.243-1.261.17-1.379-.074-.117-.266-.194-.556-.34z" />
          </svg>
          
          {/* العبارة النصية الترحيبية */}
          <span>احجز الآن عبر الواتساب</span>
        </a>
      </div>
    </>
  );
}
