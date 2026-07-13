"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowDown,
  CalendarCheck,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  ClipboardList,
  Download,
  Dumbbell,
  GripHorizontal,
  Heart,
  MapPin,
  Martini,
  Plane,
  Printer,
  Sailboat,
  ShipWheel,
  Sparkles,
  Sun,
  Ticket,
  Utensils,
  Waves,
} from "lucide-react";
import {
  Map as MapCanvas,
  MapControls,
  MapMarker,
  MapRoute,
  MarkerContent,
  MarkerLabel,
  MarkerTooltip,
  useMap,
} from "@/components/ui/map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  tripBookings,
  tripChecklist,
  tripMap,
  tripRouteCoordinates,
  tripStickerSrc,
  tripStops,
  type TripBooking,
  type TripStop,
  type TripStopType,
} from "@/lib/trip/italy-trip";

const checklistStorageKey = "mausi-puntaldia-checklist-v1";

type TripView = "agenda" | "pass" | "bookings";
type AgendaMode = "overview" | "detail";

const typeIcons: Record<TripStopType, LucideIcon> = {
  arrival: Plane,
  resort: Dumbbell,
  boat: Sailboat,
  beach: Waves,
  spa: Sparkles,
  club: Martini,
  dinner: Utensils,
  departure: ShipWheel,
};

const priorityStyles: Record<TripBooking["priority"], string> = {
  hoch: "border-[#ff5f93]/35 bg-[#fff2f7] text-[#c72e68]",
  mittel: "border-slate-200 bg-white text-slate-700",
  flex: "border-[#90d7e8]/45 bg-[#f1fbfd] text-[#237085]",
};

const priorityLabels: Record<TripBooking["priority"], string> = {
  hoch: "zuerst",
  mittel: "planen",
  flex: "flexibel",
};

const mausiSceneTags = ["Puntaldia", "Tavolara", "Mausi"];
const mausiMarkerOffset: [number, number] = [0, -32];
const tripMapStyles = {
  dark: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
  light: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
};
const introTearDistance = 260;
const introOpenThreshold = 0.76;
const introExitDelayMs = 620;

export function TripClient() {
  const [view, setView] = useState<TripView>("agenda");
  const [agendaMode, setAgendaMode] = useState<AgendaMode>("overview");
  const [selectedId, setSelectedId] = useState(tripStops[0]?.id);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [hasLoadedChecklist, setHasLoadedChecklist] = useState(false);
  const [hasOpenedPass, setHasOpenedPass] = useState(false);
  const panelScrollRef = useRef<HTMLDivElement>(null);

  const selectedIndex = Math.max(
    0,
    tripStops.findIndex((stop) => stop.id === selectedId),
  );
  const selectedStop = tripStops[selectedIndex] ?? tripStops[0];

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(checklistStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as unknown;
        if (Array.isArray(parsed)) {
          const validIds = tripChecklist.map((item) => item.id);
          setCheckedIds(
            parsed.filter(
              (item): item is string =>
                typeof item === "string" && validIds.includes(item),
            ),
          );
        }
      }
    } finally {
      setHasLoadedChecklist(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedChecklist) return;
    window.localStorage.setItem(
      checklistStorageKey,
      JSON.stringify(checkedIds),
    );
  }, [checkedIds, hasLoadedChecklist]);

  useEffect(() => {
    panelScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [agendaMode, selectedId, view]);

  const checkedCount = checkedIds.length;
  const progress = useMemo(
    () => Math.round((checkedCount / tripChecklist.length) * 100),
    [checkedCount],
  );

  function toggleChecklist(id: string) {
    setCheckedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function selectStop(id: string) {
    setSelectedId(id);
  }

  function openStopDetail(id: string) {
    setSelectedId(id);
    setView("agenda");
    setAgendaMode("detail");
  }

  function moveSelection(offset: number, nextMode: AgendaMode = "detail") {
    const nextIndex =
      (selectedIndex + offset + tripStops.length) % tripStops.length;
    openStopDetail(tripStops[nextIndex].id);
    setAgendaMode(nextMode);
  }

  function handleViewChange(next: string) {
    const nextView = next as TripView;
    setView(nextView);
    if (nextView === "agenda" && view !== "agenda") {
      setAgendaMode("overview");
    }
  }

  return (
    <main className="relative isolate min-h-0 flex-1 overflow-hidden bg-[#fff8fb] text-slate-950 dark:bg-background dark:text-foreground">
      <div
        className="absolute inset-0 -z-10 opacity-70 dark:opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,95,147,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(80,182,205,0.1) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
        aria-hidden
      />

      <Tabs
        value={view}
        onValueChange={handleViewChange}
        className="contents"
      >
        <div className="absolute inset-0 z-0">
          <MapCanvas
            center={tripMap.center}
            zoom={tripMap.zoom}
            minZoom={8}
            maxZoom={15}
            theme="light"
            styles={tripMapStyles}
            className="h-full w-full"
          >
            <TripMapCamera selectedStop={selectedStop} />
            <MapRoute
              id="puntaldia-route"
              coordinates={tripRouteCoordinates}
              color="#ff5f93"
              width={3}
              opacity={0.66}
              dashArray={[1.3, 1.25]}
            />
            {tripStops.map((stop, index) => (
              <HotspotMarker
                key={stop.id}
                stop={stop}
                index={index}
                selected={stop.id === selectedStop.id}
                onSelect={() => openStopDetail(stop.id)}
              />
            ))}
            <MausiMapSticker
              selectedStop={selectedStop}
              selectedIndex={selectedIndex}
              onAdvance={() => moveSelection(1)}
            />
            <MapControls
              position="top-right"
              showCompass
              className="right-4 top-24 hidden md:flex"
            />
          </MapCanvas>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[linear-gradient(180deg,rgba(255,248,251,0.78),rgba(255,248,251,0))]" />
          <div className="pointer-events-none absolute inset-y-0 left-0 w-[min(640px,80vw)] bg-[linear-gradient(90deg,rgba(255,248,251,0.72),rgba(255,248,251,0.28),rgba(255,248,251,0))]" />
        </div>

        <div className="pointer-events-none relative z-10 flex h-full min-h-0 flex-col p-3 sm:p-4 lg:p-6">
          <div className="pointer-events-auto absolute inset-x-3 top-3 z-20 flex justify-center sm:inset-x-4 sm:top-4 lg:inset-x-auto lg:right-6 lg:top-6 lg:justify-end">
            <TabsList className="grid h-11 w-full max-w-full grid-cols-3 border border-[#ffd2e1] bg-white/92 shadow-sm ring-1 ring-[#ff8ab3]/15 backdrop-blur dark:bg-card/88 dark:ring-white/10 min-[390px]:inline-flex min-[390px]:w-fit md:h-9">
              <TabsTrigger
                value="agenda"
                aria-label="Agenda"
                className="min-w-0 px-1.5 min-[390px]:px-2.5 sm:px-3"
              >
                <CalendarDays className="size-4" />
                <span className="sr-only min-[390px]:not-sr-only">
                  Agenda
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="pass"
                aria-label="Pass"
                className="min-w-0 px-1.5 min-[390px]:px-2.5 sm:px-3"
              >
                <Ticket className="size-4" />
                <span className="sr-only min-[390px]:not-sr-only">
                  Pass
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="bookings"
                aria-label="Buchen"
                className="min-w-0 px-1.5 min-[390px]:px-2.5 sm:px-3"
              >
                <ClipboardList className="size-4" />
                <span className="sr-only min-[390px]:not-sr-only">
                  Buchen
                </span>
              </TabsTrigger>
            </TabsList>
          </div>

          <aside className="pointer-events-auto mt-14 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#ffd2e1] bg-white/95 shadow-[0_20px_70px_rgba(255,95,147,0.16)] backdrop-blur-xl dark:border-border dark:bg-card/94 md:w-[480px] lg:mt-0 lg:w-[500px]">
            <div
              ref={panelScrollRef}
              className="min-h-0 flex-1 overflow-y-auto p-4 pb-6 md:p-5 md:pb-6"
            >
              <TripPanelHeader />

              {view === "agenda" && (
                <AgendaMapPanel
                  mode={agendaMode}
                  selectedId={selectedStop.id}
                  selectedIndex={selectedIndex}
                  onAdvance={() => moveSelection(1)}
                  onPrevious={() => moveSelection(-1)}
                  onOpenDetail={openStopDetail}
                  onBackToOverview={() => setAgendaMode("overview")}
                  onSelectStop={selectStop}
                />
              )}

              {view === "bookings" && (
                <BookingsPanel
                  checkedIds={checkedIds}
                  checkedCount={checkedCount}
                  progress={progress}
                  onToggleChecklist={toggleChecklist}
                />
              )}

              {view === "pass" && <PassPanel />}
            </div>
          </aside>
        </div>
      </Tabs>

      {!hasOpenedPass && (
        <BoardingPassIntro onOpen={() => setHasOpenedPass(true)} />
      )}
    </main>
  );
}

function TripPanelHeader() {
  const [burst, setBurst] = useState(0);

  return (
    <div className="mb-4 overflow-hidden rounded-lg border border-[#ffd2e1] bg-[linear-gradient(135deg,#fff7fb,#effbff)] p-3 shadow-sm dark:border-border dark:bg-card">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#ff4f8b]">
            <Sparkles className="size-3.5" />
            Geburtstagsreise
          </div>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">
            Mausi in Puntaldia
          </h1>
          <p className="mt-0.5 truncate text-xs font-medium text-slate-500 dark:text-muted-foreground">
            {tripMap.base}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setBurst((current) => current + 1)}
          className="group relative grid size-12 shrink-0 place-items-center rounded-full border border-[#ffd2e1] bg-white/88 shadow-sm transition hover:-rotate-3 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5f93] sm:size-14"
          aria-label="Mausi Glücksbutton"
          title="Mausi Glücksbutton"
        >
          <span
            key={burst}
            className={cn(
              "pointer-events-none absolute -right-1 -top-1 text-sm text-[#ff5f93] opacity-0",
              burst > 0 && "animate-ping opacity-100",
            )}
            aria-hidden
          >
            ♥
          </span>
          <Image
            src={tripStickerSrc}
            alt=""
            width={56}
            height={84}
            className="h-auto w-7 drop-shadow-[0_8px_12px_rgba(199,46,104,0.22)] transition group-hover:-translate-y-0.5 sm:w-8"
          />
        </button>
      </div>
    </div>
  );
}

function BoardingPassIntro({ onOpen }: { onOpen: () => void }) {
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const startYRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const progress = isOpening
    ? 1
    : Math.min(dragY / introTearDistance, 1);
  const lowerOffset = isOpening ? introTearDistance + 130 : dragY;
  const lowerRotation = progress * 3.4;
  const revealOpacity =
    progress < 0.12 ? 0 : Math.min((progress - 0.12) * 1.3, 1);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  function openPass() {
    if (isOpening) return;
    setIsOpening(true);
    setIsDragging(false);
    timeoutRef.current = window.setTimeout(onOpen, introExitDelayMs);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    if (isOpening) return;
    startYRef.current = event.clientY - dragY;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    if (!isDragging || startYRef.current === null || isOpening) return;

    const nextDrag = Math.max(
      0,
      Math.min(event.clientY - startYRef.current, introTearDistance),
    );
    setDragY(nextDrag);

    if (nextDrag / introTearDistance >= introOpenThreshold) {
      openPass();
    }
  }

  function handlePointerEnd() {
    if (isOpening) return;
    setIsDragging(false);
    startYRef.current = null;

    if (progress >= introOpenThreshold) {
      openPass();
      return;
    }

    setDragY(0);
  }

  return (
    <section
      className={cn(
        "absolute inset-0 z-50 grid place-items-center overflow-hidden bg-[#fff8fb] p-4 transition duration-700 ease-out sm:p-6",
        isOpening && "opacity-0",
      )}
      aria-label="Birthday Pass öffnen"
    >
      <div
        className="absolute inset-0 opacity-80"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,95,147,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(80,182,205,0.12) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_52%_42%,rgba(255,95,147,0.22),transparent_32%),radial-gradient(circle_at_34%_66%,rgba(117,215,232,0.26),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.78),rgba(255,248,251,0.96))]"
        aria-hidden
      />

      <div className="relative w-full max-w-[720px]">
        <div className="absolute -inset-10 rounded-full bg-[#ff5f93]/12 blur-3xl" />
        <div className="relative text-center">
          <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-[#ffd2e1] bg-white/86 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#c72e68] shadow-sm backdrop-blur sm:mb-4">
            <Ticket className="size-3.5" />
            Birthday Boarding
          </div>
        </div>

        <div className="relative mx-auto overflow-visible rounded-xl shadow-[0_28px_90px_rgba(255,95,147,0.22)]">
          <div className="relative z-10 overflow-hidden rounded-t-xl border border-b-0 border-[#ffb8cf] bg-[linear-gradient(135deg,#ffffff_0%,#fff7fb_58%,#effbff_100%)] p-4 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-[0.28em] text-[#ff4f8b] sm:text-base sm:tracking-[0.36em]">
                Birthday Pass
              </span>
              <Sun className="size-5 text-[#ffb33f]" />
            </div>

            <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2 sm:mt-9 sm:gap-6">
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7b8aa5] sm:text-sm">
                  From
                </div>
                <div className="mt-2 text-2xl font-semibold leading-tight tracking-tight min-[360px]:text-3xl sm:text-4xl">
                  Long
                  <br />
                  Distance
                </div>
              </div>
              <div className="grid place-items-center pb-2">
                <Heart className="size-6 text-[#ff5f93] sm:size-7" />
              </div>
              <div className="min-w-0 text-right">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7b8aa5] sm:text-sm">
                  To
                </div>
                <div className="mt-2 text-2xl font-semibold leading-tight tracking-tight min-[360px]:text-3xl sm:text-4xl">
                  Love
                  <br />
                  Forever
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2 sm:mt-8 sm:gap-3">
              <IntroPassField label="Gate" value="OLB" />
              <IntroPassField label="Seat" value="2A+2B" />
              <IntroPassField label="Mode" value="Mausi" />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-b-xl border border-t-0 border-[#ffb8cf] bg-[linear-gradient(135deg,#fff8fb,#edfaff)] px-4 pb-5 pt-10 sm:px-7 sm:pb-8 sm:pt-16">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 z-20 h-12 -translate-y-1/2"
              aria-hidden
            >
              <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[repeating-linear-gradient(90deg,#ff8ab3_0_10px,transparent_10px_20px)] opacity-95" />
              <div className="absolute left-0 top-1/2 size-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#ffb8cf] bg-[#fff8fb] shadow-[inset_-4px_0_10px_rgba(255,95,147,0.08)]" />
              <div className="absolute right-0 top-1/2 size-8 -translate-y-1/2 translate-x-1/2 rounded-full border border-[#ffb8cf] bg-[#fff8fb] shadow-[inset_4px_0_10px_rgba(255,95,147,0.08)]" />
            </div>

            <div
              className="absolute inset-0 grid place-items-center px-6 text-center transition-opacity duration-300"
              style={{ opacity: revealOpacity }}
              aria-hidden={!isOpening && progress < 0.35}
            >
              <div className="relative">
                <div className="absolute inset-x-8 top-1/2 h-12 -translate-y-1/2 rounded-full bg-[#ff5f93]/24 blur-2xl" />
                <Image
                  src={tripStickerSrc}
                  alt=""
                  width={128}
                  height={192}
                  className="relative mx-auto h-auto w-24 drop-shadow-[0_16px_24px_rgba(199,46,104,0.24)] sm:w-28"
                />
                <div className="relative mt-2 text-xs font-bold uppercase tracking-[0.22em] text-[#ff4f8b]">
                  Sardinien freigeschaltet
                </div>
                <div className="relative mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                  Die Mausi-Karte wartet.
                </div>
              </div>
            </div>

            <button
              type="button"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerEnd}
              onPointerCancel={handlePointerEnd}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openPass();
                }
              }}
              className="relative z-10 block w-full cursor-grab rounded-lg border border-[#ffb8cf] bg-white/94 px-3 py-3 text-left shadow-[0_18px_46px_rgba(36,52,71,0.14)] outline-none transition focus-visible:ring-3 focus-visible:ring-[#ff8ab3]/35 active:cursor-grabbing sm:px-4 sm:py-4"
              style={{
                transform: `translate3d(0, ${lowerOffset}px, 0) rotate(${lowerRotation}deg)`,
                transformOrigin: "50% 0%",
                transition: isDragging
                  ? "none"
                  : "transform 560ms cubic-bezier(.2,.9,.2,1)",
                touchAction: "none",
              }}
              aria-label="Unteren Teil des Birthday Pass öffnen"
            >
              <div className="mb-3 flex items-center justify-between gap-4 sm:mb-4">
                <div className="font-mono text-xs uppercase tracking-[0.22em] text-[#7b8aa5]">
                  DL-MAUS-2026
                </div>
                <div className="flex items-center gap-2 rounded-full border border-[#ffd2e1] bg-[#fff2f7] px-3 py-1 text-xs font-semibold text-[#c72e68]">
                  <ArrowDown className="size-3.5" />
                  Aufziehen
                </div>
              </div>

              <div className="flex min-w-0 items-center gap-3">
                <div className="h-9 min-w-0 flex-1 rounded-sm bg-[repeating-linear-gradient(90deg,#243447_0_4px,transparent_4px_8px,#243447_8px_11px,transparent_11px_17px)] opacity-80 sm:h-11" />
                <div className="shrink-0 rounded-md border border-dashed border-[#ff8ab3]/55 bg-white/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#c72e68]">
                  Valid
                </div>
              </div>

              <div className="mt-3 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7b8aa5] sm:mt-4">
                <GripHorizontal className="size-4 text-[#ff8ab3]" />
                Ticketkante
              </div>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function IntroPassField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#ffd2e1] bg-white/74 px-3 py-3 shadow-sm backdrop-blur">
      <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#7b8aa5]">
        {label}
      </div>
      <div className="mt-1 text-base font-semibold text-slate-950 sm:text-lg">
        {value}
      </div>
    </div>
  );
}

function TripMapCamera({ selectedStop }: { selectedStop: TripStop }) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;

    const fitMap = () => {
      const isDesktop = window.matchMedia("(min-width: 768px)").matches;
      const center: [number, number] = isDesktop
        ? [selectedStop.lng - 0.055, selectedStop.lat + 0.004]
        : [selectedStop.lng, selectedStop.lat - 0.05];

      map.resize();
      map.easeTo({
        center,
        zoom: isDesktop ? 10.35 : 10.05,
        bearing: 0,
        pitch: 0,
        duration: 650,
      });
    };

    const frame = requestAnimationFrame(fitMap);
    window.addEventListener("resize", fitMap);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", fitMap);
    };
  }, [map, isLoaded, selectedStop.lat, selectedStop.lng]);

  return null;
}

function HotspotMarker({
  stop,
  index,
  selected,
  onSelect,
}: {
  stop: TripStop;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = typeIcons[stop.type];

  return (
    <MapMarker longitude={stop.lng} latitude={stop.lat} onClick={onSelect}>
      <MarkerContent>
        <div className="relative grid place-items-center">
          {selected && (
            <div
              className="absolute size-14 rounded-full bg-[#ff5f93]/26 ring-2 ring-[#ff8ab3]/40"
              aria-hidden
            />
          )}
          <div
            className={cn(
              "relative z-10 grid size-9 place-items-center rounded-full border-2 border-white text-white shadow-lg ring-2 ring-white/80 transition-transform dark:border-slate-950 dark:ring-white/20",
              "bg-[#2f6f86]",
              selected && "scale-110 bg-[#ff5f93] shadow-xl",
            )}
          >
            {stop.type === "departure" ? (
              <Plane className="size-4" />
            ) : (
              <span className="text-xs font-semibold">{index + 1}</span>
            )}
          </div>
        </div>
        <MarkerLabel
          position="bottom"
          className={cn(
            "rounded-md bg-white/94 px-1.5 py-0.5 text-[0.62rem] text-slate-700 shadow-sm ring-1 ring-[#ff8ab3]/20 backdrop-blur dark:bg-card/90 dark:text-foreground dark:ring-white/10",
            !selected && "hidden sm:block",
          )}
        >
          {stop.title}
        </MarkerLabel>
      </MarkerContent>
      <MarkerTooltip>
        <span className="inline-flex items-center gap-1">
          <Icon className="size-3" />
          {stop.title}
        </span>
      </MarkerTooltip>
    </MapMarker>
  );
}

function MausiMapSticker({
  selectedStop,
  selectedIndex,
  onAdvance,
}: {
  selectedStop: TripStop;
  selectedIndex: number;
  onAdvance: () => void;
}) {
  return (
    <MapMarker
      longitude={selectedStop.lng}
      latitude={selectedStop.lat}
      anchor="bottom"
      offset={mausiMarkerOffset}
    >
      <MarkerContent className="z-20">
        <button
          type="button"
          onClick={onAdvance}
          className="relative grid place-items-center transition-transform hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5f93]"
          aria-label={`Mausi weiter zu Tag ${(selectedIndex + 1) % tripStops.length + 1}`}
          title="Mausi weiter"
        >
          <Image
            src={tripStickerSrc}
            alt="Mausi Sticker auf der Karte"
            width={96}
            height={144}
            className="relative z-10 h-auto w-16 drop-shadow-[0_12px_18px_rgba(199,46,104,0.28)] sm:w-20"
          />
        </button>
      </MarkerContent>
      <MarkerTooltip>
        <span className="inline-flex items-center gap-1">
          <Heart className="size-3 text-[#ff5f93]" />
          Mausi weiter zu Tag {(selectedIndex + 1) % tripStops.length + 1}
        </span>
      </MarkerTooltip>
    </MapMarker>
  );
}

function DayDetailPanel({
  selectedStop,
  selectedIndex,
  onPrevious,
  onNext,
  onBackToOverview,
  onSelectStop,
}: {
  selectedStop: TripStop;
  selectedIndex: number;
  onPrevious: () => void;
  onNext: () => void;
  onBackToOverview: () => void;
  onSelectStop: (id: string) => void;
}) {
  const Icon = typeIcons[selectedStop.type];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onBackToOverview}
          className="-ml-2 text-slate-600 hover:text-slate-950"
        >
          <ChevronLeft className="size-4" />
          Agenda
        </Button>
        <Badge
          variant="outline"
          className="border-[#ff8ab3]/40 bg-[#fff2f7] text-[#c72e68]"
        >
          <CalendarDays className="size-3" />
          {selectedStop.day}
        </Badge>
      </div>

      <DayJumpRail selectedId={selectedStop.id} onSelectStop={onSelectStop} />

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-border dark:bg-background">
        <div className="relative aspect-[1.55]">
          <Image
            src={selectedStop.imageSrc}
            alt={selectedStop.imageAlt}
            fill
            preload
            sizes="(max-width: 768px) 92vw, 430px"
            className="object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,0.58))]" />
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3 text-white">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-md bg-white/18 px-2 py-1 text-xs font-semibold backdrop-blur">
                <Icon className="size-3.5" />
                {selectedStop.day}
              </div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                {selectedStop.title}
              </h2>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="icon-sm"
                variant="secondary"
                onClick={onPrevious}
                aria-label="Vorheriger Tag"
                title="Vorheriger Tag"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="secondary"
                onClick={onNext}
                aria-label="Nächster Tag"
                title="Nächster Tag"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-[#ff8ab3]/40 bg-[#fff2f7] text-[#c72e68]"
            >
              <MapPin className="size-3" />
              {selectedStop.place}
            </Badge>
            <Badge variant="outline" className="border-slate-200 bg-white">
              {selectedStop.pace}
            </Badge>
            <span className="ml-auto text-xs font-medium text-slate-500 dark:text-muted-foreground">
              {selectedIndex + 1} / {tripStops.length}
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-muted-foreground">
            {selectedStop.summary}
          </p>
          <MausiJourneyCue
            selectedStop={selectedStop}
            selectedIndex={selectedIndex}
            onAdvance={onNext}
          />
          <div className="mt-4 grid gap-2">
            {selectedStop.plan.map((item) => (
              <div
                key={`${selectedStop.id}-${item.time}-${item.title}`}
                className="grid gap-2 rounded-md bg-slate-50 p-3 text-sm ring-1 ring-slate-200 dark:bg-card dark:ring-border sm:grid-cols-[5.75rem_1fr] sm:gap-3"
              >
                <div className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-[#ff4f8b]">
                  {item.time}
                </div>
                <div>
                  <div className="font-semibold">{item.title}</div>
                  <div className="mt-1 leading-5 text-slate-600 dark:text-muted-foreground">
                    {item.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-2 rounded-md bg-[#fff2f7] p-3 text-sm ring-1 ring-[#ff8ab3]/24 dark:bg-[#a9443d]/10 dark:ring-[#a9443d]/20">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#c72e68] dark:text-[#f0b2ad]">
              <Sparkles className="size-3.5" />
              Mausi-Detail
            </div>
            <p className="font-medium">{selectedStop.keepsake}</p>
            {selectedStop.booking && (
              <p className="text-slate-600 dark:text-muted-foreground">
                {selectedStop.booking}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DayJumpRail({
  selectedId,
  onSelectStop,
}: {
  selectedId: string;
  onSelectStop: (id: string) => void;
}) {
  return (
    <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
      {tripStops.map((stop, index) => {
        const active = stop.id === selectedId;
        return (
          <button
            key={stop.id}
            type="button"
            onClick={() => onSelectStop(stop.id)}
            className={cn(
              "grid size-11 shrink-0 place-items-center rounded-full border text-xs font-semibold shadow-sm transition sm:size-9",
              active
                ? "border-[#ff5f93] bg-[#ff5f93] text-white"
                : "border-[#ffd2e1] bg-white text-slate-600 hover:border-[#ff8ab3]",
            )}
            aria-label={`${stop.day} öffnen`}
            title={stop.title}
          >
            {index + 1}
          </button>
        );
      })}
    </div>
  );
}

function MausiJourneyCue({
  selectedStop,
  selectedIndex,
  onAdvance,
}: {
  selectedStop: TripStop;
  selectedIndex: number;
  onAdvance: () => void;
}) {
  return (
    <div className="mt-4 flex items-center gap-3 rounded-lg border border-[#ffd2e1] bg-[linear-gradient(90deg,#fff2f7,#effbff)] p-2.5 shadow-sm">
      <Image
        src={tripStickerSrc}
        alt=""
        width={56}
        height={84}
        className="h-auto w-12 shrink-0 drop-shadow-[0_10px_16px_rgba(199,46,104,0.2)]"
      />
      <div className="min-w-0 flex-1">
        <div className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#ff4f8b]">
          Kartenpunkt
        </div>
        <div className="mt-0.5 truncate text-sm font-semibold">
          Tag {selectedIndex + 1}: {selectedStop.place}
        </div>
      </div>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={onAdvance}
        className="shrink-0 border border-[#ffd2e1] bg-white/80 text-[#c72e68] hover:bg-white"
      >
        Nächster Tag
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}

function AgendaMapPanel({
  mode,
  selectedId,
  selectedIndex,
  onAdvance,
  onPrevious,
  onOpenDetail,
  onBackToOverview,
  onSelectStop,
}: {
  mode: AgendaMode;
  selectedId: string;
  selectedIndex: number;
  onAdvance: () => void;
  onPrevious: () => void;
  onOpenDetail: (id: string) => void;
  onBackToOverview: () => void;
  onSelectStop: (id: string) => void;
}) {
  const selectedStop = tripStops[selectedIndex] ?? tripStops[0];

  if (mode === "detail") {
    return (
      <DayDetailPanel
        selectedStop={selectedStop}
        selectedIndex={selectedIndex}
        onPrevious={onPrevious}
        onNext={onAdvance}
        onBackToOverview={onBackToOverview}
        onSelectStop={(id) => {
          onSelectStop(id);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Badge
          variant="outline"
          className="border-[#ff8ab3]/40 bg-[#fff2f7] text-[#c72e68]"
        >
          <CalendarDays className="size-3" />
          7 Nächte · 8 Tage
        </Badge>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">
          Sieben Nächte, ein roter Faden.
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-muted-foreground">
          Boot, Buchten, Spa und zwei schöne Abende. Dazwischen bleibt Platz
          für Pool, Strand, Siesta und einfach treiben lassen.
        </p>
        <div className="mt-3 flex items-center gap-3 rounded-lg border border-[#ffd2e1] bg-[#fff2f7] p-2.5 shadow-sm">
          <Image
            src={tripStickerSrc}
            alt=""
            width={48}
            height={72}
            className="h-auto w-10 shrink-0 drop-shadow-[0_8px_14px_rgba(199,46,104,0.2)]"
          />
          <div className="min-w-0 flex-1">
            <div className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#ff4f8b]">
              Gerade auf der Karte
            </div>
            <div className="truncate text-sm font-semibold">
              Tag {selectedIndex + 1}: {selectedStop.title}
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => {
              onAdvance();
            }}
            className="shrink-0 border border-[#ffd2e1] bg-white/80 text-[#c72e68] hover:bg-white"
          >
            Öffnen
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="relative">
        <svg
          className="absolute bottom-10 left-3 top-7 w-14 overflow-visible text-[#ff5f93]/72"
          viewBox="0 0 56 1000"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="M27 0 C49 65 8 110 29 178 C50 244 52 300 24 356 C-6 416 9 480 34 518 C56 552 51 624 28 678 C7 728 24 804 31 862 C39 930 13 958 29 1000"
            fill="none"
            stroke="currentColor"
            strokeDasharray="5 8"
            strokeLinecap="round"
            strokeWidth="3"
          />
        </svg>

        <div className="space-y-3">
          {tripStops.map((stop, index) => {
            const active = stop.id === selectedId;
            return (
              <button
                key={stop.id}
                type="button"
                onClick={() => onOpenDetail(stop.id)}
                className={cn(
                  "relative grid min-h-28 w-full grid-cols-[2.75rem_4.75rem_1fr] gap-3 rounded-lg border bg-white p-3 text-left shadow-sm transition dark:bg-background",
                  active
                    ? "border-[#ff8ab3]/50 ring-2 ring-[#ff8ab3]/20"
                    : "border-slate-200 hover:border-slate-300 dark:border-border",
                )}
              >
                {active && (
                  <Image
                    src={tripStickerSrc}
                    alt=""
                    width={44}
                    height={66}
                    className="absolute -left-1 top-14 z-20 h-auto w-10 -rotate-6 drop-shadow-[0_8px_14px_rgba(199,46,104,0.24)]"
                  />
                )}
                <span
                  className={cn(
                    "relative z-10 grid size-9 place-items-center rounded-full border-2 border-white text-xs font-semibold shadow-sm",
                    active
                      ? "bg-[#ff5f93] text-white"
                      : "bg-[#2f6f86] text-white dark:bg-foreground dark:text-background",
                  )}
                >
                  {index + 1}
                </span>
                <span className="relative h-20 overflow-hidden rounded-md bg-slate-100">
                  <Image
                    src={stop.imageSrc}
                    alt=""
                    fill
                    sizes="76px"
                    className="object-cover"
                  />
                </span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{stop.day}</span>
                    {active && (
                      <span className="rounded-full bg-[#fff2f7] px-2 py-0.5 text-[0.62rem] font-semibold text-[#c72e68] ring-1 ring-[#ffd2e1]">
                        gerade hier
                      </span>
                    )}
                    <span className="text-xs font-medium text-slate-500 dark:text-muted-foreground">
                      {stop.place}
                    </span>
                  </span>
                  <span className="mt-1 block text-base font-semibold tracking-tight">
                    {stop.title}
                  </span>
                  <span className="mt-2 block text-xs leading-5 text-slate-600 dark:text-muted-foreground">
                    {stop.eyebrow}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BookingsPanel({
  checkedIds,
  checkedCount,
  progress,
  onToggleChecklist,
}: {
  checkedIds: string[];
  checkedCount: number;
  progress: number;
  onToggleChecklist: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Badge variant="outline" className="border-slate-200 bg-white">
          <CalendarCheck className="size-3" />
          Buchungen
        </Badge>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">
          Was vorher sitzen sollte.
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-muted-foreground">
          Boot, Spa, Gusto und die Fahrten rechtzeitig fixieren. Der Rest darf
          nach Wetter, Lust und Abendform rutschen.
        </p>
      </div>

      <div className="grid gap-2">
        {tripBookings.map((booking) => (
          <div
            key={booking.id}
            className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-border dark:bg-background"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{booking.title}</h3>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-muted-foreground">
                  {booking.timing}
                </p>
              </div>
              <Badge
                variant="outline"
                className={cn("shrink-0", priorityStyles[booking.priority])}
              >
                {priorityLabels[booking.priority]}
              </Badge>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-muted-foreground">
              {booking.note}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-border dark:bg-background">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold">Packliste & To-dos</h3>
            <p className="text-xs text-slate-500 dark:text-muted-foreground">
              {checkedCount} von {tripChecklist.length} erledigt.
            </p>
          </div>
          <div className="grid size-12 place-items-center rounded-md bg-slate-100 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 dark:bg-muted dark:text-foreground dark:ring-border">
            {progress}%
          </div>
        </div>
        <div className="mt-3 grid gap-2">
          {tripChecklist.map((item) => {
            const checked = checkedIds.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onToggleChecklist(item.id)}
                className={cn(
                  "flex min-h-10 items-center justify-between gap-3 rounded-md border px-3 text-left text-sm transition",
                  checked
                    ? "border-[#ff8ab3]/45 bg-[#fff2f7] text-slate-950 dark:bg-[#a9443d]/10 dark:text-foreground"
                    : "border-slate-200 bg-white hover:bg-slate-50 dark:border-border dark:bg-card dark:hover:bg-muted/50",
                )}
              >
                <span>{item.label}</span>
                {checked ? (
                  <Check className="size-4 text-[#ff4f8b]" />
                ) : (
                  <Circle className="size-4 text-slate-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PassPanel() {
  const passRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  async function renderPassImage() {
    if (!passRef.current) return null;
    const { toPng } = await import("html-to-image");
    return toPng(passRef.current, {
      backgroundColor: "#fff8fb",
      cacheBust: true,
      pixelRatio: 2,
    });
  }

  async function downloadPass() {
    setIsExporting(true);
    try {
      const dataUrl = await renderPassImage();
      if (!dataUrl) return;
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "mausi-birthday-pass.png";
      link.click();
    } finally {
      setIsExporting(false);
    }
  }

  async function printPass() {
    setIsExporting(true);
    try {
      const dataUrl = await renderPassImage();
      if (!dataUrl) return;
      const printWindow = window.open("", "_blank", "width=900,height=700");
      if (!printWindow) return;
      printWindow.document.write(`
        <!doctype html>
        <html>
          <head>
            <title>Mausi Birthday Pass</title>
            <style>
              body {
                margin: 0;
                min-height: 100vh;
                display: grid;
                place-items: center;
                background: #fff8fb;
              }
              img {
                width: min(92vw, 720px);
                height: auto;
              }
              @media print {
                body { background: white; }
                img { width: 100%; max-width: 720px; }
              }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" alt="Mausi Birthday Pass" />
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      window.setTimeout(() => printWindow.print(), 250);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Badge
          variant="outline"
          className="border-[#ff8ab3]/40 bg-[#fff2f7] text-[#c72e68]"
        >
          <Ticket className="size-3" />
          Birthday Pass
        </Badge>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">
          Mausi-Modus zum Mitnehmen.
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-muted-foreground">
          Zum Downloaden, Drucken und Einstecken: der kleine Pass für eine
          Woche Sardinien zu zweit.
        </p>
      </div>

      <MausiSceneCard />
      <div ref={passRef}>
        <BirthdayPassCard />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={downloadPass}
          disabled={isExporting}
          className="border border-[#ffd2e1] bg-white/88 text-[#c72e68] hover:bg-white"
        >
          <Download className="size-4" />
          Download
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={printPass}
          disabled={isExporting}
          className="border border-[#ffd2e1] bg-white/88 text-[#c72e68] hover:bg-white"
        >
          <Printer className="size-4" />
          Drucken
        </Button>
      </div>
    </div>
  );
}

function MausiSceneCard() {
  return (
    <div className="relative min-h-64 overflow-hidden rounded-lg border border-[#ffd2e1] bg-[#fff2f7] shadow-sm dark:border-border dark:bg-background">
      <Image
        src="/trip/cala-water.jpg"
        alt="Klares sardisches Wasser an einem Strand"
        fill
        sizes="(max-width: 768px) 92vw, 500px"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,242,247,0.74)_72%,rgba(255,242,247,0.94))]" />
      <div className="absolute left-4 top-4 flex flex-wrap gap-2">
        {mausiSceneTags.map((label) => (
          <span
            key={label}
            className="rounded-full border border-white/80 bg-white/86 px-2.5 py-1 text-xs font-semibold text-[#c72e68] shadow-sm backdrop-blur"
          >
            {label}
          </span>
        ))}
      </div>
      <Image
        src={tripStickerSrc}
        alt="Mausi Sticker"
        width={190}
        height={285}
        className="absolute bottom-5 right-5 h-auto w-32 drop-shadow-[0_18px_28px_rgba(199,46,104,0.25)] sm:w-36"
      />
      <div className="absolute bottom-5 left-4 max-w-56">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#ff4f8b]">
          Sardinien-Schnipsel
        </div>
        <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
          Kleine Schatzkarte für Sardinien.
        </div>
      </div>
    </div>
  );
}

function BirthdayPassCard() {
  return (
    <div className="relative overflow-hidden rounded-lg border border-[#ffd2e1] bg-[linear-gradient(135deg,#ffffff_0%,#fff7fb_58%,#effbff_100%)] p-4 shadow-sm dark:border-border dark:bg-background">
      <div className="absolute -left-3 top-1/2 size-6 -translate-y-1/2 rounded-full border border-[#ffd2e1] bg-[#fff8fb] dark:border-border dark:bg-card" />
      <div className="absolute -right-3 top-1/2 size-6 -translate-y-1/2 rounded-full border border-[#ffd2e1] bg-[#fff8fb] dark:border-border dark:bg-card" />

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-[0.28em] text-[#ff4f8b]">
          Birthday Pass
        </span>
        <Sun className="size-4 text-[#ffb33f]" />
      </div>

      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-end gap-3">
        <div>
          <div className="text-[0.68rem] font-medium uppercase tracking-[0.16em] text-slate-500">
            From
          </div>
          <div className="mt-1 text-lg font-semibold leading-tight">
            Long
            <br />
            Distance
          </div>
        </div>
        <Heart className="mb-1 size-4 text-[#ff5f93]" />
        <div className="text-right">
          <div className="text-[0.68rem] font-medium uppercase tracking-[0.16em] text-slate-500">
            To
          </div>
          <div className="mt-1 text-lg font-semibold leading-tight">
            Love
            <br />
            Forever
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 text-[0.66rem]">
        <PassMeta label="Gate" value="OLB" />
        <PassMeta label="Seat" value="2A+2B" />
        <PassMeta label="Mode" value="Mausi" />
      </div>

      <div className="mt-5 grid gap-2">
        <div className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[#7b8aa5]">
          DL-MAUS-2026
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <div className="h-8 min-w-0 flex-1 rounded-sm bg-[repeating-linear-gradient(90deg,#243447_0_3px,transparent_3px_6px,#243447_6px_8px,transparent_8px_12px)] opacity-80 dark:bg-[repeating-linear-gradient(90deg,#ffffff_0_3px,transparent_3px_6px,#ffffff_6px_8px,transparent_8px_12px)]" />
          <div className="shrink-0 rounded-md border border-dashed border-[#ff8ab3]/55 bg-white/70 px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-[#c72e68]">
            Valid
          </div>
        </div>
      </div>
    </div>
  );
}

function PassMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/78 px-2 py-1.5 ring-1 ring-[#ffd2e1] dark:bg-muted dark:ring-border">
      <div className="font-semibold uppercase tracking-[0.12em] text-[#7b8aa5]">
        {label}
      </div>
      <div className="mt-0.5 font-semibold text-slate-900 dark:text-foreground">
        {value}
      </div>
    </div>
  );
}
