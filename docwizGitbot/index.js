const { main } = require('./model');
const fs = require('fs');
const path = require('path');

module.exports = (app) => {
  app.on('push', async (context) => {
    const { repository, pusher, head_commit } = context.payload;
    const message = `New commit pushed by ${pusher.name}: ${head_commit.message}`;

    app.log.info(`Push detected: ${message}`);

    const filePath = 'routes';
    const allDocs = [];
    let markdownContent = `# API Documentation\n\nGenerated documentation for all routes:\n\n`;

    try {
      const fileList = await context.octokit.repos.getContent({
        owner: repository.owner.login,
        repo: repository.name,
        path: filePath,
      });

      for (const file of fileList.data) {
        if (file.type === 'file') {
          const fileContent = await context.octokit.repos.getContent({
            owner: repository.owner.login,
            repo: repository.name,
            path: file.path,
          });

          const content = Buffer.from(fileContent.data.content, 'base64').toString('utf8');
          const response = await main(content);

          const formattedResponse = response.replace(/\\n/g, '\n');
          
          allDocs.push({
            file: file.path,
            documentation: formattedResponse,
          });

          markdownContent += `## ${file.path}\n\n`;
          markdownContent += `\`\`\`json\n${formattedResponse}\n\`\`\`\n\n`;
        }
      }

      const docFilePath = `doc/routes_documentation.json`;
      const docBuffer = Buffer.from(JSON.stringify(allDocs, null, 2));

      await context.octokit.repos.createOrUpdateFileContents({
        owner: repository.owner.login,
        repo: repository.name,
        path: docFilePath,
        message: `Add combined documentation for all routes`,
        content: docBuffer.toString('base64'),
        committer: {
          name: 'DocBot',
          email: 'docbot@example.com',
        },
        author: {
          name: 'DocBot',
          email: 'docbot@example.com',
        },
      });

      const markdownFilePath = `doc/routes_documentation.md`;
      const markdownBuffer = Buffer.from(markdownContent);

      await context.octokit.repos.createOrUpdateFileContents({
        owner: repository.owner.login,
        repo: repository.name,
        path: markdownFilePath,
        message: `Add Markdown documentation for all routes`,
        content: markdownBuffer.toString('base64'),
        committer: {
          name: 'DocBot',
          email: 'docbot@example.com',
        },
        author: {
          name: 'DocBot',
          email: 'docbot@example.com',
        },
      });

      app.log.info(`Combined documentation pushed: ${docFilePath}`);
      app.log.info(`Markdown documentation pushed: ${markdownFilePath}`);
    } catch (error) {
      app.log.error(error);
    }
  });
};
