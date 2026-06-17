# Predictions: jump straight to "where the action is"

Re-organize the Predictions tab inside each private group so users land on the most relevant matches without scrolling.

## Behavior

Each time a user opens the Predictions tab (or changes filters):

1. The list is split in three visual blocks, in this order top-to-bottom:
   - **Partidos anteriores** — collapsible section, **collapsed by default**, containing every day whose matches are all finished/cancelled, *except* the most recent one. Header shows a count, e.g. `Partidos anteriores (24) ▸`.
   - **Última jornada disputada** — the most recent past day, always expanded, so the user immediately sees their last prediction and the points awarded.
   - **Próximos partidos** — all upcoming/live days, always expanded, where users can keep editing predictions.
2. Day headers keep their current sticky styling inside each block.
3. If there are no past matches yet (tournament hasn't started), the collapsible block is hidden and only "Próximos partidos" renders.
4. If every match is already finished, only the collapsible block + last day render, and "Próximos partidos" is hidden.
5. When filters (stage / group) are applied, the same 3-block logic re-runs over the filtered set.
6. The existing top bar ("Calendario oficial" + Actualizar resultados), filters, the floating "Guardar predicciones" button, and the match-card UI stay exactly as they are.

## Why this UX

- Users see their **most recent result first** (last day disputed) — clear feedback on points earned.
- Open matches are now **near the top**, not at the bottom of a long list.
- Older history is one click away via the collapsible, so nothing is lost.

## Technical notes

File: `src/components/group/PredictionsTab.tsx` only. No backend, no schema, no other components.

- A day is considered "past" when every match in that day has `status === "finished"` or `status_detail` in `cancelledStatuses`. Use the existing `finalStatuses` / `cancelledStatuses` helpers from `@/lib/matchCalendar`.
- After computing `groupedByDate`, derive three arrays from its entries (already sorted ascending by date thanks to the underlying query):
  - `pastDays` = consecutive leading entries where the day is "past".
  - `lastClosedDay` = `pastDays.pop()` (may be undefined).
  - `upcomingDays` = the remaining entries.
- Render with `<Collapsible>` from `@/components/ui/collapsible` (already in the project) wrapping `pastDays`. Trigger is a full-width button styled like the existing day header strip, with a chevron icon and the count of matches inside.
- Keep `defaultOpen={false}` on the Collapsible; do **not** persist state — every visit re-collapses, matching the requested behavior.
- The empty-state message ("No se encontraron partidos con estos filtros.") still applies when all three blocks are empty.
- No changes to `MemberPredictionsView`, `LeaderboardTab`, or the demo equivalents — scope is limited to the private-group Predictions tab as requested.
