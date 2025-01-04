// Import required modules
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const uglifycss = require("uglifycss"); // Import uglifycss module

// Define input and output directories
const inputDir = "./ts-build";
const outputDir = "./dist";

// Function to minify files recursively
function minifyFiles(dir) {
  // Read the contents of the input directory
  fs.readdirSync(dir).forEach((file) => {
    // Get the absolute path of the current file/directory
    const filePath = path.join(dir, file);
    // Calculate the output file path relative to the output directory
    const outputFilePath = path.join(outputDir, path.relative(inputDir, filePath));

    // Check if the current item is a directory
    if (fs.statSync(filePath).isDirectory()) {
      // If it's a directory, create the corresponding directory in the output
      fs.mkdirSync(outputFilePath, { recursive: true });
      // Recursively minify files within this directory
      minifyFiles(filePath);
    }
    // Check if the current item is a JavaScript file
    else if (file.endsWith(".js")) {
      // Get the directory path where the output file will be placed
      const outputFileDir = path.dirname(outputFilePath);
      // Ensure parent directories exist
      fs.mkdirSync(outputFileDir, { recursive: true });
      // Minify the JavaScript file using UglifyJS and save the minified file
      execSync(`npx uglifyjs ${filePath} -c -m -o ${outputFilePath}`);
    }
    // Check if the current item is a CSS file
    else if (file.endsWith(".css")) {
      // Get the directory path where the output file will be placed
      const outputFileDir = path.dirname(outputFilePath);
      // Ensure parent directories exist
      fs.mkdirSync(outputFileDir, { recursive: true });
      // Minify the CSS file using uglifycss and save the minified file
      const minifiedCss = uglifycss.processString(fs.readFileSync(filePath, "utf8"));
      fs.writeFileSync(outputFilePath, minifiedCss, "utf8");
    }
    // Check if the current item is a TypeScript declaration file
    else if (file.endsWith(".d.ts")) {
      // Get the output directory for TypeScript declaration files
      const outputFileDir = path.join(outputDir, path.relative(inputDir, dir));
      // Calculate the output file path
      const outputFilePath = path.join(outputFileDir, file);
      // Ensure parent directories exist
      fs.mkdirSync(outputFileDir, { recursive: true });
      // Copy TypeScript declaration file to the output directory
      fs.copyFileSync(filePath, outputFilePath);
    }
  });
}

// Call the function to start minifying files in the input directory
minifyFiles(inputDir);
