// Composition root: the only place where concrete repositories, services and controllers are wired together.
import { env } from './config/env';
import { AuthController } from './modules/auth/auth.controller';
import { AuthService } from './modules/auth/auth.service';
import { TokenService } from './modules/auth/token.service';
import { DoctorController } from './modules/doctors/doctor.controller';
import { DoctorRepository } from './modules/doctors/doctor.repository';
import { DoctorService } from './modules/doctors/doctor.service';
import { MappingController } from './modules/mappings/mapping.controller';
import { MappingRepository } from './modules/mappings/mapping.repository';
import { MappingService } from './modules/mappings/mapping.service';
import { PatientController } from './modules/patients/patient.controller';
import { PatientRepository } from './modules/patients/patient.repository';
import { PatientService } from './modules/patients/patient.service';
import { UserRepository } from './modules/users/user.repository';

const userRepository = new UserRepository();
const patientRepository = new PatientRepository();
const doctorRepository = new DoctorRepository();
const mappingRepository = new MappingRepository();

export const tokenService = new TokenService(env);

export const authController = new AuthController(
  new AuthService(userRepository, tokenService, env.BCRYPT_SALT_ROUNDS),
);
export const patientController = new PatientController(new PatientService(patientRepository));
export const doctorController = new DoctorController(new DoctorService(doctorRepository));
export const mappingController = new MappingController(
  new MappingService(mappingRepository, patientRepository, doctorRepository),
);
