import { Op } from "sequelize";
import db from "../models/index.js";

const { Activity, Session } = db;

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateOnly(value) {
  return typeof value === "string" && DATE_ONLY_PATTERN.test(value);
}

function toDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateOnly(date);
}

function getWeekStart(dateString) {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  const weekdayIndex = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - weekdayIndex);
  return toDateOnly(date);
}

function createTotals() {
  return {
    productiveSeconds: 0,
    unproductiveSeconds: 0,
  };
}

function calculateDurationSeconds(session) {
  const start = new Date(session.startedAt);
  const end = new Date(session.endedAt);
  return Math.max(0, Math.round((end - start) / 1000));
}

function addSessionToTotals(totals, session) {
  const seconds = calculateDurationSeconds(session);
  const type = session.Activity?.type;

  if (type === "productive") {
    totals.productiveSeconds += seconds;
  } else if (type === "unproductive") {
    totals.unproductiveSeconds += seconds;
  }
}

function buildTotals(sessions) {
  const totals = createTotals();

  for (const session of sessions) {
    addSessionToTotals(totals, session);
  }

  return totals;
}

function buildByActivity(sessions) {
  const activityTotals = new Map();

  for (const session of sessions) {
    const activity = session.Activity;

    if (!activity) {
      continue;
    }

    const current = activityTotals.get(activity.id) ?? {
      activityId: activity.id,
      name: activity.name,
      type: activity.type,
      totalSeconds: 0,
    };

    current.totalSeconds += calculateDurationSeconds(session);
    activityTotals.set(activity.id, current);
  }

  return [...activityTotals.values()].sort(
    (a, b) => b.totalSeconds - a.totalSeconds,
  );
}

function buildByDay(sessions) {
  const dayTotals = new Map();

  for (const session of sessions) {
    const current = dayTotals.get(session.date) ?? {
      date: session.date,
      ...createTotals(),
    };

    addSessionToTotals(current, session);
    dayTotals.set(session.date, current);
  }

  return [...dayTotals.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export async function getDayStats(req, res, next) {
  try {
    const { date } = req.params;

    if (!isValidDateOnly(date)) {
      return res.status(400).json({ message: "date must be YYYY-MM-DD" });
    }

    const sessions = await Session.findAll({
      where: { date },
      include: [{ model: Activity }],
      order: [["startedAt", "ASC"]],
    });

    return res.status(200).json({
      date,
      totals: buildTotals(sessions),
      byActivity: buildByActivity(sessions),
      sessions,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getWeekStats(req, res, next) {
  try {
    const requestedStart = req.query.start;

    if (requestedStart !== undefined && !isValidDateOnly(requestedStart)) {
      return res.status(400).json({ message: "start must be YYYY-MM-DD" });
    }

    const start = getWeekStart(requestedStart ?? toDateOnly(new Date()));
    const end = addDays(start, 6);

    const sessions = await Session.findAll({
      where: {
        date: {
          [Op.gte]: start,
          [Op.lte]: end,
        },
      },
      include: [{ model: Activity }],
      order: [["startedAt", "ASC"]],
    });

    const days = Array.from({ length: 7 }, (_, index) => ({
      date: addDays(start, index),
      ...createTotals(),
    }));

    const daysByDate = new Map(days.map((day) => [day.date, day]));

    for (const session of sessions) {
      const day = daysByDate.get(session.date);

      if (day) {
        addSessionToTotals(day, session);
      }
    }

    return res.status(200).json({
      start,
      end,
      totals: buildTotals(sessions),
      days,
      byActivity: buildByActivity(sessions),
    });
  } catch (error) {
    return next(error);
  }
}

export async function getLifetimeStats(req, res, next) {
  try {
    const { start, end } = req.query;

    if (start !== undefined && !isValidDateOnly(start)) {
      return res.status(400).json({ message: "start must be YYYY-MM-DD" });
    }

    if (end !== undefined && !isValidDateOnly(end)) {
      return res.status(400).json({ message: "end must be YYYY-MM-DD" });
    }

    if (start && end && start > end) {
      return res.status(400).json({ message: "start must be before end" });
    }

    const where = {};

    if (start !== undefined || end !== undefined) {
      where.date = {};

      if (start !== undefined) {
        where.date[Op.gte] = start;
      }

      if (end !== undefined) {
        where.date[Op.lte] = end;
      }
    }

    const sessions = await Session.findAll({
      where,
      include: [{ model: Activity }],
      order: [
        ["date", "ASC"],
        ["startedAt", "ASC"],
      ],
    });

    return res.status(200).json({
      start: start ?? null,
      end: end ?? null,
      totals: buildTotals(sessions),
      byDay: buildByDay(sessions),
      byActivity: buildByActivity(sessions),
    });
  } catch (error) {
    return next(error);
  }
}
