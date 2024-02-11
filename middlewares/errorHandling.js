const userPageNotFound = (req, res, next) => {
  res.render("user/404.ejs");
};

const userErrorHandler = (err, req, res, next) => {
  console.log(err);

  res.render("user/error.ejs");
};

const adminPageNotFound = (req, res, next) => {
  res.render("admin/404.ejs");
};

const adminErrorHandler = (err, req, res, next) => {
  console.log(err);

  res.render("admin/error.ejs");
};

module.exports = {
  userPageNotFound,
  userErrorHandler,
  adminErrorHandler,
  adminPageNotFound,
};
