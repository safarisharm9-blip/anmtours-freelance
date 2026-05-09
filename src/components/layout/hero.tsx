"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { EGYPT_HERO_IMAGES, HERO_IMAGE_INDEX } from "@/config/hero-images";

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export function Hero() {
  const t = useTranslations("Hero");
  const bgImage = EGYPT_HERO_IMAGES[HERO_IMAGE_INDEX];

  return (
    <section className="relative min-h-[95vh] overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          // src={bgImage.url}
          src="/background.jpg"
          alt={bgImage.label}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]" />
      </div>

      {/* Content */}
      <div className="container relative z-10 mx-auto flex min-h-[85vh] flex-col items-center justify-center px-4 py-24 text-center md:py-32">
        <motion.div
          className="mx-auto max-w-3xl"
          variants={container}
          initial="hidden"
          animate="visible"
        >
          {/* Tagline pill */}
          <motion.span
            variants={item}
            className="mb-6 inline-block rounded-full bg-teal-500/90 px-4 py-1.5 text-sm font-medium text-white"
          >
            {t("tagline")}
          </motion.span>

          {/* Main title */}
          <motion.h1
            variants={item}
            className="text-4xl font-bold leading-tight text-white drop-shadow-lg sm:text-5xl md:text-6xl lg:text-7xl"
          >
            {t("title")}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={item}
            className="mt-6 text-lg text-white/95 drop-shadow-md md:text-xl"
          >
            {t("subtitle")}
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            variants={item}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button
              size="lg"
              asChild
              className="rounded-xl bg-teal-500 px-8 font-semibold text-white hover:bg-teal-600"
            >
              <Link href="/destinations">{t("cta")}</Link>
            </Button>
            <Button
              variant="secondary"
              size="lg"
              asChild
              className="rounded-xl border border-white/20 bg-white/10 px-8 font-semibold text-white backdrop-blur-sm hover:bg-white/20"
            >
              <Link href="/contact">{t("secondary")}</Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
