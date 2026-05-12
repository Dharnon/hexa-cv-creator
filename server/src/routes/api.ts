import { Router } from 'express';
import { getEmployees, getMaestroServicios, getUserProjectReport } from '../controllers/maringoController';

const router = Router();

router.get('/maringo/employees', getEmployees);
router.get('/maringo/user-project-report', getUserProjectReport);
router.get('/maringo/maestro-servicios', getMaestroServicios);

export default router;
