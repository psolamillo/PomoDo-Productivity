import { useCallback, useEffect, useState } from "react";

const API_BASE_URL = "http://localhost:3123";

const RANGES = [
  { key: "day", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "lifetime", label: "Lifetime" },
];

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatDuration(totalSeconds) {
  if (!totalSeconds) {
    return "0m";
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours && minutes) {
    return `${hours}h ${minutes}m`;
  }

  if (hours) {
    return `${hours}h`;
  }

  if (minutes) {
    return `${minutes}m`;
  }

  return `${totalSeconds}s`;
}

function formatDayLabel(dateString) {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  return WEEKDAY_LABELS[(date.getUTCDay() + 6) % 7];
}

export default function StatsPanel() {
  const [range, setRange] = useState("day");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const handleSessionUpdated = () => setRefreshKey((key) => key + 1);
    window.addEventListener("session-updated", handleSessionUpdated);
    return () =>
      window.removeEventListener("session-updated", handleSessionUpdated);
  }, []);

  const fetchStats = useCallback(async (selectedRange) => {
    const today = new Date().toISOString().slice(0, 10);
    const urls = {
      day: `${API_BASE_URL}/api/stats/day/${today}`,
      week: `${API_BASE_URL}/api/stats/week`,
      lifetime: `${API_BASE_URL}/api/stats/lifetime`,
    };

    const response = await fetch(urls[selectedRange]);

    if (!response.ok) {
      throw new Error("Unable to load stats");
    }

    return response.json();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      try {
        setLoading(true);
        setError("");
        const data = await fetchStats(range);

        if (!cancelled) {
          setStats(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message || "Unable to load stats.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadStats();

    return () => {
      cancelled = true;
    };
  }, [range, refreshKey, fetchStats]);

  const totals = stats?.totals ?? {
    productiveSeconds: 0,
    unproductiveSeconds: 0,
  };
  const totalSeconds = totals.productiveSeconds + totals.unproductiveSeconds;
  const productiveShare = totalSeconds
    ? Math.round((totals.productiveSeconds / totalSeconds) * 100)
    : 0;

  const byActivity = stats?.byActivity ?? [];
  const maxActivitySeconds = byActivity.reduce(
    (max, entry) => Math.max(max, entry.totalSeconds),
    0,
  );

  const weekDays = range === "week" ? (stats?.days ?? []) : [];
  const maxDaySeconds = weekDays.reduce(
    (max, day) =>
      Math.max(max, day.productiveSeconds + day.unproductiveSeconds),
    0,
  );

  return (
    <section className="mt-8 text-left">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <h3 className="text-lg p-2 font-bold">Stats</h3>
        <div className="flex gap-2">
          {RANGES.map((option) => (
            <button
              key={option.key}
              type="button"
              className={`cursor-pointer px-3 py-1.5 border rounded-lg ${
                option.key === range
                  ? "bg-accent-bg border-accent-border text-text-h font-semibold"
                  : "border-border bg-transparent text-text"
              }`}
              onClick={() => setRange(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <p>Loading stats...</p>}
      {error && <p>{error}</p>}

      {!loading && !error && stats && (
        <>
          <div className="flex gap-3 flex-wrap mb-4 mt-2">
            <div className="flex-1 min-w-[140px] flex flex-col gap-1 p-3 border border-border rounded-lg">
              <span className="text-[1.4rem] font-bold text-[green]">
                {formatDuration(totals.productiveSeconds)}
              </span>
              <span className="text-[0.85rem] text-text">Productive</span>
            </div>
            <div className="flex-1 min-w-[140px] flex flex-col gap-1 p-3 border border-border rounded-lg">
              <span className="text-[1.4rem] font-bold text-[crimson]">
                {formatDuration(totals.unproductiveSeconds)}
              </span>
              <span className="text-[0.85rem] text-text">Unproductive</span>
            </div>
            <div className="flex-1 min-w-[140px] flex flex-col gap-1 p-3 border border-border rounded-lg">
              <span className="text-[1.4rem] font-bold text-text-h">
                {formatDuration(totalSeconds)}
              </span>
              <span className="text-[0.85rem] text-text">Total tracked</span>
            </div>
          </div>

          {totalSeconds > 0 && (
            <div className="mb-4 mt-2">
              <div className="h-2.5 rounded-[5px] bg-[crimson] overflow-hidden mb-1.5">
                <div
                  className="h-full bg-[green]"
                  style={{ width: `${productiveShare}%` }}
                />
              </div>
              <p>{productiveShare}% productive</p>
            </div>
          )}

          {range === "week" && weekDays.length > 0 && (
            <div className="flex gap-3 items-end mb-4 mt-2">
              {weekDays.map((day) => {
                const dayTotal =
                  day.productiveSeconds + day.unproductiveSeconds;
                const productiveHeight = maxDaySeconds
                  ? (day.productiveSeconds / maxDaySeconds) * 100
                  : 0;
                const unproductiveHeight = maxDaySeconds
                  ? (day.unproductiveSeconds / maxDaySeconds) * 100
                  : 0;

                return (
                  <div
                    key={day.date}
                    className="flex-1 flex flex-col items-center gap-1.5"
                    title={`${day.date}: ${formatDuration(dayTotal)}`}
                  >
                    <div className="h-20 w-full max-w-10 flex flex-col-reverse rounded overflow-hidden bg-code-bg">
                      <div
                        className="bg-[crimson]"
                        style={{ height: `${unproductiveHeight}%` }}
                      />
                      <div
                        className="bg-[green]"
                        style={{ height: `${productiveHeight}%` }}
                      />
                    </div>
                    <span className="text-xs text-text">
                      {formatDayLabel(day.date)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div>
            <h4 className="mb-3 text-lg text-text-h">Activity breakdown</h4>

            {byActivity.length === 0 ? (
              <p>No tracked time in this range yet.</p>
            ) : (
              <ul className="list-none p-0 m-0 flex flex-col gap-2">
                {byActivity.map((entry) => (
                  <li
                    key={entry.activityId}
                    className="grid grid-cols-[minmax(120px,1fr)_2fr_minmax(64px,auto)] items-center gap-3"
                  >
                    <span className="font-semibold text-text-h">
                      {entry.name}
                    </span>
                    <div className="h-2.5 rounded-[5px] bg-code-bg overflow-hidden">
                      <div
                        className={`h-full ${
                          entry.type === "productive"
                            ? "bg-[green]"
                            : "bg-[crimson]"
                        }`}
                        style={{
                          width: maxActivitySeconds
                            ? `${(entry.totalSeconds / maxActivitySeconds) * 100}%`
                            : "0%",
                        }}
                      />
                    </div>
                    <span className="text-right text-text">
                      {formatDuration(entry.totalSeconds)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
}
