import express from "express";
import cors from "cors";

import activityRouter from "./routes/activity.js";
import sessionRouter from "./routes/session.js";
import statsRouter from "./routes/stats.js";

const app = express();
const PORT = 3123;

app.use(cors());
app.use(express.json());

app.use("/api/activities", activityRouter);
app.use("/api/sessions", sessionRouter);
app.use("/api/stats", statsRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
