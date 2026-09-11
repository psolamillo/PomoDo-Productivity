import "./App.css";
import ActivitySession from "./components/ActivitySession";
import CreateActivityForm from "./components/CreateActivityForm";
import StatsPanel from "./components/StatsPanel";

function App() {
  return (
    <>
      <h1>PomoDo-Productivity Tracker</h1>
      <CreateActivityForm />
      <ActivitySession />
      <StatsPanel />
    </>
  );
}

export default App;
