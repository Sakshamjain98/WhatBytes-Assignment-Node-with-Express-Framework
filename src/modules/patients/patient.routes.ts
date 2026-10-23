import { Router } from 'express';
import { patientController } from '../../container';
import { validateBody } from '../../common/middlewares/validate.middleware';
import { createPatientDto, updatePatientDto } from './patient.dto';

export const patientRouter = Router();
patientRouter.post('/', validateBody(createPatientDto), patientController.create);
patientRouter.get('/', patientController.list);
patientRouter.get('/:id', patientController.get);
patientRouter.put('/:id', validateBody(updatePatientDto), patientController.update);
patientRouter.delete('/:id', patientController.remove);
