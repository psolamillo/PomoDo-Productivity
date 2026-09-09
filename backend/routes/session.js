import express from "express";
import {
  createSession,
  deleteSession,
  getSessionById,
  getSessions,
  updateSession,
} from "../controllers/sessionController.js";

const router = express.Router();

router.get("/", getSessions);
router.get("/:id", getSessionById);
router.post("/", createSession);
router.patch("/:id", updateSession);
router.delete("/:id", deleteSession);

export default router;
