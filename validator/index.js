exports.useSignupValidator = (req, res, next) => {
  req.check("name", "Name is required").notEmpty();
  req
    .check("email", "Email must be between 3 to 32 characters")
    .matches(/.+\@.+\..+/)
    .withMessage("Email must be contain @")
    .isLength({
      max: 32,
      min: 4,
    });
  req.check("password", "Password is required").notEmpty();
  req
    .check("password")
    .isLength({
      min: 6,
    })
    .withMessage("Password must be at least 6 characters")
    .matches(/\d/)
    .withMessage("Password must contain a number");

  const errors = req.validationErrors();
  if (errors) {
    const firstErrors = errors.map((error) => error.msg)[0];
    return res.status(400).json({
      error: firstErrors,
    });
  }

  next();
};
