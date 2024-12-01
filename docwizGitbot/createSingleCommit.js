async function createSingleCommit(repository, branch, outputFolder, allDocs, htmlContent, context, isHtml) {
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

    const htmlFilePath = `${outputFolder}/documentation.html`;
    const htmlBuffer = Buffer.from(htmlContent);
    const htmlBlob = await context.octokit.git.createBlob({
      owner,
      repo,
      content: htmlBuffer.toString("base64"),
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
          path: htmlFilePath,
          mode: "100644",
          type: "blob",
          sha: htmlBlob.data.sha,
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
        email: "pvrkmsbunny@gmail.com",
      },
      author: {
        name: "DocBot",
        email: "pvrkmsbunny@gmail.com",
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
