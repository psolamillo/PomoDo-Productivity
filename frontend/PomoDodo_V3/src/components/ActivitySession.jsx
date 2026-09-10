import { useCallback, useEffect, useState } from "react";

const API_BASE_URL = "http://localhost:3123";

function formatSessionTime(value) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function ActivitySession() {
  const [activities, setActivities] = useState([]);
  const [activeActivityId, setActiveActivityId] = useState(null);
  const [sessionIdsByActivity, setSessionIdsByActivity] = useState({});
  const [todaySessions, setTodaySessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isToggling, setIsToggling] = useState(false);

  const fetchTodaySessions = useCallback(async () => {
    const today = new Date().toISOString().slice(0, 10);

    const response = await fetch(`${API_BASE_URL}/api/sessions?date=${today}`);

    if (!response.ok) {
      throw new Error("Unable to load today's sessions");
    }

    const data = await response.json();
    const sortedSessions = [...data].sort(
      (a, b) => new Date(b.startedAt) - new Date(a.startedAt),
    );

    setTodaySessions(sortedSessions);
  }, []);

  useEffect(() => {
    async function fetchActivities() {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/activities`);

        if (!response.ok) {
          throw new Error("Unable to load activities");
        }

        const data = await response.json();
        setActivities(data);
      } catch (loadError) {
        setError(loadError.message || "Unable to load activities.");
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
    fetchTodaySessions().catch((loadError) => {
      setError(loadError.message || "Unable to load today's sessions.");
    });
  }, [fetchTodaySessions]);

  const handleToggleSession = async (activity) => {
    if (isToggling) {
      return;
    }

    const isActive = activeActivityId === activity.id;
    setIsToggling(true);
    setError("");

    try {
      if (!isActive) {
        const startedAt = new Date();
        const endedAt = new Date(startedAt.getTime() + 1000);

        const response = await fetch(`${API_BASE_URL}/api/sessions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            activityId: activity.id,
            startedAt: startedAt.toISOString(),
            endedAt: endedAt.toISOString(),
            date: startedAt.toISOString().slice(0, 10),
          }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || "Unable to start session");
        }

        setActiveActivityId(activity.id);
        setSessionIdsByActivity((previous) => ({
          ...previous,
          [activity.id]: data.id,
        }));
        await fetchTodaySessions();
        return;
      }

      const sessionId = sessionIdsByActivity[activity.id];

      if (!sessionId) {
        setActiveActivityId(null);
        return;
      }

      const stoppedAt = new Date();
      const response = await fetch(
        `${API_BASE_URL}/api/sessions/${sessionId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            endedAt: stoppedAt.toISOString(),
          }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to stop session");
      }

      setActiveActivityId(null);
      setSessionIdsByActivity((previous) => ({
        ...previous,
        [activity.id]: null,
      }));
      await fetchTodaySessions();
    } catch (toggleError) {
      setError(toggleError.message || "Unable to toggle activity session.");
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <section>
      <h3>Activities</h3>

      {loading && <p>Loading activities...</p>}
      {error && <p>{error}</p>}

      {!loading && activities.length === 0 && (
        <p>No activities available yet.</p>
      )}

      <div className="activity-buttons">
        {activities.map((activity) => {
          const isActive = activeActivityId === activity.id;

          return (
            <button
              key={activity.id}
              type="button"
              onClick={() => handleToggleSession(activity)}
              disabled={isToggling}
            >
              {isActive ? `Stop ${activity.name}` : `Start ${activity.name}`}
            </button>
          );
        })}
      </div>

      <div className="today-sessions">
        <h4>Today&apos;s sessions</h4>

        {todaySessions.length === 0 ? (
          <p>No sessions created for the day yet.</p>
        ) : (
          <ul className="session-list">
            {todaySessions.map((session) => (
              <li key={session.id} className="session-item">
                <span className="session-name">
                  {session.Activity?.name || "Activity"}
                </span>
                <span className="session-times">
                  {formatSessionTime(session.startedAt)} -{" "}
                  {formatSessionTime(session.endedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
