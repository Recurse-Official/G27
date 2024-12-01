const { extractDocs } = require("./model");
const { createSingleCommit } = require("./createSingleCommit");
const { inst } = require("./installationEvent");
module.exports = (app) => {
  app.on("installation", async (context) => {
    await inst(context);
  });

  app.on("push", async (context) => {
    let htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Documentation</title>

    <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      margin: 20px;
    }
    h1 {
      text-align: center;
      color: #333;
    }
    h2 {
      color: #555;
    }
    pre {
      background: #f4f4f4;
      padding: 10px;
      border: 1px solid #ddd;
      overflow-x: auto;
    }
    .route {
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <h1>API Documentation</h1>
  <p>Generated documentation for all routes:</p>
`;

    try {
      const { repository, pusher, head_commit, ref } = context.payload;
      if (pusher.name === "DocBot") {
        app.log.info("Skipping processing for bot's own commit.");
        return;
      }
      if (head_commit.message.includes("[DocBot-Skip]")) {
        app.log.info(
          "Skipping processing for commit marked with [DocBot-Skip]."
        );
        return;
      }

      const configFile = await context.octokit.repos.getContent({
        owner: repository.owner.login,
        repo: repository.name,
        path: "docwiz.config.json",
      });
      app.log.info("docwiz.config.json fetched successfully.");
      const configContent = Buffer.from(
        configFile.data.content,
        "base64"
      ).toString("utf8");
      const config = JSON.parse(configContent);
      app.log.info(`Configuration: ${JSON.stringify(config)}`);
      app.log.info(`Payload: ${JSON.stringify(context.payload, null, 2)}`);
      app.log.info(`Repository Owner: ${repository.owner.login}`);
      app.log.info(`Repository Name: ${repository.name}`);
      const branch = ref.split("/").pop();
      const message = `New commit pushed by ${pusher.name}: ${head_commit.message}`;

      const { routesFolder } = config;
      const changedFiles = [
        ...head_commit.modified,
        ...head_commit.added,
        ...head_commit.removed,
      ];
      const relevantChanges = changedFiles.filter((filePath) =>
        filePath.startsWith(routesFolder)
      );
      if (relevantChanges.length === 0) {
        app.log.info(
          "No changes detected in the routes folder. Skipping documentation generation."
        );
        return;
      }

      app.log.info(
        `Changes detected in routes folder: ${relevantChanges.join(", ")}`
      );

      app.log.info(`Push detected: ${message}`);
      const allDocs = [];

      app.log.info(`Fetching files from the folder: ${config.routesFolder}...`);
      const fileList = await context.octokit.repos.getContent({
        owner: repository.owner.login,
        repo: repository.name,
        path: config.routesFolder,
      });
      app.log.info(`Files fetched from ${config.routesFolder}.`);
      for (const file of fileList.data) {
        app.log.info(`Processing file: ${file.path}`);
        if (file.type === "file") {
          const fileContent = await context.octokit.repos.getContent({
            owner: repository.owner.login,
            repo: repository.name,
            path: file.path,
          });

          const content = Buffer.from(
            fileContent.data.content,
            "base64"
          ).toString("utf8");
          const response = await extractDocs(content);

          const formattedResponse = response.replace(/\\n/g, "\n");

          allDocs.push({
            file: file.path,
            documentation: formattedResponse,
          });
          htmlContent += `
          <div class="route">
            <h2>${file.path}</h2>
            <pre>${formattedResponse}</pre>
          </div>
      `;
        }
      }
      htmlContent += `
      </body>
      </html>`;

      const resSingleCommit = await createSingleCommit(
        repository,
        branch,
        config.outputFolder,
        allDocs,
        htmlContent,
        context,
        true
      );

      if (resSingleCommit.success) {
        app.log.info("Single commit created successfully.");
      } else {
        app.log.error("Error creating single commit.");
      }
    } catch (error) {
      app.log.error(error);
    }
  });
};
