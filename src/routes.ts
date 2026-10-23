import { Router } from 'express';
import { authenticate } from './common/middlewares/authenticate.middleware';
import { tokenService } from './container';
import { authRouter } from './modules/auth/auth.routes';
import { doctorRouter } from './modules/doctors/doctor.routes';
import { mappingRouter } from './modules/mappings/mapping.routes';
import { patientRouter } from './modules/patients/patient.routes';

const requireAuth = authenticate(tokenService);

export const apiRouter = Router();
apiRouter.use('/auth', authRouter);
apiRouter.use('/patients', requireAuth, patientRouter);
apiRouter.use('/doctors', requireAuth, doctorRouter);
apiRouter.use('/mappings', requireAuth, mappingRouter);
