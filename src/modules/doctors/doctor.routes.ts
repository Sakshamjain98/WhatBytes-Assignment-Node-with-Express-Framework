import { Router } from 'express';
import { doctorController } from '../../container';
import { validateBody } from '../../common/middlewares/validate.middleware';
import { createDoctorDto, updateDoctorDto } from './doctor.dto';

export const doctorRouter = Router();
doctorRouter.post('/', validateBody(createDoctorDto), doctorController.create);
doctorRouter.get('/', doctorController.list);
doctorRouter.get('/:id', doctorController.get);
doctorRouter.put('/:id', validateBody(updateDoctorDto), doctorController.update);
doctorRouter.delete('/:id', doctorController.remove);
