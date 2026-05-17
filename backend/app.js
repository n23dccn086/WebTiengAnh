const express = require("express");
const cors = require("cors");
const errorMiddleware = require("./src/middlewares/error.middleware");
const AppError = require("./src/utils/appError");

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://frontend-production-6c8e.up.railway.app",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.options("*", cors());
app.use(express.json());

const routesV1 = require("./src/routes/v1/index");
app.use("/api/v1", routesV1);

app.use((req, res, next) => {
  next(
    new AppError(
      404,
      `Không tìm thấy API: ${req.originalUrl}`,
      "ROUTE_NOT_FOUND",
    ),
  );
});

app.use(errorMiddleware);

module.exports = app;
