const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const db = require("./database/dbConfig.js");
const Users = require("./users/users-model.js");

const server = express();

server.use(helmet());
server.use(express.json());
server.use(cors());

server.get("/", (req, res) => {
  res.send("It's alive!");
});

server.post("/api/register", (req, res) => {
  let user = req.body;

  const hash = bcrypt.hashSync(user.password, 12);

  user.password = hash;

  Users.add(user)
    .then(saved => {
      res.status(201).json(saved);
    })
    .catch(error => {
      res.status(500).json(error);
    });
});

server.post("/api/login", (req, res) => {
  let { username, password } = req.body;

  Users.findBy({ username })
    .first()
    .then(user => {
      if (user && bcrypt.compareSync(password, user.password)) {
        res.status(200).json({ message: `Welcome ${user.username}!` });
      } else {
        res.status(401).json({ message: "Invalid Credentials" });
      }
    })
    .catch(error => {
      res.status(500).json(error);
    });
});

// protect this route so that only authenticated users can see it
function restricted(req, res, next) {
  const { username, password } = req.headers;

  if (username && password) {
    users
      .findBy(username)
      .first()
      .then(user => {
        if (user && bcrypt.compareSync(password, user.password)) {
          next();
        } else {
          res.status(401).json({ message: "Invalid Credentials" });
        }
      })
      .catch(error => {
        res.status(500).json(error);
      });
  } else {
    res.status(400).json({ message: "no credentials provided" });
  }
}

server.post("/api/users", restricted, (req, res) => {
  Users.find()
    .then(users => {
      if (user && bcrypt.compareSync(password, user.password) === true) {
        res.json(users);
      } else {
        res.status(401).json({ message: "Invalid Credentials" });
      }
    })
    .catch(err => res.send(err));
});

// Matt's Solution
// server.get('/api/users', async (req, res) => {
//   let { username, password } = req.body
//   try {
//     const user = await Users.findBy({ username }).first()
//       if (user && bcrypt.compareSync(password, user.password)) {
//         const users = await Users.find()
//         res.json(users)
//       } else {
//         res.status(401).json({ message: "invalid credentials" })
//       }
//   } catch(error) {
//     console.log(error)
//     res.status(500).json(error)
//   }
// });

const port = process.env.PORT || 5000;
server.listen(port, () => console.log(`\n** Running on port ${port} **\n`));
