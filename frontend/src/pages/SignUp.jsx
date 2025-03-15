import React, { useState } from "react";
import logo from "../images/logo.png";
import { Link, useNavigate } from "react-router-dom";
import image from "../images/authPageSide.png";
import { api_base_url } from "../helper";

const SignUp = () => {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const submitForm = async (e) => {
    e.preventDefault();

    const response = await fetch(api_base_url + "/signUp", {
      mode: "cors",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email , password: pwd, username, name }),
    });

    const data = await response.json();
    if (data.success) {
      localStorage.setItem(
        "signupData",
        JSON.stringify({ username, name, email, password: pwd })
      );
      navigate("/OTPVerification");
    } else {
      setError(data.message);
    }
  };

  return (
    <div className="container w-screen min-h-screen flex items-center justify-between pl-[100px]">
      <div className="left w-[35%]">
        <img className="w-[200px]" src={logo} alt="" />
        <form onSubmit={submitForm} className="w-full mt-[60px]">
          <div className="inputBox">
            <input
              required
              onChange={(e) => setUsername(e.target.value)}
              value={username}
              type="text"
              placeholder="Username"
            />
          </div>
          <div className="inputBox">
            <input
              required
              onChange={(e) => setName(e.target.value)}
              value={name}
              type="text"
              placeholder="Name"
            />
          </div>
          <div className="inputBox">
            <input
              required
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              type="email"
              placeholder="Email"
            />
          </div>
          <div className="inputBox">
            <input
              required
              onChange={(e) => setPwd(e.target.value)}
              value={pwd}
              type="password"
              placeholder="Password"
            />
          </div>
          <p className="text-[gray]">
            Already have an account?{" "}
            <Link to="/login" className="text-[#00AEEF]">
              Login
            </Link>
          </p>
          <p className="text-red-500 text-[14px] my-2">{error}</p>
          <button className="btnBlue w-full mt-[20px]">Send OTP</button>
        </form>
      </div>
      <div className="right w-[55%]">
        <img className="h-[100vh] w-[100%] object-cover" src={image} alt="" />
      </div>
    </div>
  );
};

const OtpVerification = () => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const verifyOtp = async (e) => {
    e.preventDefault();
    const signupData = JSON.parse(localStorage.getItem("signupData"));
    if (!signupData) return setError("No signup data found.");

    const response = await fetch(api_base_url + "/verify-Otp", {
      mode: "cors",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: signupData.email,
        otp,
        username: signupData.username,
        name: signupData.name,
        password: signupData.password,
      }),
    });

    const data = await response.json();
    if (data.success) {
      await fetch(api_base_url + "/signUp", {
        mode: "cors",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signupData),
      });
      localStorage.removeItem("signupData");
      alert("Account created successfully");
      navigate("/login");
    } else {
      setError(data.message);
    }
  };

  return (
    <div className="container w-screen min-h-screen flex items-center justify-center">
      <div className="box w-[30%] text-center">
        <img className="w-[150px] mx-auto" src={logo} alt="Logo" />
        <h2 className="text-2xl font-bold my-4">Enter OTP</h2>
        <p className="text-gray-500 mb-4">
          A 6-digit OTP has been sent to email
        </p>
        <form onSubmit={verifyOtp}>
          <input
            style={{color: "black"}}
            required
            type="text"
            maxLength="6"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
            className="border w-full p-2 mb-4 text-center"
          />
          <p className="text-red-500 text-sm">{error}</p>
          <button className="btnBlue w-full">Verify OTP</button>
        </form>
      </div>
    </div>
  );
};
export { OtpVerification };

export default SignUp;
