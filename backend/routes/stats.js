import express from "express";
import {
  getDayStats,
  getLifetimeStats,
  getWeekStats,
} from "../controllers/statsController.js";

const router = express.Router();

router.get("/day/:date", getDayStats);
router.get("/week", getWeekStats);
router.get("/lifetime", getLifetimeStats);

export default router;
