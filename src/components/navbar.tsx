"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = useCallback(async () => {
    const res = await fetch("/api/notifications").catch(() => null);
    if (res?.ok) {
      const data = await res.json();
      setUnreadCount(data.unreadCount);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchUnread();
      const interval = setInterval(fetchUnread, 30000);
      return () => clearInterval(interval);
    }
  }, [session, fetchUnread]);

  const navLinks = [
    { href: "/threads", label: "Threads" },
    { href: "/about", label: "About" },
    ...(session
      ? [
          { href: "/sealed", label: "Sealed Ideas" },
          { href: "/settings", label: "Settings" },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4 mx-auto max-w-6xl">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 mr-6">
          <div className="w-7 h-7 rounded bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
            DC
          </div>
          <span className="text-lg font-bold hidden sm:inline">
            Discovery Commons
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center space-x-1 text-sm font-medium flex-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-md transition-colors ${
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
          className="md:hidden ml-auto mr-2 p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
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

        {/* Auth + notifications */}
        <div className="hidden md:flex items-center space-x-2">
          {status === "loading" ? (
            <div className="h-8 w-20 animate-pulse rounded bg-muted" />
          ) : session ? (
            <>
              <Link href="/notifications" className="relative p-2">
                <svg
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
              <Link href="/profile">
                <Button variant="ghost" size="sm">
                  {session.user.displayName || session.user.name || "Profile"}
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => signIn()}>
              Sign In
            </Button>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t px-4 py-3 space-y-2 bg-background">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2 rounded-md text-sm ${
                pathname === link.href
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {session && (
            <Link
              href="/notifications"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 rounded-md text-sm text-muted-foreground"
            >
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                  {unreadCount}
                </span>
              )}
            </Link>
          )}
          <div className="pt-2 border-t">
            {session ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 rounded-md text-sm text-muted-foreground"
                >
                  Profile
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="block w-full text-left px-3 py-2 rounded-md text-sm text-muted-foreground"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => signIn()}
                className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
