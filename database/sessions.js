const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const bcrypt = require("bcryptjs"); //this is all you need to do, the library is called inside the code - no server.use here
const session = require("express-session");

const db = require("./database/dbConfig.js");
const Users = require("./users/users-model.js");

const server = express();

const sessionConfig = {
  name: "monkey",
  secret: "keep it secret, keep it safe!",
  cookie: {
    maxAge: 1000 * 60 * 30, // in ms
    secure: false // am I using this over https only?
  },
  httpOnly: true,
  // can the user access the cookie from js using document.cookie? true === user cannot
  resave: false,
  saveUninitialized: false // laws agaisnt setting cookies automatically
};

server.use(helmet());
server.use(express.json());
server.use(cors());
server.use(session(sessionConfig));

//sanity check
server.get("/", (req, res) => {
  res.send("It's alive!");
});

server.post("/api/register", (req, res) => {
  let user = req.body;
  // generate hash from user's password synchronously
  //That is how we add time to slow down attackers trying to pre-generate hashes. The number represents how many rounds generate the password
  const hash = bcrypt.hashSync(user.password, 12);
  // override user.password with hash
  user.password = hash;
  //note that the hashes are different, even for the same password. The library takes care of that by adding a random string to the password before hashing. That random string is often called a `salt`. password could be one character and still output a 128 char string

  Users.add(user)
    .then(saved => {
      res.status(201).json(saved);
    })
    .catch(error => {
      res.status(500).json(error);
    });
});

//the library will first hash the password guess and then compare the newly generated hash against the hash stored for the user in the database. It's magic!

server.post("/api/login", (req, res) => {
  let { username, password } = req.body;

  Users.findBy({ username })
    .first()
    .then(user => {
      // check that passwords match - Josh found that compareSync returns a boolean
      if (user && bcrypt.compareSync(password, user.password)) {
        req.session.user = user;
        res
          .status(200)
          .json({ message: `Welcome ${user.username}! Haz a cookie...` });
      } else {
        // Keep it vague here... don't tell hackers if they got the username or password correct
        res.status(401).json({ message: "Invalid Credentials" });
      }
    })
    .catch(error => {
      res.status(500).json(error);
    });
});

//Middleware can be set to do the heavy lifting for us - stay tuned for adding tokens!
function restricted(req, res, next) {
  if (req.session && req.session.user) {
    next();
  } else {
    res.status(401).json({ messages: "You shall not pass!" });
  }
}
// axios.get('/api/users', { headers: { username: 'frodo', password: 'pass' }})

//protect this route, only authenticated users should see it
server.get("/api/users", restricted, (req, res) => {
  Users.find()
    .then(users => {
      res.json(users);
    })
    .catch(err => res.send(err));
});

//logout
server.get("/api/logout", (req, res) => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        res.send(
          "you can check out any time you like. but you can never leave..."
        );
      } else {
        res.send("goodbye");
      }
    });
  } else {
    res.end();
  }
});

//GET with Async/Await and Middleware - the bonus of this vs Matt's solution is that I can restrict more than one path without redundant code

// server.get('/users',restricted, async(req, res) => {
//   try {
//     const users = await users.find()
//     res.json(users)
//   } catch (error) {
//     res.send(error)
//   }
// })

//Matt's solution w/o middleware - Super easy if you are only restricting one path with everything hidden behind it
// server.get('/api/users', async (req, res) => {
//   let { username, password } = req.body
//   try {
//        const user = await Users.findBy({ username }).first()
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
