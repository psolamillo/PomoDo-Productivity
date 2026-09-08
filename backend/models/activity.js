import { DataTypes } from "sequelize";
import sequelize from "../util/database.js";

const Activity = sequelize.define("Activity", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  name: DataTypes.STRING,
  type: DataTypes.ENUM("productive", "unproductive"),
  oneOff: DataTypes.BOOLEAN,
});

export default Activity;
