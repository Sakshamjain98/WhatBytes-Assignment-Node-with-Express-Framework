import type { CreationAttributes } from 'sequelize';
import { User } from './user.model';

export class UserRepository {
  create(data: CreationAttributes<User>): Promise<User> {
    return User.create(data);
  }

  findById(id: number): Promise<User | null> {
    return User.findByPk(id);
  }

  findByEmail(email: string): Promise<User | null> {
    return User.findOne({ where: { email } });
  }
}
