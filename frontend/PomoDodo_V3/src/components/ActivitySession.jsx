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
    window.dispatchEvent(new Event("session-updated"));
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

  const handleDeleteActivity = async (activity) => {
    if (isToggling) {
      return;
    }

    setIsToggling(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/activities/${activity.id}`,
        { method: "DELETE" },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete activity");
      }

      setActivities((previous) =>
        previous.filter((item) => item.id !== activity.id),
      );

      if (activeActivityId === activity.id) {
        setActiveActivityId(null);
        setSessionIdsByActivity((previous) => ({
          ...previous,
          [activity.id]: null,
        }));
      }

      await fetchTodaySessions();
    } catch (deleteError) {
      setError(deleteError.message || "Unable to delete activity.");
    } finally {
      setIsToggling(false);
    }
  };

  const activeSessionId = activeActivityId
    ? sessionIdsByActivity[activeActivityId]
    : null;

  return (
    <section>
      <h3 className="text-lg p-2 font-bold">Activities</h3>

      {loading && <p>Loading activities...</p>}
      {error && <p>{error}</p>}

      {!loading && activities.length === 0 && (
        <p>No activities available yet.</p>
      )}

      <div className="flex flex-wrap gap-3 justify-center mt-5">
        {activities.map((activity) => {
          const isActive = activeActivityId === activity.id;
          const isProductive = activity.type === "productive";

          return (
            <div key={activity.id} className="relative m-2">
              <button
                type="button"
                onClick={() => handleToggleSession(activity)}
                disabled={isToggling}
                className={`p-4 rounded-2xl border text-white transition-colors ${
                  isActive
                    ? isProductive
                      ? "bg-green-400 hover:bg-green-300 border-green-200 ring-2 ring-green-200"
                      : "bg-red-400 hover:bg-red-300 border-red-200 ring-2 ring-red-200"
                    : isProductive
                      ? "bg-green-600 hover:bg-green-500 border-transparent"
                      : "bg-red-600 hover:bg-red-500 border-transparent"
                } ${isToggling ? "opacity-70" : "opacity-100"}`}
              >
                {isActive ? `Stop ${activity.name}` : `Start ${activity.name}`}
              </button>
              <button
                type="button"
                onClick={() => handleDeleteActivity(activity)}
                disabled={isToggling}
                aria-label={`Delete ${activity.name}`}
                className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-700 text-xs font-bold text-white transition-colors hover:bg-gray-500 disabled:opacity-70"
              >
                &times;
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-left">
        <h3 className="text-lg p-2 font-bold mt-2">Today&apos;s sessions</h3>

        {todaySessions.length === 0 ? (
          <p>No sessions created for the day yet.</p>
        ) : (
          <ul className="list-none p-0 m-0 mt-2 flex flex-col gap-2">
            {todaySessions.map((session) => {
              const isProductive = session.Activity?.type === "productive";
              const isRunning = session.id === activeSessionId;

              return (
                <li
                  key={session.id}
                  className={`flex justify-between gap-4 rounded-lg border px-3 py-2 transition-colors ${
                    isRunning
                      ? isProductive
                        ? "bg-green-400 border-green-200 ring-2 ring-green-200 text-white"
                        : "bg-red-400 border-red-200 ring-2 ring-red-200 text-white"
                      : isProductive
                        ? "bg-green-600 text-white"
                        : "bg-red-600 text-white"
                  }`}
                >
                  <span className="font-semibold text-text-h">
                    {session.Activity?.name || "Activity"}
                    {isRunning && (
                      <span className="ml-2 text-xs font-bold uppercase tracking-wide">
                        Running
                      </span>
                    )}
                  </span>
                  <span className="text-text">
                    {formatSessionTime(session.startedAt)} -{" "}
                    {isRunning ? "now" : formatSessionTime(session.endedAt)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
