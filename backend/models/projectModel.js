const mongoose = require("mongoose");
mongoose.connect('mongodb://127.0.0.1:27017/CodeEditor');


const projectSchema = new mongoose.Schema({
  title: String,
  createdBy: String,
  date: {
    type: Date,
    default: Date.now
  },
  htmlCode: {
    type: String,
    default: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
    </head>
    <body>
    
    </body>
    </html>`
  },
  cssCode: {
    type: String,
    default: `
    body{
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }`
  },
  language:{
    type:String,
    default:"Web Dev"
  },
  jsCode: {
    type: String,
    default: 'console.log("Hello World")'
  }, 
  pythonCode:{
    type:String,
    default:"print(\"Hello World\")"
  }, 
  javaCode:{
    type:String,
    default:"public class HelloWorld {\n\t\n\tpublic static void main(String[] args) {\n\t\tSystem.out.println(\"Hello World!\");\n\t}\n}"
  },
  cCode:{
    type:String,
    default:"void main(){\nprintf(\"Hello World!\\n\");\n}"
  },
  cppCode:{
    type:String,
    default:"void main(){\nprintf(\"Hello World!\\n\");\n}"
  },
  });

module.exports = mongoose.model("Project", projectSchema);