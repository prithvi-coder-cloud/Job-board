require("dotenv").config(); // Correct way to load environment variables

const express = require("express");
const app = express();
const cors = require("cors");
require("./db/conn");
const PORT = 6005;
const session = require("express-session");
const passport = require("passport");
const OAuth2Strategy = require("passport-google-oauth2").Strategy;
const userdb = require("./model/userschema");
const collection = require("./model/loginschema");

const clientid = "371272045042-8l2m44s5hf7hluvr3stmqcatcvj9kddj.apps.googleusercontent.com";
const clientsecret = "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";

app.use(cors({
    origin: "http://localhost:3000",
    methods: "GET,POST,PUT,DELETE",
    credentials: true
}));

app.use(express.json());

// Setup session
app.use(session({
    secret: "2134324jjnjewfkjnksn",
    resave: false,
    saveUninitialized: true
}));

// Setup passport
app.use(passport.initialize());
app.use(passport.session());

passport.use(
    new OAuth2Strategy({
        clientID: clientid,
        clientSecret: clientsecret,
        callbackURL: "http://localhost:6005/auth/google/callback",
        scope: ["profile", "email"]
    },
    async (accessToken, refreshToken, profile, done) => {
        //console.log("profile", profile);
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
    })
);

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
    successRedirect: "http://localhost:3000/dashboard",
    failureRedirect: "http://localhost:3000/login"
}))

app.get("/login/success",async(req,res)=>{
    console.log("request",req.user)
    if(req.user){
        res.status(200).json({message:"user Login",user:req.user})
    }else{
        res.status(400).json({message:"Not Authorized"})
    }
})
app.get("/logout",(req,res,next)=>{
    req.logout(function(err){
        if(err){return next(err)}
        res.redirect("http://localhost:3000");
    })
})
app.listen(PORT, () => {
    console.log(`Server started at port number ${PORT}`);
});



app.get("/login",cors(),(req,res)=>{

})

app.post("/",async(req,res)=>{
    const{email,password} = req.body
    try{
        const check = await collection.findOne({email:email})
        if(check){
            res.json("exist")
        }
        else{
            res.json("notexist")
        }
    }
    catch(e){
        res.json("notexist")

    }
})


app.post("/signup",async(req,res)=>{
    const{email,password} = req.body
    const data={
        email:email,
        password:password
    }
    try{
        const check = await collection.findOne({email:email})
        if(check){
            res.json("exist")
        }
        else{
            res.json("notexist")
            await collection.insertMany([data])
        }
    }
    catch(e){
        res.json("notexist")

    }
})  
app.listen(8000,()=>{
    console.log("port connected")
})