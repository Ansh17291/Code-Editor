var express = require("express");
var router = express.Router();
var bcrypt = require("bcryptjs");
var userModel = require("../models/userModel");
var jwt = require("jsonwebtoken");
var projectModel = require("../models/projectModel");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

const secret = "secret";

router.post("/signUp", async (req, res) => {
  let { username, name, email, password } = req.body;

  try {
    let emailCon = await userModel.findOne({ email: email });
    if (emailCon) {
      return res.json({ success: false, message: "Email already exists" });
    }

    const salt = await bcrypt.genSalt(10);  // Using await
    const hash = await bcrypt.hash(password, salt);  // Using await

    const user = await userModel.create({
      username: username,
      name: name,
      email: email,
      password: hash,
    });

    return res.json({ success: true, message: "User created successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});


router.post("/login", async (req, res) => {
  let { email, password } = req.body;
  let user = await userModel.findOne({ email: email });

  if (user) {
    // Rename the second `res` to avoid conflict
    bcrypt.compare(password, user.password, function (err, isMatch) {
      if (err) {
        return res.json({ success: false, message: "An error occurred", error: err });
      }
      if (isMatch) {
        let token = jwt.sign({ email: user.email, userId: user._id }, secret);
        return res.json({ success: true, message: "User logged in successfully", token: token, userId: user._id });
      } else {
        return res.json({ success: false, message: "Invalid email or password" });
      }
    });
  } else {
    return res.json({ success: false, message: "User not found!" });
  }
});

router.post("/getUserDetails", async(req, res)=>{
  let {userId} = req.body;
  let user = await userModel.findOne({ _id: userId});
  if(user){
    return res.json({success: true, message: "User Details fetched Successfully ", user: user});
  }else {
    return res.json({success: false, message:"User not found"});
  }
});

router.post("/createProject", async (req, res) => {
  let { userId, title } = req.body;
  let user = await userModel.findOne({ _id: userId });
  if (user) {
    let project = await projectModel.create({
      title: title,
      createdBy: userId
    });


    return res.json({ success: true, message: "Project created successfully", projectId: project._id });
  }
  else {
    return res.json({ success: false, message: "User not found!" });
  }
});

router.post("/getProjects", async (req, res) => {
  let { userId } = req.body;
  console.log(userId + "  1");
  
  // Fetch all projects created by this user
  let projects = await projectModel.find({ createdBy: userId });

  if (projects.length > 0) {
    return res.json({
      success: true,
      message: "Projects fetched successfully",
      projects: projects,
    });
  } else {
    return res.json({ success: false, message: "No projects found!" });
  }
});

router.post("/deleteProject", async(req, res)=>{
  let {userId, projId} = req.body;
  let user = await userModel.findOne({ _id: userId});
  if (user) {
    let project = await projectModel.findOneAndDelete({_id: projId});
  }else{
    return res.json({success: false, message: "User not found"});
  }
 
});

router.post("/getProjectCode", async(req, res)=>{
  let {userId, projId} = req.body;
  let user = await userModel.findOne({_id: userId});
  if (user){
    let project = await projectModel.findOne({_id: projId});
    return res.json({success: true, message: "Project Fetched Successfully", project: project});

  }else{
    return res.json({success : false, message: "User not found !"});
  }
})

router.post("/updateProject", async (req, res) => {
  let { userId, htmlCode, cssCode, jsCode, projId } = req.body;
  let user = await userModel.findOne({ _id: userId });

  if (user) {
    let project = await projectModel.findOneAndUpdate(
      { _id: projId },
      { htmlCode: htmlCode, cssCode: cssCode, jsCode: jsCode },
      { new: true } // This option returns the updated document
    );

    if (project) {
      return res.json({ success: true, message: "Project updated successfully" });
    } else {
      return res.json({ success: false, message: "Project not found!" });
    }
  } else {
    return res.json({ success: false, message: "User not found!" });
  }
});


module.exports = router;
