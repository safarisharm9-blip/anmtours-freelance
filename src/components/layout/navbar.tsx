"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useLocale } from "next-intl";
import { Globe, Menu, LayoutDashboard, Plus, UserRound } from "lucide-react";
import { usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import Image from "next/image";

const localeNames: Record<string, string> = {
  en: "English",
  ar: "العربية",
  ru: "Русский",
  it: "Italiano",
};

const navLinks: { href: string; key: "home" | "destinations" | "travelTips" | "contact"; primary?: boolean }[] = [
  { href: "/", key: "home", primary: true },
  { href: "/destinations", key: "destinations" },
  { href: "/travel-tips", key: "travelTips" },
  { href: "/contact", key: "contact" },
];

type NavbarProps = {
  isAdmin?: boolean;
};

export function Navbar({ isAdmin = false }: NavbarProps) {
  const t = useTranslations("Navbar");
  const pathname = usePathname();
  const locale = useLocale();

  return (
    <header className="max-w-7xl mx-auto  top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <nav className="container flex h-16 items-center justify-between px-4 md:px-0  md:mx-0">
        <Link href="/" className="flex items-center space-x-2 font-semibold shrink-0">
          <Image src="/logo.jpeg" alt="A&M Tours " width={220} height={200} className="h-14 w-auto object-contain md:h-16" />
        </Link>

        {/* Desktop nav - hidden on small screens */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map(({ href, key, primary }) => (
            <Link
              key={key}
              href={href}
              className={`text-sm font-medium transition-colors hover:text-foreground ${primary === true ? "text-primary" : "text-muted-foreground"
                }`}
            >
              {t(key)}
            </Link>
          ))}
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="sm">Sign Up</Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "size-9",
                },
              }}
            >
              <UserButton.MenuItems>
                <UserButton.Link
                  label="My bookings"
                  href={`/${locale}/profile`}
                  labelIcon={<UserRound className="size-4" />}
                />
                {isAdmin && (
                  <UserButton.Link
                    label="Admin"
                    href={`/${locale}/admin`}
                    labelIcon={<LayoutDashboard className="size-4" />}
                  />
                )}
                {
                  isAdmin && (
                    <UserButton.Link
                      label="Add Service"
                      href={`/${locale}/services/add`}
                      labelIcon={<Plus className="size-4" />}
                    />
                  )
                }
              </UserButton.MenuItems>
            </UserButton>
          </SignedIn>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Globe className="size-4" />
                <span className="sr-only">Select language</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {routing.locales.map((locale) => (
                <DropdownMenuItem key={locale} asChild>
                  <Link href={pathname} locale={locale}>
                    {localeNames[locale]}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile menu - Sheet */}
        <div className="flex md:hidden items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Globe className="size-4" />
                <span className="sr-only">Select language</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {routing.locales.map((locale) => (
                <DropdownMenuItem key={locale} asChild>
                  <Link href={pathname} locale={locale}>
                    {localeNames[locale]}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <span className="text-xl">✈️</span>
                  Travel Agency
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-1 pt-6">
                {navLinks.map(({ href, key, primary }) => (
                  <Link
                    key={key}
                    href={href}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors hover:bg-accent ${primary === true ? "text-primary" : "text-foreground"
                      }`}
                  >
                    {t(key)}
                  </Link>
                ))}
                <div className="border-t my-4" />
                <div className="flex flex-col gap-2 px-4">
                  <SignedOut>
                    <SignInButton mode="modal">
                      <Button variant="outline" className="w-full justify-center">
                        Sign In
                      </Button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <Button className="w-full justify-center">Sign Up</Button>
                    </SignUpButton>
                  </SignedOut>
                  <SignedIn>
                    <div className="flex flex-col gap-2">
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 rounded-lg px-4 py-3 hover:bg-accent"
                      >
                        <UserRound className="size-4" />
                        <span className="text-sm font-medium">My bookings</span>
                      </Link>
                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent"
                        >
                          <span className="text-lg">⚙️</span>
                          <span className="text-sm font-medium">Admin</span>
                        </Link>
                      )}
                      <div className="flex items-center gap-3 px-4 py-3">
                        <UserButton
                          afterSignOutUrl="/"
                          appearance={{
                            elements: {
                              avatarBox: "size-10",
                            },
                          }}
                        />
                        <span className="text-sm font-medium">Account</span>
                      </div>
                    </div>
                  </SignedIn>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
