import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { BadgesButton } from "@/components/badges/badges-button";

export function AppHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto w-full max-w-5xl px-6 py-3 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight hover:opacity-80 transition-opacity"
        >
          <span>Mausi wird Ärztin</span>
          <span aria-hidden>🐭</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">Karteikarten Sets</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/decks/new">
              <Plus className="size-4" />
              Neues Set
            </Link>
          </Button>
          <div className="mx-1 h-5 w-px bg-border" aria-hidden />
          <BadgesButton />
          <ThemeToggle />
          <SignOutButton />
        </nav>
      </div>
    </header>
  );
}
