import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { BadgesButton } from "@/components/badges/badges-button";

export function AppHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-3 flex items-center justify-between gap-2 sm:gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight hover:opacity-80 transition-opacity min-w-0 whitespace-nowrap"
        >
          <span className="truncate">
            <span className="sm:hidden">Mausi</span>
            <span className="hidden sm:inline">Mausi wird Ärztin</span>
          </span>
          <span aria-hidden className="inline-flex items-center gap-0.5">
            <span>🐭</span>
            <span className="sm:hidden">👩‍⚕️</span>
            <span className="sm:hidden">❤️</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 shrink-0">
          <Button asChild variant="ghost" size="sm" className="hidden lg:inline-flex">
            <Link href="/">Karteikarten Sets</Link>
          </Button>
          <Button asChild size="sm" aria-label="Neues Set">
            <Link href="/decks/new">
              <Plus className="size-4" />
              <span className="hidden sm:inline">Neues Set</span>
            </Link>
          </Button>
          <div className="mx-1 h-5 w-px bg-border hidden sm:block" aria-hidden />
          <BadgesButton />
          <ThemeToggle />
          <SignOutButton />
        </nav>
      </div>
    </header>
  );
}
