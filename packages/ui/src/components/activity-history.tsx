type ActivityHistoryEntry = {
  key: string;
  /** What happened, such as "Suspended". */
  title: string;
  /** Machine-readable time for the `time` element. */
  dateTime: string;
  /** The time as people read it. */
  dateLabel: string;
  /** Labelled facts about the change, such as the reason given. */
  details?: readonly { label: string; value: string }[];
};

/** Past changes to a record, newest first, each with its time and details. */
export function ActivityHistory({
  entries,
  accessibleLabel,
  scrollsAfter,
}: {
  entries: readonly ActivityHistoryEntry[];
  accessibleLabel: string;
  /**
   * Beyond this many entries the history scrolls inside a box about that
   * many entries tall, newest at the top.
   */
  scrollsAfter?: number;
}) {
  const scrolls = scrollsAfter !== undefined && entries.length > scrollsAfter;
  return (
    <ol
      aria-label={accessibleLabel}
      tabIndex={scrolls ? 0 : undefined}
      className={
        scrolls
          ? "flex flex-col gap-2 overflow-y-auto overscroll-contain rounded-lg pr-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          : "flex flex-col gap-2"
      }
      style={
        scrolls && scrollsAfter !== undefined
          ? { maxHeight: `${(scrollsAfter + 0.5) * 5.5}rem` }
          : undefined
      }
    >
      {entries.map((entry) => (
        <li
          key={entry.key}
          className="flex flex-col gap-1 rounded-lg bg-secondary/50 px-4 py-3"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
            <p className="text-body font-medium">{entry.title}</p>
            <time
              className="text-caption text-muted-foreground"
              dateTime={entry.dateTime}
            >
              {entry.dateLabel}
            </time>
          </div>
          {entry.details && entry.details.length > 0 && (
            <dl className="flex flex-col gap-1">
              {entry.details.map((detail) => (
                <div key={detail.label} className="flex flex-col">
                  <dt className="text-caption text-muted-foreground">
                    {detail.label}
                  </dt>
                  <dd className="text-body [overflow-wrap:anywhere]">
                    {detail.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </li>
      ))}
    </ol>
  );
}

export type { ActivityHistoryEntry };
