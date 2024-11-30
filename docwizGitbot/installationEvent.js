async function inst(context) {
  const installationId = context.payload.installation.id;
  const repositories = context.payload.repositories;

  for (const repo of repositories) {
    const owner = repo.owner.login;
    const repoName = repo.name;

    app.log.info(`Creating config.js in repository: ${owner}/${repoName}`);

    try {
      const configContent = `module.exports = {
      "routesFolder" : "routes",
      "outputFolder" : "docwizOutput"
      };`;
      const blob = await context.octokit.git.createBlob({
        owner,
        repo: repoName,
        content: Buffer.from(configContent).toString("base64"),
        encoding: "base64",
      });

      const ref = await context.octokit.git.getRef({
        owner,
        repo: repoName,
        ref: "heads/main",
      });
      const baseSha = ref.data.object.sha;
      const tree = await context.octokit.git.createTree({
        owner,
        repo: repoName,
        base_tree: baseSha,
        tree: [
          {
            path: "config.js",
            mode: "100644",
            type: "blob",
            sha: blob.data.sha,
          },
        ],
      });
      const commit = await context.octokit.git.createCommit({
        owner,
        repo: repoName,
        message: "Add default config.js file [DocBot-Skip]",
        tree: tree.data.sha,
        parents: [baseSha],
        committer: {
          name: "DocBot",
          email: "docbot@example.com",
        },
        author: {
          name: "DocBot",
          email: "docbot@example.com",
        },
      });
      await context.octokit.git.updateRef({
        owner,
        repo: repoName,
        ref: "heads/main",
        sha: commit.data.sha,
      });

      app.log.info(`config.js created successfully in ${owner}/${repoName}`);
    } catch (error) {
      app.log.error(
        `Error creating config.js in ${owner}/${repoName}: ${error.message}`
      );
    }
  }
}
module.exports = { inst };
