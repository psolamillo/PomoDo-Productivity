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

  const totals = stats?.totals ?? { productiveSeconds: 0, unproductiveSeconds: 0 };
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
    <section className="stats-panel">
      <div className="stats-header">
        <h3>Stats</h3>
        <div className="stats-ranges">
          {RANGES.map((option) => (
            <button
              key={option.key}
              type="button"
              className={range === option.key ? "active" : ""}
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
          <div className="stats-cards">
            <div className="stat-card">
              <span className="stat-value productive">
                {formatDuration(totals.productiveSeconds)}
              </span>
              <span className="stat-label">Productive</span>
            </div>
            <div className="stat-card">
              <span className="stat-value unproductive">
                {formatDuration(totals.unproductiveSeconds)}
              </span>
              <span className="stat-label">Unproductive</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{formatDuration(totalSeconds)}</span>
              <span className="stat-label">Total tracked</span>
            </div>
          </div>

          {totalSeconds > 0 && (
            <div className="stats-share">
              <div className="stats-share-bar">
                <div
                  className="stats-share-productive"
                  style={{ width: `${productiveShare}%` }}
                />
              </div>
              <p>{productiveShare}% productive</p>
            </div>
          )}

          {range === "week" && weekDays.length > 0 && (
            <div className="stats-week">
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
                    className="stats-week-day"
                    title={`${day.date}: ${formatDuration(dayTotal)}`}
                  >
                    <div className="stats-week-bar">
                      <div
                        className="stats-week-segment unproductive"
                        style={{ height: `${unproductiveHeight}%` }}
                      />
                      <div
                        className="stats-week-segment productive"
                        style={{ height: `${productiveHeight}%` }}
                      />
                    </div>
                    <span className="stats-week-label">
                      {formatDayLabel(day.date)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="stats-activities">
            <h4>By activity</h4>

            {byActivity.length === 0 ? (
              <p>No tracked time in this range yet.</p>
            ) : (
              <ul className="stats-activity-list">
                {byActivity.map((entry) => (
                  <li key={entry.activityId} className="stats-activity-row">
                    <span className="stats-activity-name">{entry.name}</span>
                    <div className="stats-activity-track">
                      <div
                        className={`stats-activity-bar ${entry.type}`}
                        style={{
                          width: maxActivitySeconds
                            ? `${(entry.totalSeconds / maxActivitySeconds) * 100}%`
                            : "0%",
                        }}
                      />
                    </div>
                    <span className="stats-activity-time">
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
