require("dotenv").config(); // Load environment variables from .env file

const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const OAuth2Strategy = require("passport-google-oauth2").Strategy;
const userdb = require("./model/userschema"); // Import Google OAuth schema
const collection = require("./model/loginschema"); // Import regular login schema
const Job = require("./model/Jobs");
const nodemailer = require('nodemailer');
//const jobRoutes = require("./Routes/jobs");


const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');


const PORT = 6005; // Define backend server port


const clientid = "371272045042-8l2m44s5hf7hluvr3stmqcatcvj9kddj.apps.googleusercontent.com";
const clientsecret = "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";

// Connect to MongoDB using the connection string from the .env file
mongoose.connect(process.env.DATABASE, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

app.use(cors({
  origin: "http://localhost:3000", // Allow requests from this origin
  methods: "GET,POST,PUT,DELETE",
  credentials: true
}));

app.use(express.json());

// Setup session
app.use(session({
  secret: "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",
  resave: false,
  saveUninitialized: true
}));

// Setup passport
app.use(passport.initialize());
app.use(passport.session());

passport.use(new OAuth2Strategy({
  clientID: clientid,
  clientSecret: clientsecret,
  callbackURL: "http://localhost:6005/auth/google/callback",
  scope: ["profile", "email"]
},
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await userdb.findOne({ googleId: profile.id });
      if (!user) {
        user = new userdb({
          googleId: profile.id,
          displayName: profile.displayName,
          email: profile.emails[0].value,
          image: profile.photos[0].value
        });
        await user.save();
      }
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Initial Google OAuth login
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Google OAuth callback
app.get("/auth/google/callback", passport.authenticate("google", {
  successRedirect: "http://localhost:3000",
  failureRedirect: "http://localhost:3000/login"
}));

app.get("/login/success", async (req, res) => {
  if (req.user) {
    res.status(200).json({ message: "User Login", user: req.user });
  } else {
    res.status(400).json({ message: "Not Authorized" });
  }
});

app.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) { return next(err); }
    res.redirect("http://localhost:3000");
  });
});

// Normal login route

//admin here
const adminCredentials = {
  username: 'admin',  // Admin username
  password: 'admin'  // Admin password
};
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    // admin here
    if (email === adminCredentials.username && password === adminCredentials.password) {
      return res.status(200).json({ msg: "Admin login", user: "admin", role: "admin" });
    }

    const check = await collection.findOne({ email: email });
    if (check && check.password === password) {
    
      res.json({msg:"exist" ,user:check.name});
    } else {
      res.json("notexist");
    }
  } catch (e) {
    res.json("notexist");
  }
});

// Signup route
app.post("/signup", async (req, res) => {
  const { name, email, password, cpassword } = req.body;
  const data = {
    name: name,
    email: email,
    password: password,
    cpassword: cpassword
  };
  const dataorg = {
    name: name,
    email: email,
    password: password
  };
  try {
    const check = await collection.findOne({ email: email });
    if (check) {
      res.json("exist");
    } else {
      if (data.password === data.cpassword) {
        await collection.insertMany([dataorg]);
        res.json("notexist");
      } else {
        res.json("passwordmismatch");
      }
    }
  } catch (e) {
    res.json("error");
  }
});

app.post("/ForgotPassword", async (req, res) => {
  const { email } = req.body;
  console.log(email);

  const user = await collection.findOne({ email });
  if (!user) {
      return res.status(400).send({ error: true, msg: 'Email id not registered' });
  }

  const resetCode = Math.floor(1000 + Math.random() * 9000).toString();
  user.resetCode = resetCode;
  user.resetCodeExpiration = Date.now() + 3600000; // 1 hour expiration
  await user.save();

  // Send email with nodemailer
  const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
          user: process.env.EMAIL, 
          pass: process.env.PASSWORD,
      },
  });

  const mailOptions = {
      from: process.env.EMAIL,
      to: user.email,
      subject: 'Password Reset Code',
      text: `Your password reset code is ${resetCode}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          return res.status(500).send({ error: true, msg: 'Error sending email' });
      } else {
          return res.status(200).send({ error: false, msg: 'Verification code sent to your email.' });
      }
  });
});

app.post('/resetpass', async (req, res) => {
  const { email, password } = req.body;

  const user = await collection.findOne({ email });
  if (!user) {
      return res.status(400).send({ error: true, msg: 'Email not found' });
  }

  user.password = password; // Make sure to hash the password before saving
  user.resetCode = undefined;
  user.resetCodeExpiration = undefined;
  await user.save();

  res.status(200).send({ error: false, msg: 'Password has been reset' });
});

app.post('/verifycode', async (req, res) => {
  const { email, code } = req.body;

  const user = await collection.findOne({ email, resetCode: code, resetCodeExpiration: { $gt: Date.now() } });
  if (!user) {
      return res.status(400).send({ error: true, msg: 'Invalid or expired code' });
  }

  res.status(200).send({ error: false, msg: 'Code verified' });
});











//user details
app.get("/users", async (req, res) => {
  try {
    const users = await collection.find();  // Assuming "collection" is your MongoDB collection
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ msg: "Error retrieving users" });
  }
});


//user delete
app.delete('/users/:_id', async (req, res) => {
  try {
    const { _id } = req.params;
    await collection.findByIdAndDelete(_id);
    res.status(200).json({ msg: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ msg: 'Error deleting user' });
  }
});



// //jobs

// // Middleware
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Static files for uploads
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // Routes
// app.use('/api/jobs', jobRoutes);

// // MongoDB connection
// mongoose.connect('mongodb://localhost:27017/jobPostingForm', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// }).then(() => {
//   console.log('Connected to MongoDB');
// }).catch((error) => {
//   console.error('Connection error:', error.message);
// });

app.listen(PORT, () => {
  console.log(`Server started at port number ${PORT}`);
});