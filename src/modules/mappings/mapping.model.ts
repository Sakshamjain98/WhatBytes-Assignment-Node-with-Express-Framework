import { DataTypes, Model } from 'sequelize';
import type { CreationOptional, InferAttributes, InferCreationAttributes, NonAttribute } from 'sequelize';
import { sequelize } from '../../database/sequelize';
import { Doctor } from '../doctors/doctor.model';
import { Patient } from '../patients/patient.model';

export class Mapping extends Model<InferAttributes<Mapping>, InferCreationAttributes<Mapping>> {
  declare id: CreationOptional<number>;
  declare patientId: number;
  declare doctorId: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare patient?: NonAttribute<Patient>;
  declare doctor?: NonAttribute<Doctor>;
}

Mapping.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    patientId: { type: DataTypes.INTEGER, allowNull: false },
    doctorId: { type: DataTypes.INTEGER, allowNull: false },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'patient_doctor_mappings' },
);

Mapping.belongsTo(Patient, { as: 'patient', foreignKey: 'patientId' });
Mapping.belongsTo(Doctor, { as: 'doctor', foreignKey: 'doctorId' });
