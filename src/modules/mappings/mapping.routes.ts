import { Router } from 'express';
import { mappingController } from '../../container';
import { validateBody } from '../../common/middlewares/validate.middleware';
import { createMappingDto } from './mapping.dto';

export const mappingRouter = Router();
mappingRouter.post('/', validateBody(createMappingDto), mappingController.assign);
mappingRouter.get('/', mappingController.list);
// Per the spec, GET takes a patient id while DELETE takes a mapping id.
mappingRouter.get('/:patientId', mappingController.doctorsForPatient);
mappingRouter.delete('/:id', mappingController.remove);
