import type { CreationAttributes } from 'sequelize';
import type { Page, PageRequest } from '../../common/dto/pagination.dto';
import { Doctor } from './doctor.model';
import type { UpdateDoctorDto } from './doctor.dto';

export class DoctorRepository {
  create(data: CreationAttributes<Doctor>): Promise<Doctor> {
    return Doctor.create(data);
  }

  findAll(page: PageRequest): Promise<Page<Doctor>> {
    return Doctor.findAndCountAll({ order: [['id', 'ASC']], ...page });
  }

  findById(id: number): Promise<Doctor | null> {
    return Doctor.findByPk(id);
  }

  async updateById(id: number, data: UpdateDoctorDto): Promise<Doctor | null> {
    const [, rows] = await Doctor.update(data, { where: { id }, returning: true });
    return rows[0] ?? null;
  }

  async deleteById(id: number): Promise<boolean> {
    return (await Doctor.destroy({ where: { id } })) > 0;
  }
}
