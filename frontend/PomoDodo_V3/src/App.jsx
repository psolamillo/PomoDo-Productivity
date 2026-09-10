import "./App.css";
import ActivitySession from "./components/ActivitySession";
import CreateActivityForm from "./components/CreateActivityForm";

function App() {
  return (
    <>
      <h1>PomoDo-Productivity Tracker</h1>
      <CreateActivityForm />
      <ActivitySession />
    </>
  );
}

export default App;
