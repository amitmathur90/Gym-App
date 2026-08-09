import express from "express";
import "express-async-errors";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "@/config/env";
import { errorHandler } from "@/middleware/errorHandler";
import { authRouter } from "@/modules/auth/auth.routes";
import { usersRouter } from "@/modules/users/users.routes";
import { membershipRouter } from "@/modules/membership/membership.routes";
import { paymentsRouter } from "@/modules/payments/payments.routes";
import { workoutsRouter } from "@/modules/workouts/workouts.routes";
import { classesRouter } from "@/modules/classes/classes.routes";
import { trainersRouter } from "@/modules/trainers/trainers.routes";
import { nutritionRouter } from "@/modules/nutrition/nutrition.routes";
import { adminRouter } from "@/modules/admin/admin.routes";
import { adminTrainersRouter } from "@/modules/admin/admin.trainers.routes";
import { trainerRouter } from "@/modules/trainer/trainer.routes";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/membership", membershipRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/workouts", workoutsRouter);
app.use("/api/classes", classesRouter);
app.use("/api/trainers", trainersRouter);
app.use("/api/nutrition", nutritionRouter);
app.use("/api/admin/trainers", adminTrainersRouter);
app.use("/api/admin", adminRouter);
app.use("/api/trainer", trainerRouter);

app.use((_req, res) => res.status(404).json({ error: "Not found" }));
app.use(errorHandler);
