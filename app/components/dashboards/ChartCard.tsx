function CloseIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

// Mirrors the inline generate_chart PNG's card treatment (white surface, thin
// border, generous padding) so live dashboard charts read as the same family
// of object as the ones dropped inline in chat.
export function ChartCard({
  title,
  onRemove,
  children,
}: {
  title: string;
  onRemove?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-base font-semibold text-zinc-900">{title}</h4>
        {onRemove && (
          <button
            onClick={onRemove}
            aria-label={`Remove ${title}`}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-zinc-300 hover:bg-zinc-100 hover:text-zinc-600"
          >
            <CloseIcon />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
