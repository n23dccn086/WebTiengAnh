const express = require('express');
const cors = require('cors');
const errorMiddleware = require('./src/middlewares/error.middleware');
const AppError = require('./src/utils/appError');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

const routesV1 = require('./src/routes/v1/index');
app.use('/api/v1', routesV1);

app.use((req, res, next) => {
  next(new AppError(404, `Không tìm thấy API: ${req.originalUrl}`, "ROUTE_NOT_FOUND"));
});

app.use(errorMiddleware);

module.exports = app;