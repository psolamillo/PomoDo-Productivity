import sequelize from "../util/database.js";
import Activity from "./activity.js";
import Session from "./session.js";

Activity.hasMany(Session, {
  foreignKey: "activityId",
  onDelete: "CASCADE",
});

Session.belongsTo(Activity, {
  foreignKey: "activityId",
});

const db = {
  sequelize,
  Activity,
  Session,
};

export default db;
