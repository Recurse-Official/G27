async function createSingleCommit(repository, branch, outputFolder, allDocs, markdownContent, context) {
  try {
    const commitMessage = "Add documentation files in a single commit [DocBot-Skip]";
    const owner = repository.owner.login;
    const repo = repository.name;
    const baseRef = await context.octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${branch}`,
      });
    const baseSha = baseRef.data.object.sha;
    const docFilePath = `${outputFolder}/documentation.json`;
    const docBuffer = Buffer.from(JSON.stringify(allDocs, null, 2));
    const docBlob = await context.octokit.git.createBlob({
      owner,
      repo : repository.name,
      content: docBuffer.toString("base64"),
      encoding: "base64",
    });
    const markdownFilePath = `${outputFolder}/documentation.md`;
    const markdownBuffer = Buffer.from(markdownContent);
    const markdownBlob = await context.octokit.git.createBlob({
      owner,
      repo ,
      content: markdownBuffer.toString("base64"),
      encoding: "base64",
    });
    const tree = await context.octokit.git.createTree({
      owner,
      repo ,
      base_tree: baseSha,
      tree: [
        {
          path: docFilePath,
          mode: "100644",
          type: "blob",
          sha: docBlob.data.sha,
        },
        {
          path: markdownFilePath,
          mode: "100644",
          type: "blob",
          sha: markdownBlob.data.sha,
        },
      ],
    });
    const commit = await context.octokit.git.createCommit({
      owner,
      repo,
      message: commitMessage,
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
      repo,
      ref: `heads/${branch}`,
      sha: commit.data.sha,
    });
    return { success: true, message: "Successfully created a single commit" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to create a single commit" };
  }
}

module.exports = { createSingleCommit };
