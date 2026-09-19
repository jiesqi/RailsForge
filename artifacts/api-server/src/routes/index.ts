import { Router, type IRouter } from "express";
import healthRouter from "./health";
import railsforgeRouter from "./railsforge";

const router: IRouter = Router();

router.use(healthRouter);
router.use(railsforgeRouter);

export default router;
