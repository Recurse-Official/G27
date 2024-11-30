#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { main } = require('./model');

async function processFiles(configPath) {
    const config = require(configPath);

    if (!config.input_path) {
        throw new Error('Key "input_path" not found in config file.');
    }

    const inputPath = path.resolve(process.cwd(), config.input_path);
    const allDocs = [];

    const files = await fs.promises.readdir(inputPath);
    for (const file of files) {
        const filePath = path.join(inputPath, file);

        try {
            const data = await fs.promises.readFile(filePath, 'utf8');
            const response = await main(data);
            const formattedResponse = response.replace(/\\n/g, '\n');
            allDocs.push({
                file,
                documentation: formattedResponse,
            });
            console.log(formattedResponse);
        } catch (error) {
            console.error(`Error processing file ${file}: ${error.message}`);
        }
    }
    console.log(allDocs);
    return allDocs;
}

module.exports = { processFiles };
