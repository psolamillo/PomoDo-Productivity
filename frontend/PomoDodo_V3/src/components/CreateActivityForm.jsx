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
    <form onSubmit={handleSubmit}>
      <div>
        <h3>Create Activity</h3>
        <label htmlFor="activityName">Activity Name</label>
        <input
          type="text"
          id="activityName"
          name="activityName"
          value={formData.activityName}
          onChange={handleChange}
        />
      </div>

      <div>
        <h3>Choose Activity Type</h3>
        <input
          type="radio"
          id="productive"
          name="activityType"
          value="productive"
          checked={formData.activityType === "productive"}
          onChange={handleChange}
        />
        <label htmlFor="productive">Productive</label>

        <input
          type="radio"
          id="unproductive"
          name="activityType"
          value="unproductive"
          checked={formData.activityType === "unproductive"}
          onChange={handleChange}
        />
        <label htmlFor="unproductive">Unproductive</label>
      </div>

      <div>
        <h3>Is Activity a one off (not recurring)</h3>
        <input
          type="radio"
          id="oneOffTrue"
          name="activityOneOff"
          value="true"
          checked={formData.activityOneOff === "true"}
          onChange={handleChange}
        />
        <label htmlFor="oneOffTrue">True</label>

        <input
          type="radio"
          id="oneOffFalse"
          name="activityOneOff"
          value="false"
          checked={formData.activityOneOff === "false"}
          onChange={handleChange}
        />
        <label htmlFor="oneOffFalse">False</label>
      </div>

      {status.message && (
        <p
          style={{
            marginTop: "12px",
            color: status.type === "success" ? "green" : "crimson",
            fontWeight: "600",
          }}
        >
          {status.message}
        </p>
      )}

      <button type="submit">Create Activity</button>
    </form>
  );
}
