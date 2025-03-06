var express = require("express");
const http = require("http");
const { Server } = require("socket.io");
var bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
var userModel = require("../models/userModel");
var projectModel = require("../models/projectModel");
var cors = require("cors");

var app = express();
var router = express.Router();

app.use(cors());

// Create HTTP server and initialize Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins (change this in production)
    methods: ["GET", "POST"],
  },
});

const secret = "secret";

// Store live project code updates in memory (temporary, consider Redis for scaling)
const projectCode = {};

// ========== AUTH ROUTES ==========

// Sign Up
router.post("/signUp", async (req, res) => {
  let { username, name, email, password } = req.body;

  try {
    let emailCon = await userModel.findOne({ email: email });
    if (emailCon) {
      return res.json({ success: false, message: "Email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const user = await userModel.create({
      username,
      name,
      email,
      password: hash,
    });

    return res.json({ success: true, message: "User created successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  let { email, password } = req.body;
  let user = await userModel.findOne({ email: email });

  if (user) {
    bcrypt.compare(password, user.password, function (err, isMatch) {
      if (err) {
        return res.json({
          success: false,
          message: "An error occurred",
          error: err,
        });
      }
      if (isMatch) {
        let token = jwt.sign({ email: user.email, userId: user._id }, secret);
        return res.json({
          success: true,
          message: "User logged in successfully",
          token,
          userId: user._id,
        });
      } else {
        return res.json({
          success: false,
          message: "Invalid email or password",
        });
      }
    });
  } else {
    return res.json({ success: false, message: "User not found!" });
  }
});

// ========== PROJECT ROUTES ==========

// Create Project
router.post("/createProject", async (req, res) => {
  let { userId, title } = req.body;
  let user = await userModel.findOne({ _id: userId });
  if (user) {
    let project = await projectModel.create({
      title: title,
      createdBy: userId,
      htmlCode: "",
      cssCode: "",
      jsCode: "",
    });

    return res.json({
      success: true,
      message: "Project created successfully",
      projectId: project._id,
    });
  }
  return res.json({ success: false, message: "User not found!" });
});

// Get Projects
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

// Get Project Code
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

// Delete Project
router.post("/deleteProject", async (req, res) => {
  let { userId, projId } = req.body;
  let user = await userModel.findOne({ _id: userId });
  if (user) {
    await projectModel.findOneAndDelete({ _id: projId });
    return res.json({ success: true, message: "Project deleted successfully" });
  }
  return res.json({ success: false, message: "User not found" });
});

// Update Project Code (for saving manually)
router.post("/updateProject", async (req, res) => {
  let { projId, htmlCode, cssCode, jsCode } = req.body;
  let project = await projectModel.findOneAndUpdate(
    { _id: projId },
    { htmlCode, cssCode, jsCode },
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

// ========== SOCKET.IO FOR LIVE CODE SHARING ==========

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // When a user joins a project
  socket.on("joinProject", (projectId) => {
    socket.join(projectId);
    console.log(`User ${socket.id} joined project ${projectId}`);

    // Send the current code if available
    if (projectCode[projectId]) {
      socket.emit("codeUpdate", projectCode[projectId]);
    }
  });

  // When a user updates code
  socket.on("codeChange", ({ projectId, htmlCode, cssCode, jsCode }) => {
    // Store in memory (consider saving to DB for persistence)
    projectCode[projectId] = { htmlCode, cssCode, jsCode };

    // Broadcast the update to everyone except the sender
    socket.to(projectId).emit("codeUpdate", { htmlCode, cssCode, jsCode });
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });
});

// Start Server
server.listen(5000, () => {
  console.log("Server is running on port 5000");
});

module.exports = router;
