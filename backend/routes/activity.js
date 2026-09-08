import express from "express";

const router = express.Router();

router.get("/", (req, res, next) => {
  res.json({ message: "GET /api/activities stub" });
});

router.post("/", (req, res, next) => {
  res.json({ message: "POST /api/activities stub" });
});

router.patch("/:id", (req, res, next) => {
  res.json({ message: "PATCH /api/activities/:id stub" });
});

router.delete("/:id", (req, res, next) => {
  res.json({ message: "DELETE /api/activities/:id stub" });
});

export default router;
