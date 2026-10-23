import type { CreationAttributes, IncludeOptions } from 'sequelize';
import type { Page, PageRequest } from '../../common/dto/pagination.dto';
import { Doctor } from '../doctors/doctor.model';
import { Patient } from '../patients/patient.model';
import { Mapping } from './mapping.model';

// Inner join on the owner's patients scopes every mapping query to the current user.
const ownedPatient = (ownerId: number): IncludeOptions => ({
  model: Patient,
  as: 'patient',
  where: { createdBy: ownerId },
  attributes: ['id', 'name'],
});
const doctor: IncludeOptions = { model: Doctor, as: 'doctor' };

export class MappingRepository {
  create(data: CreationAttributes<Mapping>): Promise<Mapping> {
    return Mapping.create(data);
  }

  async exists(patientId: number, doctorId: number): Promise<boolean> {
    return (await Mapping.count({ where: { patientId, doctorId } })) > 0;
  }

  findAllByOwner(ownerId: number, page: PageRequest): Promise<Page<Mapping>> {
    return Mapping.findAndCountAll({
      include: [ownedPatient(ownerId), doctor],
      order: [['id', 'ASC']],
      ...page,
    });
  }

  findAllByPatient(patientId: number): Promise<Mapping[]> {
    return Mapping.findAll({ where: { patientId }, include: [doctor], order: [['id', 'ASC']] });
  }

  findByIdAndOwner(id: number, ownerId: number): Promise<Mapping | null> {
    return Mapping.findOne({ where: { id }, include: [ownedPatient(ownerId)] });
  }

  async deleteById(id: number): Promise<boolean> {
    return (await Mapping.destroy({ where: { id } })) > 0;
  }
}
