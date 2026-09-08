import express from "express";

const router = express.Router();

router.post("/", (req, res, next) => {
  res.json({ message: "POST /api/sessions stub" });
});

export default router;
