export const finalStatuses = new Set(["FT", "AET", "PEN"]);
export const liveStatuses = new Set(["1H", "HT", "2H", "ET", "BT", "P", "LIVE"]);
export const cancelledStatuses = new Set(["PST", "CANC", "ABD", "AWD", "WO"]);

export const stageFilters = [
  { value: "all", label: "Todos" },
  { value: "group", label: "Grupos" },
  { value: "round_of_32", label: "32avos" },
  { value: "round_of_16", label: "8vos" },
  { value: "quarterfinal", label: "4tos" },
  { value: "semifinal", label: "Semis" },
  { value: "third_place", label: "3er Lugar" },
  { value: "final", label: "Final" },
];

export const groupFilters = ["all", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

export const mexicoDateTimeFormatter = new Intl.DateTimeFormat("es-MX", {
  timeZone: "America/Mexico_City",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export const mexicoTimeFormatter = new Intl.DateTimeFormat("es-MX", {
  timeZone: "America/Mexico_City",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export const mexicoDateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Mexico_City",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export const formatMexicoDateTime = (iso: string) => `${mexicoDateTimeFormatter.format(new Date(iso))} CDMX`;
export const formatMexicoTime = (iso: string) => mexicoTimeFormatter.format(new Date(iso));
export const formatMexicoDateKey = (iso: string) => mexicoDateKeyFormatter.format(new Date(iso));
export const formatMexicoDayHeader = (dateKey: string) =>
  mexicoDateTimeFormatter.format(new Date(`${dateKey}T12:00:00-06:00`)).replace(/, \d{2}:\d{2}/, "");

export const normalizeRound = (round?: string | null) => (round || "").toLowerCase();

export const getStage = (round?: string | null, fallbackStage?: string | null) => {
  const value = normalizeRound(round || fallbackStage);
  if (value.includes("group") || value === "group") return "group";
  if (value.includes("round of 32") || value.includes("32")) return "round_of_32";
  if (value.includes("round of 16") || value.includes("8th finals") || value.includes("16")) return "round_of_16";
  if (value.includes("quarter") || value.includes("quarterfinal")) return "quarterfinal";
  if (value.includes("semi")) return "semifinal";
  if (value.includes("3rd") || value.includes("third") || value.includes("third_place")) return "third_place";
  if (value.includes("final")) return "final";
  return "all";
};

export const getGroup = (round?: string | null, groupLabel?: string | null) =>
  groupLabel?.toUpperCase() || round?.match(/group\s+([A-L])/i)?.[1]?.toUpperCase() || null;

export const getStageLabel = (round?: string | null, fallbackStage?: string | null) => {
  const stage = getStage(round, fallbackStage);
  const labels: Record<string, string> = {
    group: "Fase de Grupos",
    round_of_32: "Treintaidosavos",
    round_of_16: "Octavos de Final",
    quarterfinal: "Cuartos de Final",
    semifinal: "Semifinal",
    third_place: "Tercer Lugar",
    final: "Final",
    all: round || "Fase por definir",
  };
  return labels[stage];
};

export const getStatusBadge = (status: string, statusDetail?: string | null) => {
  const detail = statusDetail || status;
  if (status === "finished" || finalStatuses.has(detail)) return { text: "Finalizado", className: "bg-muted text-muted-foreground border-border" };
  if (status === "live" || liveStatuses.has(detail)) return { text: "En curso", className: "bg-destructive/10 text-destructive border-destructive/20" };
  if (detail === "PST") return { text: "Pospuesto", className: "bg-secondary/15 text-secondary-foreground border-secondary/30" };
  if (cancelledStatuses.has(detail)) return { text: "Cancelado", className: "bg-destructive/10 text-destructive border-destructive/20" };
  return { text: "Próximo", className: "bg-primary/10 text-primary border-primary/20" };
};
