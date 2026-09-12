import { useEffect, useState } from "react";

export default function CreateActivityForm() {
  const [formData, setFormData] = useState({
    activityName: "",
    activityType: "productive",
    activityOneOff: "true",
  });
  const [status, setStatus] = useState({ type: "", message: "" });

  useEffect(() => {
    if (!status.message) return;

    const timeoutId = setTimeout(() => {
      setStatus({ type: "", message: "" });
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [status]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    if (status.type) {
      setStatus({ type: "", message: "" });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch("http://localhost:3123/api/activities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.activityName.trim(),
          type: formData.activityType,
          oneOff: formData.activityOneOff === "true",
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Failed to create activity");
      }

      console.log("Activity created:", data);
      setStatus({ type: "success", message: "Activity created successfully." });
      setFormData({
        activityName: "",
        activityType: "productive",
        activityOneOff: "true",
      });
    } catch (error) {
      console.error("Error creating activity:", error.message);
      setStatus({
        type: "error",
        message: error.message || "Unable to create activity.",
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto my-6 w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h3 className="mb-4 text-xl font-semibold text-slate-800">
        Create Activity
      </h3>

      <div className="mb-5">
        <label
          htmlFor="activityName"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Activity Name
        </label>
        <input
          type="text"
          id="activityName"
          name="activityName"
          value={formData.activityName}
          onChange={handleChange}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 shadow-sm transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          placeholder="Enter new activity"
        />
      </div>

      <div className="mb-5">
        <h4 className="mb-2 text-sm font-medium text-slate-700">
          Choose Activity Type
        </h4>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name="activityType"
              value="productive"
              checked={formData.activityType === "productive"}
              onChange={handleChange}
            />
            Productive
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name="activityType"
              value="unproductive"
              checked={formData.activityType === "unproductive"}
              onChange={handleChange}
            />
            Unproductive
          </label>
        </div>
      </div>

      <div className="mb-5">
        <h4 className="mb-2 text-sm font-medium text-slate-700">
          One-off activity?
        </h4>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name="activityOneOff"
              value="true"
              checked={formData.activityOneOff === "true"}
              onChange={handleChange}
            />
            True
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name="activityOneOff"
              value="false"
              checked={formData.activityOneOff === "false"}
              onChange={handleChange}
            />
            False
          </label>
        </div>
      </div>

      {status.message && (
        <p
          className={`mb-4 text-sm font-semibold ${
            status.type === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {status.message}
        </p>
      )}

      <button
        type="submit"
        className="w-full rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
      >
        Create Activity
      </button>
    </form>
  );
}
