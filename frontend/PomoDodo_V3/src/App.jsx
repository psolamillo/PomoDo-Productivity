import { useState } from "react";
import "./App.css";
import CreateActivityForm from "./components/CreateActivityForm";

function App() {
  return (
    <>
      <h1>PomoDo-Productivity Tracker</h1>
      <CreateActivityForm />
    </>
  );
}

export default App;
