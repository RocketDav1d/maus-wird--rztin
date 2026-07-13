import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { TripClient } from "./trip-client";

export const metadata = {
  title: "Mausi Map · Mausi App",
  description: "Eine kleine Geburtstagsreise als Kartenplanung.",
};

export default async function TripPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <TripHeader />
      <TripClient />
    </div>
  );
}

function TripHeader() {
  return (
    <header className="z-30 shrink-0 border-b border-slate-200/80 bg-white/86 backdrop-blur dark:border-border dark:bg-background/86">
      <div className="flex w-full items-center justify-between gap-2 px-3 py-3 sm:px-4 lg:px-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/">
            <ArrowLeft className="size-4" />
            Apps
          </Link>
        </Button>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
