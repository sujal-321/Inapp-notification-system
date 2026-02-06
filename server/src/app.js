import cors from "cors";
import express from "express";
import adminRoutes from "./routes/admin.js";
import userRoutes from "./routes/user.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/admin", adminRoutes);
app.use("/user", userRoutes);

export default app;
