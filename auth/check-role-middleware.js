module.exports = role => {
  return function(req, res, next) {
    if (req.decodedJwt.role && req.decodedJwt.role.includes(role)) {
      next();
    } else {
      return res.status(403).json("You don't belong here!");
    }
  };
};
