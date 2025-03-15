import React, { useEffect, useState } from "react";
import logo from "../images/logo.png";
import { FiDownload } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { api_base_url } from "../helper";
import { useParams } from 'react-router-dom';


const EditiorNavbar = () => {
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState("Loading..."); // Default placeholder
  const [error, setError] = useState(null);
  const { projectID } = useParams();
  console.log(projectID)

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(api_base_url + "/getProjects", {
          mode: "cors",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: localStorage.getItem("userId"),
          }),
        });

        const data = await response.json();
        if (data.success && data.projects.length > 0) {
          const currentProject =  data.projects.find(
            (project) =>
              project._id.toString() === projectID
          )

          if(currentProject){
            setProjectName(currentProject.title)
          }else{
            setProjectName("Untitled Project")
          }
        } else {
          setProjectName("Untitled Project");
        }
      } catch (error) {
        console.error("Error fetching project:", error);
        setProjectName("Error loading project");
      }
    };

    fetchProject();
  }, []);

  return (
    <div className="EditorNavbar flex items-center justify-between px-[100px] h-[80px] bg-[#141414]">
      <div className="logo">
        <img
          onClick={() => navigate("/")}
          className="w-[150px] cursor-pointer"
          src={logo}
          alt="Logo"
        />
      </div>
      <p>
        File / <span className="text-[gray]">{projectName}</span>
      </p>
      <i className="p-[8px] btn bg-black rounded-[5px] cursor-pointer text-[20px]">
        <FiDownload />
      </i>
    </div>
  );
};

export default EditiorNavbar;
