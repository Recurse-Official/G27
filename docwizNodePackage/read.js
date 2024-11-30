#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const appRoot = process.cwd();
const configFilePath = path.join(appRoot, 'docwiz.config.js');

let config;
try {
    config = require(configFilePath);
    if (!config.input_path) {
        throw new Error('Key "input_path" not found in config file.');
    }
} catch (error) {
    console.error(`Error reading config file at ${configFilePath}: ${error.message}`);
    process.exit(1);
}

const inputPath = path.resolve(appRoot, config.input_path);

fs.readdir(inputPath, (err, files) => {
    if (err) {
        return console.error(`Unable to scan directory at ${inputPath}: ${err.message}`);
    }

    files.forEach(file => {
        const filePath = path.join(inputPath, file);
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                return console.error(`Unable to read file ${filePath}: ${err.message}`);
            }
            console.log(`Content of ${file}:\n${data}\n`);
        });
    });
});
