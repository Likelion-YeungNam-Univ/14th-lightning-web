const { Octokit } = require("@octokit/rest");
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function reviewPullRequest() {
  const { GITHUB_TOKEN, GEMINI_API_KEY, GITHUB_REPOSITORY, GITHUB_EVENT_PATH } =
    process.env;

  if (!GITHUB_TOKEN || !GEMINI_API_KEY) {
    console.error("Missing required environment variables");
    process.exit(1);
  }

  try {
    // GitHub API 초기화
    const octokit = new Octokit({ auth: GITHUB_TOKEN });
    const [owner, repo] = GITHUB_REPOSITORY.split("/");

    // PR 정보 가져오기
    const event = require(GITHUB_EVENT_PATH);
    const prNumber = event.pull_request.number;
    const prTitle = event.pull_request.title;

    console.log(`Reviewing PR #${prNumber}: ${prTitle}`);

    // PR의 changed files 가져오기
    const { data: files } = await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber,
    });

    // TypeScript/JavaScript 파일만 필터링
    const codeFiles = files.filter((file) =>
      /\.(ts|tsx|js|jsx)$/.test(file.filename),
    );

    if (codeFiles.length === 0) {
      console.log("No TypeScript/JavaScript files found");
      return;
    }

    // 파일 내용 수집
    let allChanges = "";
    for (const file of codeFiles.slice(0, 5)) {
      // 최대 5개 파일로 제한
      const { data: fileContent } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: file.filename,
      });

      const content = Buffer.from(fileContent.content, "base64").toString();
      allChanges += `\n\n## File: ${file.filename}\n\`\`\`\n${content.substring(0, 2000)}\n\`\`\`\n`;
    }

    // Gemini로 코드 리뷰
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Please review the following code changes for a TypeScript/React project:

${allChanges}

Provide a concise code review focusing on:
1. Code quality and best practices
2. Potential bugs or issues
3. Performance concerns
4. Security issues (if any)

Keep the review to 500 characters max.`;

    const result = await model.generateContent(prompt);
    const reviewText = result.response.text();

    // PR에 코멘트 달기
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: `## 🤖 Gemini AI Code Review\n\n${reviewText}\n\n---\n*Automated code review by Gemini*`,
    });

    console.log("Code review completed successfully");
  } catch (error) {
    console.error("Error during code review:", error.message);
    process.exit(1);
  }
}

reviewPullRequest();
