import type { CreationAttributes } from 'sequelize';
import type { Page, PageRequest } from '../../common/dto/pagination.dto';
import { Patient } from './patient.model';
import type { UpdatePatientDto } from './patient.dto';

/** All queries are scoped to the owning user. */
export class PatientRepository {
  create(data: CreationAttributes<Patient>): Promise<Patient> {
    return Patient.create(data);
  }

  findAllByOwner(ownerId: number, page: PageRequest): Promise<Page<Patient>> {
    return Patient.findAndCountAll({ where: { createdBy: ownerId }, order: [['id', 'ASC']], ...page });
  }

  findByIdAndOwner(id: number, ownerId: number): Promise<Patient | null> {
    return Patient.findOne({ where: { id, createdBy: ownerId } });
  }

  async updateByIdAndOwner(id: number, ownerId: number, data: UpdatePatientDto): Promise<Patient | null> {
    const [, rows] = await Patient.update(data, { where: { id, createdBy: ownerId }, returning: true });
    return rows[0] ?? null;
  }

  async deleteByIdAndOwner(id: number, ownerId: number): Promise<boolean> {
    return (await Patient.destroy({ where: { id, createdBy: ownerId } })) > 0;
  }
}
