const jwt = require("jsonwebtoken");
const secrets = require("../secret/secrets");

module.exports = (req, res, next) => {
  const token = req.headers.authorization;

  if (token) {
    jwt.verify(token, secrets.jwtSecret, (err, decodedToken) => {
      if (err) {
        res.status(403).json("No Ryan Seacrest Here");
      } else {
        req.decodedJwt = decodedToken;
        console.log("decoded token", req.decodedJwt);
        next();
      }
    });
  } else {
    // no token
    res.status(401).json("None shall pass");
  }
};
