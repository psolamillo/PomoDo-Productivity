import Activity from "../models/activity.js";

export async function getActivities(req, res, next) {
  try {
    const activities = await Activity.findAll({
      order: [["id", "ASC"]],
    });

    res.status(200).json(activities);
  } catch (error) {
    next(error);
  }
}

export async function getActivityById(req, res, next) {
  try {
    const { id } = req.params;
    const activity = await Activity.findByPk(id);

    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }

    return res.status(200).json(activity);
  } catch (error) {
    return next(error);
  }
}

export async function createActivity(req, res, next) {
  try {
    const { name, type, oneOff } = req.body;

    if (!name || !type) {
      return res.status(400).json({ message: "Name and type are required" });
    }

    const activity = await Activity.create({
      name,
      type,
      oneOff,
    });

    return res.status(201).json(activity);
  } catch (error) {
    return next(error);
  }
}

export async function updateActivity(req, res, next) {
  try {
    const { id } = req.params;
    const activity = await Activity.findByPk(id);

    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }

    const { name, type, oneOff } = req.body;

    if (name !== undefined) activity.name = name;
    if (type !== undefined) activity.type = type;
    if (oneOff !== undefined) activity.oneOff = oneOff;

    await activity.save();

    return res.status(200).json(activity);
  } catch (error) {
    return next(error);
  }
}

export async function deleteActivity(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await Activity.destroy({
      where: { id },
    });

    if (!deleted) {
      return res.status(404).json({ message: "Activity not found" });
    }

    return res.status(200).json({ message: "Activity deleted successfully" });
  } catch (error) {
    return next(error);
  }
}
