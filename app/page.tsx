import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  MapPinned,
  Stethoscope,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { auth } from "@/auth";
import { tripStickerSrc } from "@/lib/trip/italy-trip";

export const metadata = { title: "Mausi App" };

export default async function AppPickerPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <main className="min-h-dvh flex-1 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.16),transparent_34%),linear-gradient(135deg,#fff7ed_0%,#ffffff_42%,#ecfeff_100%)] px-4 py-5 text-slate-950 dark:bg-none dark:bg-background dark:text-foreground sm:px-6 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-6xl flex-col">
        <header className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight"
          >
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-white/80 text-rose-500 shadow-sm ring-1 ring-rose-100 dark:bg-card dark:ring-border">
              <Sun className="size-4" />
            </span>
            <span>Mausi App</span>
          </Link>
          <nav className="flex items-center gap-1">
            <ThemeToggle />
            <SignOutButton />
          </nav>
        </header>

        <section className="grid flex-1 items-center gap-8 py-8 sm:py-10 lg:grid-cols-[0.88fr_1.12fr]">
          <div className="max-w-xl">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
              Für Mausi
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 dark:text-foreground sm:text-5xl">
              Was darf es heute sein?
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600 dark:text-muted-foreground">
              Lernen für die Uni oder Geburtstagsreise nach Italien. Zwei
              kleine Welten, eine Mausi.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <AppChoiceCard
              href="/doctor"
              title="Mausi wird Ärztin"
              description="Karteikarten, Prüfungstraining und kleine Fortschrittsmomente."
              imageSrc="/maus/doctor.png"
              imageAlt="Mausi als Ärztin"
              icon={<Stethoscope className="size-4" />}
              accent="bg-sky-500"
              stats={["Karten", "Training", "Badges"]}
            />
            <AppChoiceCard
              href="/trip"
              title="Italien Trip"
              description="Route, Stops, Dates und die kleine Geburtstagsüberraschung."
              imageSrc={tripStickerSrc}
              imageAlt="Mausi Sticker"
              icon={<MapPinned className="size-4" />}
              accent="bg-rose-500"
              stats={["7 Tage", "Sonne", "Pasta"]}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function AppChoiceCard({
  href,
  title,
  description,
  imageSrc,
  imageAlt,
  icon,
  accent,
  stats,
}: {
  href: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  icon: React.ReactNode;
  accent: string;
  stats: string[];
}) {
  return (
    <Card className="group overflow-hidden rounded-lg bg-white/90 shadow-[0_18px_55px_rgba(15,23,42,0.12)] ring-slate-200/80 transition duration-300 hover:-translate-y-1 hover:ring-slate-400/50 dark:bg-card dark:ring-border">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-4">
          <span
            className={`inline-flex size-9 items-center justify-center rounded-lg text-white shadow-sm ${accent}`}
          >
            {icon}
          </span>
          <Button asChild size="icon-sm" variant="ghost" title={title}>
            <Link href={href} aria-label={title}>
              <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>
        <div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="mt-1 min-h-12 leading-6">
            {description}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Link
          href={href}
          className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-lg bg-[linear-gradient(135deg,rgba(45,212,191,0.18),rgba(251,113,133,0.16),rgba(250,204,21,0.18))] ring-1 ring-black/5 dark:ring-white/10"
          aria-label={title}
        >
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={1024}
            height={1536}
            className="h-[88%] w-auto object-contain drop-shadow-xl transition duration-300 group-hover:scale-[1.03]"
          />
          <span className="absolute bottom-3 right-3 inline-flex size-9 items-center justify-center rounded-lg bg-white/85 text-slate-800 shadow-sm ring-1 ring-black/5 dark:bg-background/85 dark:text-foreground dark:ring-white/10">
            <BookOpen className="size-4" />
          </span>
        </Link>
        <div className="grid grid-cols-3 gap-2">
          {stats.map((stat) => (
            <span
              key={stat}
              className="rounded-md bg-slate-100 px-2 py-2 text-center text-xs font-medium text-slate-700 dark:bg-muted dark:text-muted-foreground"
            >
              {stat}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
