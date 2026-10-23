import { DataTypes } from 'sequelize';
import type { Migration } from '../migrator';

const id = { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true };
const timestamps = {
  created_at: { type: DataTypes.DATE, allowNull: false },
  updated_at: { type: DataTypes.DATE, allowNull: false },
};
const fk = (table: string) => ({
  type: DataTypes.INTEGER,
  allowNull: false,
  references: { model: table, key: 'id' },
  onDelete: 'CASCADE',
});

export const up: Migration = async ({ context: qi }) => {
  await qi.sequelize.transaction(async (transaction) => {
    await qi.createTable(
      'users',
      {
        id,
        name: { type: DataTypes.STRING(100), allowNull: false },
        email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
        password: { type: DataTypes.STRING(255), allowNull: false },
        ...timestamps,
      },
      { transaction },
    );

    await qi.createTable(
      'patients',
      {
        id,
        name: { type: DataTypes.STRING(100), allowNull: false },
        age: { type: DataTypes.INTEGER, allowNull: false },
        gender: { type: DataTypes.ENUM('male', 'female', 'other'), allowNull: false },
        phone: DataTypes.STRING(20),
        address: DataTypes.STRING(255),
        medical_history: DataTypes.TEXT,
        created_by: fk('users'),
        ...timestamps,
      },
      { transaction },
    );
    await qi.addIndex('patients', ['created_by'], { transaction });

    await qi.createTable(
      'doctors',
      {
        id,
        name: { type: DataTypes.STRING(100), allowNull: false },
        specialization: { type: DataTypes.STRING(100), allowNull: false },
        email: DataTypes.STRING(255),
        phone: DataTypes.STRING(20),
        experience_years: DataTypes.INTEGER,
        created_by: fk('users'),
        ...timestamps,
      },
      { transaction },
    );
    await qi.addIndex('doctors', ['created_by'], { transaction });

    await qi.createTable(
      'patient_doctor_mappings',
      { id, patient_id: fk('patients'), doctor_id: fk('doctors'), ...timestamps },
      { transaction },
    );
    await qi.addIndex('patient_doctor_mappings', ['patient_id', 'doctor_id'], { unique: true, transaction });
    await qi.addIndex('patient_doctor_mappings', ['doctor_id'], { transaction });
  });
};

export const down: Migration = async ({ context: qi }) => {
  await qi.sequelize.transaction(async (transaction) => {
    for (const table of ['patient_doctor_mappings', 'doctors', 'patients', 'users']) {
      await qi.dropTable(table, { transaction });
    }
    await qi.sequelize.query('DROP TYPE IF EXISTS "enum_patients_gender"', { transaction });
  });
};
