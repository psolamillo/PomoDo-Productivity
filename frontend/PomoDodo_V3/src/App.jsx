import ActivitySession from "./components/ActivitySession";
import CreateActivityForm from "./components/CreateActivityForm";
import StatsPanel from "./components/StatsPanel";
import { useState } from "react";

function App() {
  const [activityFormVisible, setActivityFormVisible] = useState(false);

  function handleFormVisClick() {
    setActivityFormVisible((prev) => !prev);
  }

  return (
    <div className="bg-gray-300">
      <div className="text-2xl p-6 font-bold">PomoDo-Productivity Tracker</div>
      <button
        type="button"
        className="bg-gray-700 text-white px-4 py-2 rounded m-2"
        onClick={handleFormVisClick}
      >
        {activityFormVisible
          ? "Hide create activity form"
          : "Show create activity form"}
      </button>
      {activityFormVisible && <CreateActivityForm />}
      <ActivitySession />
      <StatsPanel />
    </div>
  );
}

export default App;
