#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { processFiles } = require('./read.js');

function generateHtml(allDocs) {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Documentation</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0 2rem;
            background-color: #f4f7f6;
            color: #333;
        }
        h1, h2 {
            color: #333;
        }
        h1 {
            font-size: 2.5rem;
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 0.5rem;
            margin-top: 2rem;
        }
        h2 {
            font-size: 1.8rem;
            color: #4CAF50;
            margin-top: 1.5rem;
            padding-bottom: 0.25rem;
            border-bottom: 1px solid #4CAF50;
        }
        .file-section {
            margin-bottom: 2rem;
        }
        .route-section {
            margin-bottom: 2rem;
        }
        .code {
            background-color: #2e2e2e;
            color: #f8f8f2;
            padding: 1rem;
            border-radius: 4px;
            font-family: 'Courier New', Courier, monospace;
            overflow-x: auto;
            margin-bottom: 1rem;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .description, .method {
            font-weight: bold;
        }
        .method {
            color: #4CAF50;
        }
        .route {
            font-weight: bold;
            color: #3a7f56;
        }
        .error {
            color: #d9534f;
            font-weight: bold;
        }
        .content-container {
            max-width: 1200px;
            margin: auto;
        }
    </style>
</head>
<body>
    <div class="content-container">
        <h1>API Documentation</h1>
        ${allDocs
            .map(({ file, documentation }) => {
                try {
                    const jsonString = documentation.replace(/^```json\n|\n```$/g, '').trim();
                    const parsedJson = JSON.parse(jsonString);  // Parse the cleaned JSON string
                    console.log(parsedJson);

                    return `
                        <div class="file-section">
                            <h1>${file}</h1>
                            ${parsedJson.endpoints
                                .map((endpoint) => `
                                    <div class="route-section">
                                        <h2 class="route">${endpoint.route} <span class="method">(${endpoint.method})</span></h2>
                                        <pre class="code">${JSON.stringify(
                                            {
                                                description: endpoint.description,
                                                'body/params': `${JSON.stringify(endpoint['body/params'], null, 4)}`,
                                                response_type: endpoint.response_type,
                                                sample_response: endpoint.sample_response,
                                            },
                                            null,
                                            4
                                        )}</pre>
                                    </div>
                                `)
                                .join('')}
                        </div>
                    `;
                } catch (error) {
                    return `<div class="file-section"><h1>${file}</h1><p class="error">Error parsing documentation: ${error.message}</p></div>`;
                }
            })
            .join('')}
    </div>
</body>
</html>`;
    return htmlContent;
}

async function generateDoc() {
    const configPath = path.resolve(process.cwd(), 'docwiz.config.js');
    try {
        const allDocs = await processFiles(configPath);

        if (allDocs.length === 0) {
            console.log('No documentation generated. No files were processed.');
            return;
        }

        const outputPath = path.resolve(process.cwd(), 'doc.html');
        const htmlContent = generateHtml(allDocs);

        await fs.promises.writeFile(outputPath, htmlContent, 'utf8');
        console.log(`Documentation generated at ${outputPath}`);
    } catch (error) {
        console.error(`Error generating documentation: ${error.message}`);
        process.exit(1);
    }
}

generateDoc();
