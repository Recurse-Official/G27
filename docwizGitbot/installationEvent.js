async function inst(context) {
  const installationId = context.payload.installation.id;
  const { data } = await context.octokit.apps.listReposAccessibleToInstallation(
    {
      installation_id: installationId,
    }
  );
  for (const repo of data.repositories) {
    console.log(repo);
    const owner = repo.owner.login;
    const repoName = repo.name;

    console.log(`Creating config.js in repository: ${owner}/${repoName}`);

    try {
      const configContent = `{
      "entryFile" : "index.js",
      "routesFolder" : "routes",
      "outputFolder" : "docwizOutput"
      }`;
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
            path: "docwiz.config.json",
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

      return { success: true, message: "Config file created successfully." };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
module.exports = { inst };
