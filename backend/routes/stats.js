import express from "express";

const router = express.Router();

router.get("/day/:date", (req, res, next) => {
  res.json({ message: "GET /api/stats/day/:date stub" });
});

router.get("/week", (req, res, next) => {
  res.json({ message: "GET /api/stats/week stub" });
});

router.get("/lifetime", (req, res, next) => {
  res.json({ message: "GET /api/stats/lifetime stub" });
});

export default router;
