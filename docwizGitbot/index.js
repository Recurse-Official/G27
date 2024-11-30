const {main} = require('./model');
module.exports = (app) => {

  app.on("push", async (context) => {
    const { repository, pusher, head_commit } = context.payload;
    const message = `New commit pushed by ${pusher.name}: ${head_commit.message}`;

    app.log.info(`Push detected: ${message}`);

    const filePath = "routes"; 
    try {
      const fileList = await context.octokit.repos.getContent({
        owner: repository.owner.login,
        repo: repository.name,
        path: filePath,
      });

      for (const file of fileList.data) {

        if (file.type === "file") {
          const fileContent = await context.octokit.repos.getContent({
            owner: repository.owner.login,
            repo: repository.name,
            path: file.path,
          });

          const content = Buffer.from(fileContent.data.content, "base64").toString("utf8");

          const response = await main(content);
          context.log.info(`Response from OpenAI: ${response}`);
        }
      }
    } catch (error) {
      context.log.error(error)
    }
  })
};