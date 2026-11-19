const errorHandler = (err, req, res, next) => {
  console.error(err.stack || err.message);

  const status = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(status).json({
    message: err.message || "Server error",
  });
};

export default errorHandler;
