var express = require("express");
const http = require("http");
const { Server } = require("socket.io");
var bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
var userModel = require("../models/userModel");
var projectModel = require("../models/projectModel");
var cors = require("cors");
var nodemailer = require("nodemailer");

var app = express();
var router = express.Router();

app.use(cors());


const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"],
  },
});

const secret = "secret";


const projectCode = {};

const otpStorage = {}; 

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "ansh017290@gmail.com", 
    pass:  "kdfx ujmd jeuv yiih"
  },
});


const sendOTP = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your OTP for Verification",
    text: `Your OTP is: ${otp}. It is valid for 5 minutes.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("OTP sent successfully to", email);
  } catch (error) {
    console.error("Error sending OTP:", error);
  }
};


const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

router.post("/signUp", async (req, res) => {
  let { username, name, email, password } = req.body;

  try {
    let emailCon = await userModel.findOne({ email });
    if (emailCon) {
      return res.json({ success: false, message: "Email already exists" });
    }

    if(password.length < 6){
      return res.json({ success: false, message: "Password must be atleast 6 characters long" });
    }

    
    const otp = generateOTP();
    otpStorage[email] = { otp, expiresAt: Date.now() + 300000 }; 

    await sendOTP(email, otp);
    return res.json({ success: true, message: "OTP sent to email" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});


router.post("/verify-otp", async (req, res) => {
  let { username, name, email, password, otp } = req.body;

  if (!otpStorage[email] || otpStorage[email].otp !== otp) {
    return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
  }


  try {
    console.log("Creating user...");
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const user = await userModel.create({
      username,
      name,
      email,
      password: hash,
    });

    return res.json({ success: true, message: "User registered successfully" });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Resend OTP
router.post("/resend-otp", async (req, res) => {
  let { email } = req.body;

  if (!otpStorage[email]) {
    return res.status(400).json({ success: false, message: "No OTP request found. Sign up first." });
  }

  const otp = generateOTP();
  otpStorage[email] = { otp, expiresAt: Date.now() + 300000 }; 

  await sendOTP(email, otp);
  return res.json({ success: true, message: "OTP resent successfully" });
});

// Login
router.post("/login", async (req, res) => {
  let { email, password } = req.body;
  let user = await userModel.findOne({ email });

  if (user) {
    bcrypt.compare(password, user.password, function (err, isMatch) {
      if (err) {
        return res.json({ success: false, message: "An error occurred", error: err });
      }
      if (isMatch) {
        let token = jwt.sign({ email: user.email, userId: user._id }, secret);
        return res.json({ success: true, message: "User logged in successfully", token, userId: user._id });
      } else {
        return res.json({ success: false, message: "Invalid email or password" });
      }
    });
  } else {
    return res.json({ success: false, message: "User not found!" });
  }
});


router.post("/createProject", async (req, res) => {
  let { userId, title, language } = req.body;
  let user = await userModel.findOne({ _id: userId });
  if (user) {
    let project = await projectModel.create({
      title: title,
      createdBy: userId,
      htmlCode: "",
      cssCode: "",
      jsCode: "",
      pythonCode : "",
      cCode : "",
      cppCode : "",
      javaCode : "",
      language: language,
    });

    return res.json({
      success: true,
      message: "Project created successfully",
      projectId: project._id,
    });
  }
  return res.json({ success: false, message: "User not found!" });
});


router.post("/getProjects", async (req, res) => {
  let { userId } = req.body;
  let projects = await projectModel.find({ createdBy: userId });

  if (projects.length > 0) {
    return res.json({
      success: true,
      message: "Projects fetched successfully",
      projects,
    });
  } else {
    return res.json({ success: false, message: "No projects found!" });
  }
});


router.post("/getProjectCode", async (req, res) => {
  let { projId } = req.body;
  let project = await projectModel.findOne({ _id: projId });
  if (project) {
    return res.json({
      success: true,
      message: "Project Fetched Successfully",
      project,
    });
  } else {
    return res.json({ success: false, message: "Project not found!" });
  }
});


router.post("/deleteProject", async (req, res) => {
  let { userId, projId } = req.body;
  let user = await userModel.findOne({ _id: userId });
  if (user) {
    await projectModel.findOneAndDelete({ _id: projId });
    return res.json({ success: true, message: "Project deleted successfully" });
  }
  return res.json({ success: false, message: "User not found" });
});


router.post("/updateProject", async (req, res) => {
  let { projId, htmlCode, cssCode, jsCode , pythonCode , cCode , cppCode , javaCode } = req.body;
  let project = await projectModel.findOneAndUpdate(
    { _id: projId },
    { htmlCode, cssCode, jsCode , pythonCode, cCode , cppCode , javaCode },
    { new: true }
  );

  if (project) {
    return res.json({ success: true, message: "Project updated successfully" });
  }
  return res.json({ success: false, message: "Project not found!" });
});

router.post("/getUserDetails", async (req, res) => {
  let { userId } = req.body;
  let user = await userModel.findOne({ _id: userId });
  if (user) {
    return res.json({
      success: true,
      message: "User details fetched successfully",
      user: user,
    });
  } else {
    return res.json({ success: false, message: "User not found!" });
  }
});



io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

 
  socket.on("joinProject", (projectId) => {
    socket.join(projectId);
    console.log(`User ${socket.id} joined project ${projectId}`);

   
    if (projectCode[projectId]) {
      socket.emit("codeUpdate", projectCode[projectId]);
    }
  });

  
  socket.on("codeChange", ({ projectId, htmlCode, cssCode, jsCode, pythonCode, cCode , cppCode , javaCode }) => {
    
    projectCode[projectId] = { htmlCode, cssCode, jsCode , pythonCode, pythonCode ,cCode , cppCode , javaCode };

    
    socket.to(projectId).emit("codeUpdate", { htmlCode, cssCode, jsCode, pythonCode,cCode , cppCode , javaCode });
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });
});


server.listen(5000, () => {
  console.log("Server is running on port 5000");
});

module.exports = router;
