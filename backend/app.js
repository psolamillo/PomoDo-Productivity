import express from "express";
import cors from "cors";

import activityRouter from "./routes/activity.js";
import sessionRouter from "./routes/session.js";
import statsRouter from "./routes/stats.js";
import sequelize from "./util/database.js";

import db from "./models/index.js";

const app = express();
const PORT = 3123;

app.use(cors());
app.use(express.json());

app.use("/api/activities", activityRouter);
app.use("/api/sessions", sessionRouter);
app.use("/api/stats", statsRouter);

sequelize
  .sync()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.log(`Error ${err}`);
  });
