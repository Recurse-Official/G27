#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { processFiles } = require('./read.js');

async function generateDoc() {
    const configPath = path.resolve(process.cwd(), 'docwiz.config.js');
    const docPath = path.resolve(process.cwd(), 'doc.html');
    const hashFilePath = path.resolve(process.cwd(), 'previousHash.json'); 

    try {
        const allDocs = await processFiles(configPath);

        if (allDocs.length === 0) {
            console.log('No documentation generated. No files were processed.');
            return;
        }

        const newHtmlSections = allDocs.map(({ file, documentation }) => {
            // Ensure that documentation is not empty
            if (!documentation || documentation.length === 0) {
                console.warn(`No documentation found for file: ${file}`);
                return ''; // Skip this file if no documentation
            }
        
            // Parse the documentation strings into objects
            const parsedDocumentation = documentation.map(doc => {
                try {
                    // Remove the Markdown code block (triple backticks) before parsing JSON
                    const cleanDoc = doc.replace(/```json|```/g, '').trim();
                    return JSON.parse(cleanDoc); // Parse the cleaned-up JSON string into an object
                } catch (error) {
                    console.error(`Error parsing documentation for file: ${file}`, error);
                    return null; // Return null if parsing fails
                }
            }).filter(doc => doc !== null); // Filter out invalid parsed documents
        
            // If no valid documentation or no endpoints, skip the file
            if (parsedDocumentation.length === 0 || !parsedDocumentation[0].endpoints) {
                console.warn(`No valid endpoints in documentation for file: ${file}`);
                return ''; // Skip this file if no valid endpoints
            }
        
            // Generate HTML for the documentation
            return `
                <div class="file-section">
                    <h1>${file}</h1>
                    ${parsedDocumentation[0].endpoints
                        .map((endpoint) => `
                            <div class="route-section">
                                <h2 class="route">${endpoint.route || 'Unknown route'} 
                                    <span class="method">(${endpoint.method || 'Unknown method'})</span>
                                </h2>
                                <pre class="code">${JSON.stringify(
                                    {
                                        description: endpoint.description || 'No description available',
                                        'body/params': endpoint['body/params'] || 'No body params available',
                                        response_type: endpoint.response_type || 'Unknown response type',
                                        sample_response: endpoint.sample_response || 'No sample response available',
                                    },
                                    null,
                                    4
                                )}</pre>
                            </div>
                        `)
                        .join('')}
                </div>
            `;
        });
        
        
        
        

        const newHtml = newHtmlSections.join('\n');
        const newHash = crypto.createHash('sha256').update(newHtml).digest('hex');

        if (fs.existsSync(hashFilePath)) {
            const previousHashData = await fs.promises.readFile(hashFilePath, 'utf8');
            const previousHash = JSON.parse(previousHashData).hash;

            if (newHash === previousHash) {
                console.log('Documentation is up-to-date. No changes made.');
                return;
            }
        }

        // Create new HTML file if it doesn't exist
        let existingHtml = '';
        if (fs.existsSync(docPath)) {
            existingHtml = await fs.promises.readFile(docPath, 'utf8');
            existingHtml = existingHtml.replace('</body></html>', newHtml + '</body></html>');
        } else {
            // Create the initial HTML structure if the file does not exist
            existingHtml = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>API Documentation</title>
                    <style>
                        body { font-family: Arial, sans-serif; }
                        .file-section { margin-bottom: 20px; }
                        .route-section { margin-left: 20px; }
                    </style>
                </head>
                <body>
                    <h1>API Documentation</h1>
                    ${newHtml}
                </body>
                </html>
            `;
        }

        // Write the HTML content to the file
        await fs.promises.writeFile(docPath, existingHtml, 'utf8');
        await fs.promises.writeFile(hashFilePath, JSON.stringify({ hash: newHash }), 'utf8');

        // console.log(`Documentation updated at ${docPath}`);
    } catch (error) {
        console.error(`Error generating documentation: ${error.message}`);
        process.exit(1);
    }
}

generateDoc();
