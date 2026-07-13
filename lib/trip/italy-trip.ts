export const tripStickerSrc = "/badges/mausiii.png";

export type TripStopType =
  | "arrival"
  | "resort"
  | "boat"
  | "beach"
  | "spa"
  | "club"
  | "dinner"
  | "departure";

export type TripPlanItem = {
  time: string;
  title: string;
  detail: string;
};

export type TripStop = {
  id: string;
  day: string;
  title: string;
  place: string;
  type: TripStopType;
  pace: string;
  lng: number;
  lat: number;
  eyebrow: string;
  summary: string;
  imageSrc: string;
  imageAlt: string;
  plan: TripPlanItem[];
  logistics: string;
  booking?: string;
  keepsake: string;
};

export type TripBooking = {
  id: string;
  title: string;
  timing: string;
  priority: "hoch" | "mittel" | "flex";
  note: string;
};

export const tripMap = {
  region: "Puntaldia · San Teodoro",
  base: "Due Lune Puntaldia Resort & Golf",
  center: [9.63, 40.84] as [number, number],
  zoom: 10.15,
};

export const tripStops: TripStop[] = [
  {
    id: "due-lune",
    day: "Tag 1",
    title: "Ankommen im Due Lune",
    place: "Puntaldia",
    type: "arrival",
    pace: "ankommen",
    lng: 9.681,
    lat: 40.817,
    eyebrow: "Hoteltransfer, Pool, Privatstrand, erster Aperitivo",
    summary:
      "Der Start bleibt leicht: Transfer ab Olbia, ein erster Gang durch Resort und Marina, danach Luna Nuova und Blue Moon ohne Taxi oder Zeitdruck.",
    imageSrc: "/trip/la-maddalena-pool.jpg",
    imageAlt: "Pool- und Aperitifstimmung in Sardinien",
    plan: [
      {
        time: "Nachmittag",
        title: "Transfer & Check-in",
        detail:
          "Vom Flughafen Olbia direkt nach Puntaldia, Koffer abstellen und erst einmal nichts beweisen müssen.",
      },
      {
        time: "Später",
        title: "Resort-Runde",
        detail:
          "Privatstrand, Pool, Marina und Piazzetta einmal langsam anschauen.",
      },
      {
        time: "Abend",
        title: "Luna Nuova + Blue Moon",
        detail:
          "Cocktail oder Wein auf der Terrasse, danach unkompliziert im Resort essen.",
      },
    ],
    logistics: "Hoteltransfer statt Mietwagen. Ankommen ist der Plan.",
    booking: "Transfer über das Resort anfragen.",
    keepsake: "Boarding Pass und erstes Mausi-Foto am Wasser",
  },
  {
    id: "puntaldia-harbour",
    day: "Tag 2",
    title: "Resorttag & Hafenabend",
    place: "Puntaldia Marina",
    type: "resort",
    pace: "zu Fuß",
    lng: 9.6888,
    lat: 40.8148,
    eyebrow: "Strand, Golf optional, Gazebino, Il Marino",
    summary:
      "Ein voller Resorttag ohne Ortswechsel: spätes Frühstück, Strand oder Golf, Lunch im Gazebino und abends zu Fuß an die Marina.",
    imageSrc: "/trip/sardinia-coast.jpg",
    imageAlt: "Sardische Küste mit Insel und klarem Wasser",
    plan: [
      {
        time: "Vormittag",
        title: "Strand oder 9-Loch-Golf",
        detail:
          "Langsam starten. Wer Lust hat, spielt eine Runde; sonst Pool und Meer.",
      },
      {
        time: "Mittag",
        title: "Gazebino",
        detail:
          "Leichter Lunch, danach wieder Strand, Lesen oder Siesta.",
      },
      {
        time: "Abend",
        title: "Café du Port + Il Marino",
        detail:
          "Aperitif mit Tavolara-Blick, dann Fischrestaurant direkt an der Marina.",
      },
    ],
    logistics: "Alles in Laufnähe. Für Il Marino Terrasse/Hafenblick anfragen.",
    booking: "Il Marino für den zweiten Abend reservieren.",
    keepsake: "Hafenfoto, Aperitifglas, Tavolara im Hintergrund",
  },
  {
    id: "tavolara-molara",
    day: "Tag 3",
    title: "Boot nach Tavolara & Molara",
    place: "Tavolara · Molara",
    type: "boat",
    pace: "Highlight",
    lng: 9.728,
    lat: 40.891,
    eyebrow: "Halbtagestour, Skipper, Schnorchelstopps",
    summary:
      "Das eigentliche Küsten-Highlight der Woche: ein kleines Boot direkt ab Puntaldia, mit Tavolara, den Naturpools von Molara und Capo Coda Cavallo.",
    imageSrc: "/trip/cala-water.jpg",
    imageAlt: "Klares türkises Wasser an der sardischen Küste",
    plan: [
      {
        time: "Vormittag",
        title: "Boot ab Puntaldia",
        detail:
          "Privates Boot mit Skipper, lieber vier Stunden als zu langer Ganztag.",
      },
      {
        time: "Auf dem Wasser",
        title: "Baden & Schnorcheln",
        detail:
          "Tavolara, Molara-Naturpools, Capo Coda Cavallo und mehrere Badestopps.",
      },
      {
        time: "Nachmittag",
        title: "Zurück in den Resort-Modus",
        detail:
          "Zurück ins Resort, spätes Mittagessen, Pool und ein einfacher Abend.",
      },
    ],
    logistics:
      "Wetterabhängig halten und bei Wind mit Resort- oder Mietwagentag tauschen.",
    booking: "Boot mit Skipper direkt ab Marina Puntaldia vorbuchen.",
    keepsake: "Salz auf der Haut + ein sehr blaues Foto",
  },
  {
    id: "coda-cavallo-brandinchi",
    day: "Tag 4",
    title: "Buchten mit Mietwagen",
    place: "Capo Coda Cavallo · Cala Brandinchi",
    type: "beach",
    pace: "ein Autotag",
    lng: 9.7105,
    lat: 40.8334,
    eyebrow: "Cala Suaraccia, Aussichtspunkt, Lu Impostu oder Brandinchi",
    summary:
      "Der einzige flexible Autotag: morgens Wagen ans Hotel liefern lassen, zwei Buchten mitnehmen und abends wieder abgeben.",
    imageSrc: "/trip/cala-water.jpg",
    imageAlt: "Flacher Strand mit klarem sardischen Wasser",
    plan: [
      {
        time: "09:30",
        title: "Los ab Puntaldia",
        detail:
          "Kleinwagen direkt am Hotel übernehmen, ohne sieben Tage Auto mitzuschleppen.",
      },
      {
        time: "10:00",
        title: "Cala Suaraccia / Capo Coda Cavallo",
        detail:
          "Erster Badestopp und Aussicht Richtung Tavolara.",
      },
      {
        time: "15:00",
        title: "Lu Impostu oder Cala Brandinchi",
        detail:
          "Je nach Reservierung und Tageslage: zweiter Badestopp, danach Rückgabe.",
      },
    ],
    logistics:
      "In der Hauptsaison Zugang zu Cala Brandinchi/Lu Impostu separat prüfen.",
    booking: "Mietwagen mit Hotelzustellung und Strand-Zugang reservieren.",
    keepsake: "Strandticket oder kleiner Stein",
  },
  {
    id: "spa-gusto",
    day: "Tag 5",
    title: "Spa & Gusto by Sadler",
    place: "Due Lune · Baglioni Resort",
    type: "spa",
    pace: "ruhiger Luxus",
    lng: 9.6761,
    lat: 40.8219,
    eyebrow: "Private Spa, Paarmassage, Fine Dining",
    summary:
      "Der bewusst gesetzte Luxustag: tagsüber fast nichts, nachmittags Spa und abends ein besonderes Dinner mit festem NCC.",
    imageSrc: "/trip/la-maddalena-pool.jpg",
    imageAlt: "Pool- und Aperitifstimmung in Sardinien",
    plan: [
      {
        time: "Vormittag",
        title: "Sehr wenig vorhaben",
        detail:
          "Ausschlafen, Frühstück, Pool oder Strand und leichter Lunch.",
      },
      {
        time: "15:30",
        title: "Paarmassage + Private Spa",
        detail:
          "Massage, Sauna, Dampfbad, Whirlpool; danach in Ruhe fertig machen.",
      },
      {
        time: "Abend",
        title: "Gusto by Sadler",
        detail:
          "Fine Dining per vorgebuchtem NCC. À la carte reicht, der Abend soll besonders bleiben, nicht zu formell.",
      },
    ],
    logistics:
      "Gusto nicht auf Dienstag legen. Hin- und Rückfahrt gleich mit Festpreis buchen.",
    booking: "Gusto, Private Spa und NCC zuerst fixieren.",
    keepsake: "Menükarte oder Wein-Notiz",
  },
  {
    id: "bal-harbour-luna",
    day: "Tag 6",
    title: "Pooltag & Clubabend",
    place: "San Teodoro",
    type: "club",
    pace: "später Abend",
    lng: 9.673,
    lat: 40.773,
    eyebrow: "Bal Harbour, optional Luna Glam Club",
    summary:
      "Der Tag bleibt komplett frei, damit der Abend funktionieren kann: erst Bal Harbour für Dinner/Drinks, danach je nach Event noch Luna Glam.",
    imageSrc: "/trip/resort-beach.jpg",
    imageAlt: "Sardischer Strand mit Resort-Gefühl",
    plan: [
      {
        time: "Tag",
        title: "Regeneration",
        detail:
          "Ausschlafen, Pool, Strand, Lunch und keinerlei früher Ausflug.",
      },
      {
        time: "20:30",
        title: "Bal Harbour",
        detail:
          "Dinner, Cocktails, Show- oder Poolparty-Vibe als stilvoller Einstieg.",
      },
      {
        time: "00:15",
        title: "Luna Glam, wenn es passt",
        detail:
          "Wenn der Kalender passt: richtiger Club für zwei bis drei Stunden, Rückfahrt fix buchen.",
      },
    ],
    logistics:
      "Nicht selbst fahren. Fahrer-Nummer speichern und Rückfahrt vorher vereinbaren.",
    booking: "Eventkalender checken, Tickets/Guestlist und NCC zusammen buchen.",
    keepsake: "Ein unscharfes, sehr ehrliches Nachtfoto",
  },
  {
    id: "porto-san-paolo",
    day: "Tag 7",
    title: "Il Portolano mit Tavolara-Blick",
    place: "Porto San Paolo",
    type: "dinner",
    pace: "romantisch",
    lng: 9.611,
    lat: 40.875,
    eyebrow: "Regeneration, Spaziergang am Wasser, Fischrestaurant",
    summary:
      "Nach dem späten Abend ein ruhiger Abschlusstag: Strand, Pool und abends Il Portolano mit Blick auf Tavolara.",
    imageSrc: "/trip/sardinia-coast.jpg",
    imageAlt: "Küste und Inselblick in Sardinien",
    plan: [
      {
        time: "Vormittag",
        title: "Sehr spät starten",
        detail:
          "Frühstück, Pool, Privatstrand und optional eine kleine Runde Padel oder Golf.",
      },
      {
        time: "19:00",
        title: "NCC nach Porto San Paolo",
        detail:
          "Vor dem Essen kurz am Wasser entlanglaufen.",
      },
      {
        time: "20:00",
        title: "Il Portolano",
        detail:
          "Außentisch oder Tavolara-Blick anfragen; weniger formell als Gusto, aber sehr schön.",
      },
    ],
    logistics: "Hin- und Rückfahrt per NCC, Tisch draußen anfragen.",
    booking: "Il Portolano mit Tavolara-Blick reservieren.",
    keepsake: "Foto vom letzten Abendlicht",
  },
  {
    id: "departure",
    day: "Tag 8",
    title: "Letzter Morgen",
    place: "Puntaldia · Olbia",
    type: "departure",
    pace: "leicht abreisen",
    lng: 9.5176,
    lat: 40.8987,
    eyebrow: "Frühstück, letztes Bad, Transfer",
    summary:
      "Kein weiterer Ausflug. Nur Frühstück, vielleicht ein letztes Bad und ein sauber organisierter Transfer nach Olbia.",
    imageSrc: "/trip/cala-water.jpg",
    imageAlt: "Klares sardisches Wasser an einem Strand",
    plan: [
      {
        time: "Morgen",
        title: "Langsam packen",
        detail:
          "Frühstück und kein Versuch, noch schnell etwas reinzuschieben.",
      },
      {
        time: "Wenn es passt",
        title: "Letztes Bad",
        detail:
          "Noch einmal Wasser, danach Check-out ohne Hektik.",
      },
      {
        time: "Abreise",
        title: "Transfer nach Olbia",
        detail:
          "Rücktransfer wie Hinweg fest über Hotel oder NCC organisieren.",
      },
    ],
    logistics: "Der letzte Morgen bleibt absichtlich leer.",
    booking: "Rücktransfer vorher bestätigen.",
    keepsake: "Ein Brief für den Rückflug",
  },
];

export const tripRouteCoordinates: [number, number][] = [
  [9.681, 40.817],
  [9.6888, 40.8148],
  [9.728, 40.891],
  [9.7105, 40.8334],
  [9.6761, 40.8219],
  [9.673, 40.773],
  [9.611, 40.875],
  [9.5176, 40.8987],
];

export const tripChecklist = [
  { id: "transfer", label: "Hoteltransfer Olbia ↔ Puntaldia" },
  { id: "boat", label: "Boot Tavolara/Molara mit Skipper" },
  { id: "spa", label: "Private Spa + Paarmassage" },
  { id: "gusto", label: "Gusto by Sadler + NCC" },
  { id: "club", label: "Bal Harbour / Luna Glam Eventabend" },
  { id: "portolano", label: "Il Portolano Außentisch" },
  { id: "car", label: "1 Mietwagentag mit Hotelzustellung" },
];

export const tripBookings: TripBooking[] = [
  {
    id: "gusto",
    title: "Gusto by Sadler",
    timing: "Tag 5 · Abend",
    priority: "hoch",
    note: "Nicht Dienstag. NCC direkt mit Hin- und Rückfahrt fixieren.",
  },
  {
    id: "boat",
    title: "Tavolara & Molara Boot",
    timing: "Tag 3 · Vormittag",
    priority: "hoch",
    note: "Wetterabhängig halten, am besten privat mit Skipper.",
  },
  {
    id: "spa",
    title: "Private Spa + Massagen",
    timing: "Tag 5 · Nachmittag",
    priority: "hoch",
    note: "15:30 Uhr als entspannter Slot vor dem Dinner.",
  },
  {
    id: "club",
    title: "Bal Harbour / Luna Glam",
    timing: "Tag 6 · Nacht",
    priority: "mittel",
    note: "Eventkalender abwarten, Gästeliste oder Tickets und Rückfahrt zusammen sichern.",
  },
  {
    id: "brandinchi",
    title: "Cala Brandinchi / Lu Impostu",
    timing: "Tag 4 · Nachmittag",
    priority: "mittel",
    note: "Saisonregeln und Zugang kurz vor Reise prüfen.",
  },
  {
    id: "portolano",
    title: "Il Portolano",
    timing: "Tag 7 · 20:00",
    priority: "mittel",
    note: "Außentisch mit Tavolara-Blick anfragen.",
  },
];
