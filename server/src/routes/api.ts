import { Router } from 'express';
import { getEmployees, getUserProjectReport } from '../controllers/maringoController';

const router = Router();

router.get('/maringo/employees', getEmployees);
router.get('/maringo/user-project-report', getUserProjectReport);

export default router;
