import { Router, type IRouter } from "express";
import healthRouter from "./health";
import wardrobeRouter from "./wardrobe";
import conversationsRouter from "./openai/conversations";
import { generalLimiter, aiLimiter } from "../middlewares/rateLimiter";

const router: IRouter = Router();

router.use(generalLimiter);

router.use(healthRouter);
router.use("/wardrobe/analyze", aiLimiter);
router.use("/wardrobe/outfits", aiLimiter);
router.use("/wardrobe/capsule", aiLimiter);
router.use("/openai", aiLimiter);
router.use(wardrobeRouter);
router.use("/openai", conversationsRouter);

export default router;
