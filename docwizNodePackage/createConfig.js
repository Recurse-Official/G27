#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const config = {
    name: "your-project-name",
    "input_path": "./input",
    "output_path": "./output"
};
const userProjectRoot = process.cwd(); 
const configPath = path.join(userProjectRoot, 'docwiz.config.js');
fs.writeFile(configPath, `module.exports = ${JSON.stringify(config, null, 2)};`, (err) => {
    if (err) {
        console.error('Error writing config file:', err);
    } else {
        console.log('Config file created successfully at', configPath);
    }
});
config["name-of-file"] = "docwiz.config.js";
fs.writeFile(configPath, `module.exports = ${JSON.stringify(config, null, 2)};`, (err) => {
    if (err) {
        console.error('Error writing updated config file:', err);
    } else {
        console.log('Updated config file created successfully at', configPath);
    }
});
