export function StatTile({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-2 py-2 text-center">
      <div className="truncate text-xl font-semibold text-zinc-900">{value}</div>
      <div className="text-xs leading-tight text-zinc-500">{label}</div>
    </div>
  );
}

// Equal-width tiles spanning the full available width, rather than each
// tile sizing to its own content (which left uneven gaps when labels like
// "Voicemail" sat next to short ones like "Sale").
export function StatTileRow({
  tiles,
}: {
  tiles: { key: string; value: string | number; label: string }[];
}) {
  return (
    <div
      className="mb-4 grid gap-2"
      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(70px, 1fr))" }}
    >
      {tiles.map((t) => (
        <StatTile key={t.key} value={t.value} label={t.label} />
      ))}
    </div>
  );
}
