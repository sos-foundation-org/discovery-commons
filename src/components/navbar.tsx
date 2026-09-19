"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { AvatarBadge } from "@/components/ui/avatar-badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSelector, useI18n } from "@/components/language-provider";

export function Navbar() {
  const { t } = useI18n();
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dpBalance, setDpBalance] = useState<number | null>(null);

  const fetchUnread = useCallback(async () => {
    const res = await fetch("/api/notifications").catch(() => null);
    if (res?.ok) {
      const data = await res.json();
      setUnreadCount(data.unreadCount);
    }
  }, []);

  const fetchDP = useCallback(async () => {
    const res = await fetch("/api/points").catch(() => null);
    if (res?.ok) {
      const data = await res.json();
      setDpBalance(data.balance);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchUnread();
      fetchDP();
      const interval = setInterval(fetchUnread, 60000);
      return () => clearInterval(interval);
    }
  }, [session, fetchUnread]);

  // Mobile menu: close on Escape, on a tap outside the header, and on
  // navigation.
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    const onPointer = (e: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [mobileOpen]);
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // `secondary` links don't fit the desktop bar between md and lg; there they
  // live in the hamburger menu instead (which stays available until lg).
  const navLinks = [
    { href: "/threads", label: t("nav.threads"), secondary: false },
    { href: "/about", label: t("nav.about"), secondary: false },
    ...(session
      ? [
          { href: "/sealed", label: t("nav.sealed"), secondary: false },
          { href: "/points", label: t("nav.points"), secondary: true },
          { href: "/credits", label: t("nav.credits"), secondary: true },
          { href: "/settings", label: t("nav.settings"), secondary: true },
        ]
      : []),
  ];
  const hasSecondary = navLinks.some((link) => link.secondary);
  // Hamburger + menu: mobile only, or until lg when there are secondary links.
  const menuHidden = hasSecondary ? "lg:hidden" : "md:hidden";

  return (
    <header ref={headerRef} className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4 mx-auto max-w-6xl">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center space-x-2 mr-6"
          aria-label={t("site.name")}
        >
          <div
            aria-hidden
            className="w-7 h-7 rounded bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold"
          >
            MU
          </div>
          {/* Signed in, hidden md–xl so the nav links fit on one line. */}
          <span
            className={`text-lg font-bold hidden sm:inline whitespace-nowrap ${
              hasSecondary ? "md:hidden xl:inline" : ""
            }`}
          >
            {t("site.name")}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center space-x-1 text-sm font-medium flex-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap px-2 xl:px-2.5 py-1.5 rounded-md transition-colors ${
                link.secondary ? "hidden lg:block" : ""
              } ${
                pathname === link.href
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          className={`${menuHidden} ml-auto mr-2 p-2`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={t("site.nav.toggleMenu")}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {mobileOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>

        {/* Language + Theme + Auth + notifications */}
        <div className="hidden md:flex items-center space-x-2">
          <LanguageSelector />
          <ThemeToggle />
          {status === "loading" ? (
            <div className="h-8 w-20 animate-pulse rounded bg-muted" />
          ) : session ? (
            <>
              {dpBalance !== null && (
                <Link
                  href="/points"
                  className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-accent"
                  title={t("site.nav.discoveryPoints")}
                >
                  {dpBalance.toLocaleString()} DP
                </Link>
              )}
              <Link
                href="/notifications"
                className="relative p-2"
                aria-label={
                  unreadCount > 0
                    ? `${t("nav.notifications")} (${unreadCount})`
                    : t("nav.notifications")
                }
              >
                <svg
                  aria-hidden="true"
                  className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-accent transition-colors"
              >
                <AvatarBadge
                  name={session.user.displayName || session.user.name}
                  seed={session.user.id}
                  image={session.user.image}
                  size="sm"
                />
                <span className="text-sm font-medium hidden lg:inline">
                  {session.user.displayName || session.user.name || t("nav.profile")}
                </span>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                {t("nav.signOut")}
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => signIn()}>
              {t("nav.signIn")}
            </Button>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          id="mobile-menu"
          className={`dc-menu-enter ${menuHidden} border-t px-4 py-3 space-y-2 bg-background`}
        >
          {/* md–lg: the desktop bar already shows the primary links and the
              account controls, so only the secondary links appear here. */}
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2 rounded-md text-sm ${
                link.secondary ? "" : "md:hidden"
              } ${
                pathname === link.href
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {session && dpBalance !== null && (
            <div className="md:hidden px-3 py-2 text-sm font-medium text-muted-foreground">
              {dpBalance.toLocaleString()} DP
            </div>
          )}
          {session && (
            <Link
              href="/notifications"
              onClick={() => setMobileOpen(false)}
              className="block md:hidden px-3 py-2 rounded-md text-sm text-muted-foreground"
            >
              {t("nav.notifications")}
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                  {unreadCount}
                </span>
              )}
            </Link>
          )}
          <div className="md:hidden pt-2 border-t">
            <div className="flex items-center gap-3 px-3 py-2">
              <LanguageSelector />
              <ThemeToggle />
            </div>
            {session ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 rounded-md text-sm text-muted-foreground"
                >
                  {t("nav.profile")}
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="block w-full text-left px-3 py-2 rounded-md text-sm text-muted-foreground"
                >
                  {t("nav.signOut")}
                </button>
              </>
            ) : (
              <button
                onClick={() => signIn()}
                className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium"
              >
                {t("nav.signIn")}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
