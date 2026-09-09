import { Op } from "sequelize";
import db from "../models/index.js";

const { Activity, Session } = db;

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function isValidDateOnly(value) {
  return typeof value === "string" && DATE_ONLY_PATTERN.test(value);
}

function parseActivityId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function getSessions(req, res, next) {
  try {
    const { activityId, date, from, to } = req.query;
    const where = {};

    if (activityId !== undefined) {
      const parsedActivityId = parseActivityId(activityId);
      if (!parsedActivityId) {
        return res.status(400).json({ message: "Invalid activityId" });
      }
      where.activityId = parsedActivityId;
    }

    if (date !== undefined) {
      if (!isValidDateOnly(date)) {
        return res.status(400).json({ message: "Invalid date" });
      }
      where.date = date;
    } else if (from !== undefined || to !== undefined) {
      where.date = {};

      if (from !== undefined) {
        if (!isValidDateOnly(from)) {
          return res.status(400).json({ message: "Invalid from date" });
        }
        where.date[Op.gte] = from;
      }

      if (to !== undefined) {
        if (!isValidDateOnly(to)) {
          return res.status(400).json({ message: "Invalid to date" });
        }
        where.date[Op.lte] = to;
      }
    }

    const sessions = await Session.findAll({
      where,
      include: [{ model: Activity }],
      order: [["startedAt", "DESC"]],
    });

    return res.status(200).json(sessions);
  } catch (error) {
    return next(error);
  }
}

export async function getSessionById(req, res, next) {
  try {
    const { id } = req.params;
    const session = await Session.findByPk(id, {
      include: [{ model: Activity }],
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    return res.status(200).json(session);
  } catch (error) {
    return next(error);
  }
}

export async function createSession(req, res, next) {
  try {
    const { activityId, startedAt, endedAt, date } = req.body;

    const parsedActivityId = parseActivityId(activityId);
    const start = parseDate(startedAt);
    const end = parseDate(endedAt);

    if (!parsedActivityId || !start || !end) {
      return res.status(400).json({
        message: "activityId, startedAt, and endedAt are required",
      });
    }

    if (end <= start) {
      return res.status(400).json({ message: "endedAt must be after startedAt" });
    }

    const activity = await Activity.findByPk(parsedActivityId);

    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }

    const sessionDate = date ?? toDateOnly(start);

    if (!isValidDateOnly(sessionDate)) {
      return res.status(400).json({ message: "date must be YYYY-MM-DD" });
    }

    const session = await Session.create({
      activityId: parsedActivityId,
      startedAt: start,
      endedAt: end,
      date: sessionDate,
    });

    const createdSession = await Session.findByPk(session.id, {
      include: [{ model: Activity }],
    });

    return res.status(201).json(createdSession);
  } catch (error) {
    return next(error);
  }
}

export async function updateSession(req, res, next) {
  try {
    const { id } = req.params;
    const session = await Session.findByPk(id);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const { activityId, startedAt, endedAt, date } = req.body;

    if (activityId !== undefined) {
      const parsedActivityId = parseActivityId(activityId);

      if (!parsedActivityId) {
        return res.status(400).json({ message: "Invalid activityId" });
      }

      const activity = await Activity.findByPk(parsedActivityId);

      if (!activity) {
        return res.status(404).json({ message: "Activity not found" });
      }

      session.activityId = parsedActivityId;
    }

    const nextStartedAt = startedAt === undefined ? session.startedAt : parseDate(startedAt);
    const nextEndedAt = endedAt === undefined ? session.endedAt : parseDate(endedAt);

    if (!nextStartedAt || !nextEndedAt) {
      return res.status(400).json({ message: "Invalid startedAt or endedAt" });
    }

    if (nextEndedAt <= nextStartedAt) {
      return res.status(400).json({ message: "endedAt must be after startedAt" });
    }

    session.startedAt = nextStartedAt;
    session.endedAt = nextEndedAt;

    if (date !== undefined) {
      if (!isValidDateOnly(date)) {
        return res.status(400).json({ message: "date must be YYYY-MM-DD" });
      }

      session.date = date;
    } else if (startedAt !== undefined) {
      session.date = toDateOnly(nextStartedAt);
    }

    await session.save();

    const updatedSession = await Session.findByPk(session.id, {
      include: [{ model: Activity }],
    });

    return res.status(200).json(updatedSession);
  } catch (error) {
    return next(error);
  }
}

export async function deleteSession(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await Session.destroy({
      where: { id },
    });

    if (!deleted) {
      return res.status(404).json({ message: "Session not found" });
    }

    return res.status(200).json({ message: "Session deleted successfully" });
  } catch (error) {
    return next(error);
  }
}
