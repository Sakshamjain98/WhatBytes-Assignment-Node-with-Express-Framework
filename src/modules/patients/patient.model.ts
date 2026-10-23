import { DataTypes, Model } from 'sequelize';
import type { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import { sequelize } from '../../database/sequelize';
import { GENDERS } from './patient.constants';
import type { Gender } from './patient.constants';

export class Patient extends Model<InferAttributes<Patient>, InferCreationAttributes<Patient>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare age: number;
  declare gender: Gender;
  declare phone: CreationOptional<string | null>;
  declare address: CreationOptional<string | null>;
  declare medicalHistory: CreationOptional<string | null>;
  declare createdBy: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Patient.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    age: { type: DataTypes.INTEGER, allowNull: false },
    gender: { type: DataTypes.ENUM(...GENDERS), allowNull: false },
    phone: DataTypes.STRING(20),
    address: DataTypes.STRING(255),
    medicalHistory: DataTypes.TEXT,
    createdBy: { type: DataTypes.INTEGER, allowNull: false },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'patients' },
);
