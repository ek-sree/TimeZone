const userModels = require("../server/model/userModels");

const iflogged = async (req, res, next) => {
  if (req.session.isAuth) {
    res.redirect("/");
  } else {
    next();
  }
};

const islogged = async (req, res, next) => {
  const user = await userModels.findOne({ _id: req.session.userId });
  if (req.session.isAuth && user && user.status == true) {
    req.user = req.session.user;
    next();
  } else {
    res.redirect("/login");
  }
};

const checkSessionVariable = (variableName, redirectPath) => {
  return (req, res, next) => {
    if (req.session[variableName]) {
      next();
    } else {
      res.redirect(redirectPath);
    }
  };
};

const loggedadmin = (req, res, next) => {
  if (req.session.admin) {
    next();
  } else {
    res.redirect("/admin");
  }
};

const logoutAdmin = (req, res, next) => {
  if (!req.session.admin) {
    next();
  } else {
    res.redirect("/admin/adminpanel");
  }
};

const logouting = (req, res, next) => {
  req.session.admin = false;
  req.session.destroy();
  res.redirect("/admin");
};

module.exports = {
  iflogged,
  islogged,
  checkSessionVariable,
  logouting,
  logoutAdmin,
  loggedadmin,
};
