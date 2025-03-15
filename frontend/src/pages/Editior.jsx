import React, { useEffect, useState, useRef } from "react";
import EditiorNavbar from "../components/EditiorNavbar";
import Editor from "@monaco-editor/react";
import { MdLightMode } from "react-icons/md";
import { AiOutlineExpandAlt } from "react-icons/ai";
import { api_base_url } from "../helper";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import axios from "axios";

const Editior = () => {
  const [tab, setTab] = useState("html");
  const [isLightMode, setIsLightMode] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [htmlCode, setHtmlCode] = useState("<h1>Hello world</h1>");
  const [cssCode, setCssCode] = useState("body { background-color: #f4f4f4; }");
  const [jsCode, setJsCode] = useState("// some comment");
  const [pythonCode, setPythonCode] = useState('print("Hello World")');
  const [cCode, setCCode] = useState('printf("Hello World");');
  const [cppCode, setCppCode] = useState('cout << "Hello World";');
  const [javaCode, setJavaCode] = useState('System.out.println("Hello World");');
  const [languageOptions, setLanguageOptions] = useState("Web_Dev");
  const { projectID } = useParams();
  const socket = useRef(null);
  const [output, setOutput] = useState("");
  const [code, setCode] = useState("");

  const PISTON_API_URL = "https://emkc.org/api/v2/piston/execute";

  const changeTheme = () => {
    const editorNavbar = document.querySelector(".EditorNavbar");
    if (isLightMode) {
      editorNavbar.style.background = "#141414";
      document.body.classList.remove("lightMode");
      setIsLightMode(false);
    } else {
      editorNavbar.style.background = "#f4f4f4";
      document.body.classList.add("lightMode");
      setIsLightMode(true);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      run();
    }, 200);
  }, [htmlCode, cssCode, jsCode]);

  useEffect(() => {
    socket.current = io("http://localhost:5000");
    socket.current.on("connect", () => {
      console.log("Connected to Socket.io server");
      socket.current.emit("joinProject", projectID);
    });

    fetch(api_base_url + "/getProjectCode", {
      mode: "cors",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: localStorage.getItem("userId"),
        projId: projectID,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setHtmlCode(data.project.htmlCode || "<h1>Hello world</h1>");
        setCssCode(data.project.cssCode || "body { background-color: #f4f4f4; }");
        setJsCode(data.project.jsCode || "// some comment");
        setPythonCode(data.project.pythonCode || 'print("Hello World")');
        setCCode(data.project.cCode || 'printf("Hello World");');
        setCppCode(data.project.cppCode || 'cout << "Hello World";');
        setJavaCode(data.project.javaCode || 'System.out.println("Hello World");');
        setLanguageOptions(data.project.language || "Web_Dev");
      });

    socket.current.emit("joinProject", projectID);

    socket.current.on(
      "codeUpdate",
      ({ htmlCode, cssCode, jsCode, pythonCode, cCode, cppCode, javaCode }) => {
        setHtmlCode(htmlCode || "<h1>Hello world</h1>");
        setCssCode(cssCode || "body { background-color: #f4f4f4; }");
        setJsCode(jsCode || "// some comment");
        setPythonCode(pythonCode || 'print("Hello World")');
        setCCode(cCode || 'printf("Hello World");');
        setCppCode(cppCode || 'cout << "Hello World";');
        setJavaCode(javaCode || 'System.out.println("Hello World");');
      }
    );

    return () => {
      socket.current.disconnect();
    };
  }, [projectID]);

  useEffect(() => {
    setTab(languageOptions === "Web_Dev" ? "html" : languageOptions);
  }, [languageOptions]);

  const run = () => {
    const html = htmlCode;
    const css = `<style>${cssCode}</style>`;
    const js = `<script>${jsCode}</script>`;
    const iframe = document.getElementById("iframe");
    if (iframe) {
      iframe.srcdoc = html + css + js;
    }
  };

  const run2 = async () => {
    if (languageOptions === "Web_Dev") {
      run();
    } else {
      const language = languageOptions;
      let content = "";

      switch (language) {
        case "python":
          content = pythonCode;
          break;
        case "c":
          content = cCode;
          break;
        case "cpp":
          content = cppCode;
          break;
        case "java":
          content = javaCode;
          break;
        default:
          return;
      }

      try {
        const { data } = await axios.post(PISTON_API_URL, {
          language: language,
          version: "*",
          files: [{ content }],
        });

        setOutput(data.run.stdout || data.run.stderr || "No output");
      } catch (error) {
        console.error(error);
        setOutput("Error running code");
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === "s") {
        event.preventDefault();

        fetch(api_base_url + "/updateProject", {
          mode: "cors",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: localStorage.getItem("userId"),
            projId: projectID,
            htmlCode: htmlCode,
            cssCode: cssCode,
            jsCode: jsCode,
            pythonCode: pythonCode,
            cCode: cCode,
            cppCode: cppCode,
            javaCode: javaCode,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              alert("Project saved successfully");
            } else {
              alert("Something went wrong");
            }
          })
          .catch((err) => {
            console.error("Error saving project:", err);
            alert("Failed to save project. Please try again.");
          });
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [projectID, htmlCode, cssCode, jsCode, pythonCode, cCode, cppCode, javaCode]);

  const handleCodeChange = (newCode, type) => {
    switch (type) {
      case "html":
        setHtmlCode(newCode);
        break;
      case "css":
        setCssCode(newCode);
        break;
      case "js":
        setJsCode(newCode);
        break;
      case "python":
        setPythonCode(newCode);
        break;
      case "c":
        setCCode(newCode);
        break;
      case "cpp":
        setCppCode(newCode);
        break;
      case "java":
        setJavaCode(newCode);
        break;
      default:
        break;
    }
    run();
    socket.current.emit("codeChange", {
      projectId: projectID,
      htmlCode,
      cssCode,
      jsCode,
      pythonCode,
      cCode,
      cppCode,
      javaCode,
    });
  };

  return (
    <>
      <EditiorNavbar />
      <div className="flex">
        <div className={`left w-[${isExpanded ? "100%" : "50%"}]`}>
          <div className="tabs flex items-center justify-between gap-2 w-full bg-[#1A1919] h-[50px] px-[40px]">
            <div className="tabs flex items-center gap-2">
              {languageOptions === "Web_Dev" && (
                <>
                  <div
                    onClick={() => setTab("html")}
                    className="tab cursor-pointer p-[6px] bg-[#1E1E1E] px-[10px] text-[15px]"
                  >
                    HTML
                  </div>
                  <div
                    onClick={() => setTab("css")}
                    className="tab cursor-pointer p-[6px] bg-[#1E1E1E] px-[10px] text-[15px]"
                  >
                    CSS
                  </div>
                  <div
                    onClick={() => setTab("js")}
                    className="tab cursor-pointer p-[6px] bg-[#1E1E1E] px-[10px] text-[15px]"
                  >
                    JavaScript
                  </div>
                </>
              )}

              {["python", "c", "cpp", "java"].includes(languageOptions) && (
                <div className="tab cursor-pointer p-[6px] bg-[#1E1E1E] px-[10px] text-[15px]">
                  {languageOptions.toUpperCase()}
                </div>
              )}

              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Link copied to clipboard!");
                }}
                className="btnBlue ml-[90px]"
              >
                Share Code
              </button>

              {languageOptions !== "Web_Dev" && (
                <button onClick={run2} className="btnBlue ml-[90px]">
                  Run
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <i className="text-[20px] cursor-pointer" onClick={changeTheme}>
                <MdLightMode />
              </i>
              <i
                className="text-[20px] cursor-pointer"
                onClick={() => {
                  setIsExpanded(!isExpanded);
                }}
              >
                <AiOutlineExpandAlt />
              </i>
            </div>
          </div>

          {tab === "html" ? (
            <Editor
              onChange={(value) => handleCodeChange(value || "", "html")}
              height="82vh"
              theme={isLightMode ? "vs-light" : "vs-dark"}
              language="html"
              value={htmlCode}
            />
          ) : tab === "css" ? (
            <Editor
              onChange={(value) => handleCodeChange(value || "", "css")}
              height="82vh"
              theme={isLightMode ? "vs-light" : "vs-dark"}
              language="css"
              value={cssCode}
            />
          ) : tab === "js" ? (
            <Editor
              onChange={(value) => handleCodeChange(value || "", "js")}
              height="82vh"
              theme={isLightMode ? "vs-light" : "vs-dark"}
              language="javascript"
              value={jsCode}
            />
          ) : tab === "python" ? (
            <Editor
              onChange={(value) => handleCodeChange(value || "", "python")}
              height="82vh"
              theme={isLightMode ? "vs-light" : "vs-dark"}
              language="python"
              value={pythonCode}
            />
          ) : tab === "c" ? (
            <Editor
              onChange={(value) => handleCodeChange(value || "", "c")}
              height="82vh"
              theme={isLightMode ? "vs-light" : "vs-dark"}
              language="c"
              value={cCode}
            />
          ) : tab === "cpp" ? (
            <Editor
              onChange={(value) => handleCodeChange(value || "", "cpp")}
              height="82vh"
              theme={isLightMode ? "vs-light" : "vs-dark"}
              language="cpp"
              value={cppCode}
            />
          ) : tab === "java" ? (
            <Editor
              onChange={(value) => handleCodeChange(value || "", "java")}
              height="82vh"
              theme={isLightMode ? "vs-light" : "vs-dark"}
              language="java"
              value={javaCode}
            />
          ) : null}
        </div>

        {(!isExpanded && languageOptions === "Web_Dev") ? (
          <iframe
            id="iframe"
            className="w-[50%] min-h-[82vh] bg-[#fff] text-black"
            title="output"
          />
        ) : !isExpanded && (
          <pre className="w-[50%] min-h-[82vh] bg-[#fff] text-black p-4">
            {output}
          </pre>
        )}
      </div>
    </>
  );
};

export default Editior;
