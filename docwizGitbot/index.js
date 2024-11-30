const { extractDocs } = require("./model");
const { createSingleCommit } = require("./createSingleCommit");

module.exports = (app) => {
  app.on("push", async (context) => {
    const { repository, pusher, head_commit, ref } = context.payload;
    if (pusher.name === "DocBot") {
      app.log.info("Skipping processing for bot's own commit.");
      return;
    }
    if (head_commit.message.includes("[DocBot-Skip]")) {
      app.log.info("Skipping processing for commit marked with [DocBot-Skip].");
      return;
    }
    // app.log.info(`New commit pushed by ${pusher.name}: ${head_commit.message}`);
    app.log.info(`Payload: ${JSON.stringify(context.payload, null, 2)}`);
    app.log.info(`Repository Owner: ${repository.owner.login}`);
    app.log.info(`Repository Name: ${repository.name}`);
    // app.log.info(`Branch Reference: ${branch}`);
    const branch = ref.split("/").pop();
    const message = `New commit pushed by ${pusher.name}: ${head_commit.message}`;

    app.log.info(`Push detected: ${message}`);
    const allDocs = [];
    let markdownContent = `# API Documentation\n\nGenerated documentation for all routes:\n\n`;

    try {
      const configFile = await context.octokit.repos.getContent({
        owner: repository.owner.login,
        repo: repository.name,
        path: "docwizConfig.json",
      });
      app.log.info("docwizConfig.json fetched successfully.");
      const configContent = Buffer.from(
        configFile.data.content,
        "base64"
      ).toString("utf8");
      const config = JSON.parse(configContent);
      app.log.info("Configuration parsed successfully:", config);
      app.log.info(`Configuration: ${JSON.stringify(config)}`);
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

          markdownContent += `## ${file.path}\n\n`;
          markdownContent += `\`\`\`json\n${formattedResponse}\n\`\`\`\n\n`;
        }
      }

      const resSingleCommit = await createSingleCommit(
        repository,
        branch,
        config.outputFolder,
        allDocs,
        markdownContent,
        context
      );

      if(resSingleCommit.success) {
        app.log.info("Single commit created successfully.");
      } else {
        app.log.error("Error creating single commit.");
      }
    } catch (error) {
      app.log.error(error);
    }
  });
};
