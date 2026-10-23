const { Sequelize, DataTypes } = require('sequelize');
const { databaseUrl } = require('./config');

const sequelize = new Sequelize(databaseUrl, {
  logging: false,
  define: { underscored: true },
  pool: { max: 10, idle: 10000 },
});

const User = sequelize.define('User', {
  name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
});
// Never leak the password hash in API responses.
User.prototype.toJSON = function toJSON() {
  const { password, ...rest } = this.get();
  return rest;
};

const Patient = sequelize.define('Patient', {
  name: { type: DataTypes.STRING(100), allowNull: false },
  age: { type: DataTypes.INTEGER, allowNull: false },
  gender: { type: DataTypes.ENUM('male', 'female', 'other'), allowNull: false },
  phone: DataTypes.STRING(20),
  address: DataTypes.STRING,
  medicalHistory: DataTypes.TEXT,
}, { indexes: [{ fields: ['created_by'] }] });

const Doctor = sequelize.define('Doctor', {
  name: { type: DataTypes.STRING(100), allowNull: false },
  specialization: { type: DataTypes.STRING(100), allowNull: false },
  email: DataTypes.STRING,
  phone: DataTypes.STRING(20),
  experienceYears: DataTypes.INTEGER,
});

const Mapping = sequelize.define('Mapping', {}, {
  tableName: 'patient_doctor_mappings',
  indexes: [{ unique: true, fields: ['patient_id', 'doctor_id'] }, { fields: ['doctor_id'] }],
});

const cascade = { onDelete: 'CASCADE' };
User.hasMany(Patient, { foreignKey: { name: 'createdBy', allowNull: false }, ...cascade });
Patient.belongsTo(User, { foreignKey: { name: 'createdBy', allowNull: false }, ...cascade });
User.hasMany(Doctor, { foreignKey: { name: 'createdBy', allowNull: false }, ...cascade });
Doctor.belongsTo(User, { foreignKey: { name: 'createdBy', allowNull: false }, ...cascade });
Patient.hasMany(Mapping, { foreignKey: { name: 'patientId', allowNull: false }, ...cascade });
Mapping.belongsTo(Patient, { foreignKey: { name: 'patientId', allowNull: false }, ...cascade });
Doctor.hasMany(Mapping, { foreignKey: { name: 'doctorId', allowNull: false }, ...cascade });
Mapping.belongsTo(Doctor, { foreignKey: { name: 'doctorId', allowNull: false }, ...cascade });

module.exports = { sequelize, User, Patient, Doctor, Mapping };
