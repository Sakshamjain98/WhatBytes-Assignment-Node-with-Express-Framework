import { DataTypes, Model } from 'sequelize';
import type { CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import { sequelize } from '../../database/sequelize';

export class Doctor extends Model<InferAttributes<Doctor>, InferCreationAttributes<Doctor>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare specialization: string;
  declare email: CreationOptional<string | null>;
  declare phone: CreationOptional<string | null>;
  declare experienceYears: CreationOptional<number | null>;
  declare createdBy: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Doctor.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    specialization: { type: DataTypes.STRING(100), allowNull: false },
    email: DataTypes.STRING(255),
    phone: DataTypes.STRING(20),
    experienceYears: DataTypes.INTEGER,
    createdBy: { type: DataTypes.INTEGER, allowNull: false },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'doctors' },
);
