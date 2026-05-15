// File: backend/src/utils/catchAsync.js

const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = catchAsync;


//  Thay vì viết thế này:
// exports.register = async (req, res, next) => {
//   try {
//      const user = await authService.register(req.body);
//      res.status(201).json({ status: 'success' });
//   } catch (err) {
//      next(err);
//   }
// }

//  Bạn chỉ cần viết thế này nhờ catchAsync:
// exports.register = catchAsync(async (req, res, next) => {
//   const user = await authService.register(req.body);
//   res.status(201).json({ status: 'success' });
// });