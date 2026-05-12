import { Router, type IRouter } from "express";
import healthRouter from "./health";
import wardrobeRouter from "./wardrobe";
import conversationsRouter from "./openai/conversations";

const router: IRouter = Router();

router.use(healthRouter);
router.use(wardrobeRouter);
router.use("/openai", conversationsRouter);

export default router;
