const fs = require('fs');
const path = require('path');
const { main } = require('./model');
const crypto = require('crypto'); 

const installCrypto = () => {
    try {
        require.resolve('crypto');
    } catch (err) {
        console.log("'crypto' module is missing. Installing now...");
        execSync('npm install crypto', { stdio: 'inherit', cwd: path.resolve(__dirname) });
    }
};

installCrypto();

async function processFiles(configPath) {
    const config = require(configPath);
    if (!config.input_path) throw new Error('Key "input_path" not found in config file.');

    const inputPath = path.resolve(process.cwd(), config.input_path);
    const allDocs = [];
    const files = await fs.promises.readdir(inputPath);
    const hashFilePath = path.join(process.cwd(), 'file_hashes.json');

    let previousHashes = {};
    if (fs.existsSync(hashFilePath)) {
        previousHashes = JSON.parse(await fs.promises.readFile(hashFilePath, 'utf8'));
    }

    for (const file of files) {
        const filePath = path.join(inputPath, file);

        try {
            const data = await fs.promises.readFile(filePath, 'utf8');
            const currentHash = hashFile(data); 

            if (previousHashes[file] !== currentHash) {
                const response = await main(data);
                // console.log('Response from main function:', response); 
                // Ensure the documentation is an array
                let formattedResponse = response.replace(/\\n/g, '\n');
                if (!Array.isArray(formattedResponse)) {
                    formattedResponse = [formattedResponse];  // Convert string to array
                }

                allDocs.push({ file, documentation: formattedResponse });
                // console.log(allDocs);

                previousHashes[file] = currentHash;
            } else {
                console.log(`Skipping file ${file} (no changes detected).`);
            }
        } catch (error) {
            console.error(`Error processing file ${file}: ${error.message}`);
        }
    }

    await fs.promises.writeFile(hashFilePath, JSON.stringify(previousHashes, null, 2), 'utf8');
    return allDocs;
}

function hashFile(content) {
    return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

module.exports = { processFiles };
