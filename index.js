const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");


const app = express();



// Database Connection
async function databaseConnection() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/HomeTutorHub");
    console.log("MongoDB Connected");
  } catch (error) {
    console.log("MongoDB Connection Failed");
    console.log(error);
  }
}

databaseConnection();


// Schema 
const userSchema = mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        min: [8, "Password must be at least 8 characters"],
        required: true,
    }
}, 
{timestamps: true}
);

// Model

const User = mongoose.model("user", userSchema);

// Setting up ejs 
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


// Global Middlerwares
app.use(express.urlencoded({extended: false}));
app.use(express.json());


// Routes

// register
app.get("/users/signup", (req, res) => {
    return res.render("signup");
});

app.post("/users/signup", async (req, res) => {
    const {fullName, email, password} = req.body;

    if(!fullName || !email || !password) {
        return res.status(400).send("all fields are required");
    }

    const existingUser = await User.findOne({email});

    if(existingUser) {
        return res.status(400).json({msg: "user already exists"});
    }


    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);


    const user = await User.create({
        fullName,
        email,
        password: hashedPassword
    });

    return res.status(201).redirect("/");
});


// Login 
app.get("/users/login", (req, res) => {
    return res.render("login");
});

app.post("/users/login",  async (req, res) => {
    const {email, password} = req.body;
    const user = await User.findOne({email});

    if(!user) return res.json({msg: "no user found with given email"});


    const isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch) {
        return res.status(401).render("login", {errMsg: "Password is doesn't matched, try again!"});
    }
    
    return res.render("home", {userFullName: user.fullName});
});




// Home Route
app.get("/", (req, res) => {
    return res.render("home");
});


app.listen(8080, () => console.log("Sever started at port 8080"));