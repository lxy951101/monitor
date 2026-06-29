import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const MAX_FILE_LINES = 600;
const MAX_FUNCTION_LINES = 120;
const SOURCE_ROOTS = ["packages", "apps"];

const violations = [];

async function pathExists(entryPath) {
  try {
    await readdir(entryPath);
    return true;
  } catch {
    return false;
  }
}

async function collectTypeScriptFiles(root) {
  if (!(await pathExists(root))) {
    return [];
  }

  const entries = await readdir(root, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(root, entry.name);

      if (entry.isDirectory()) {
        return collectTypeScriptFiles(entryPath);
      }

      if (entry.isFile() && entryPath.includes(`${path.sep}src${path.sep}`) && entryPath.endsWith(".ts")) {
        return [entryPath];
      }

      return [];
    })
  );

  return files.flat();
}

function stripLineNoise(line) {
  return line
    .replace(/\/\/.*$/u, "")
    .replace(/(['"`])(?:\\.|(?!\1).)*\1/gu, "\"\"");
}

function findFunctionStart(line) {
  const cleanLine = stripLineNoise(line);
  const functionMatch = cleanLine.match(/\bfunction\s+([A-Za-z_$][\w$]*)?\s*\([^)]*\)\s*(?::[^{]+)?\{/u);

  if (functionMatch) {
    return functionMatch[1] ?? "<anonymous>";
  }

  const arrowMatch = cleanLine.match(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*(?::[^=]+)?=>\s*\{/u);

  if (arrowMatch) {
    return arrowMatch[1];
  }

  const methodMatch = cleanLine.match(/^\s*(?:public|private|protected|static|async|\s)*([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*(?::[^{]+)?\{/u);

  if (methodMatch && !["if", "for", "while", "switch", "catch", "function"].includes(methodMatch[1])) {
    return methodMatch[1];
  }

  return null;
}

function countBraceDelta(line) {
  const cleanLine = stripLineNoise(line);
  const opens = cleanLine.match(/\{/gu)?.length ?? 0;
  const closes = cleanLine.match(/\}/gu)?.length ?? 0;
  return opens - closes;
}

function checkFunctionSizes(filePath, lines) {
  const stack = [];

  lines.forEach((line, index) => {
    const functionName = findFunctionStart(line);
    const braceDelta = countBraceDelta(line);

    stack.forEach((entry) => {
      entry.depth += braceDelta;
    });

    if (functionName) {
      stack.push({
        name: functionName,
        startLine: index + 1,
        depth: braceDelta
      });
    }

    while (stack.length > 0 && stack.at(-1).depth <= 0) {
      const entry = stack.pop();
      const lineCount = index + 1 - entry.startLine + 1;

      if (lineCount > MAX_FUNCTION_LINES) {
        violations.push(`${filePath}:${entry.startLine} 函数 ${entry.name} 超过 ${MAX_FUNCTION_LINES} 行，当前 ${lineCount} 行`);
      }
    }
  });
}

async function checkFile(filePath) {
  const content = await readFile(filePath, "utf8");
  const lines = content.split(/\r?\n/u);
  const normalizedLineCount = lines.at(-1) === "" ? lines.length - 1 : lines.length;

  if (normalizedLineCount > MAX_FILE_LINES) {
    violations.push(`${filePath}:1 文件超过 ${MAX_FILE_LINES} 行，当前 ${normalizedLineCount} 行`);
  }

  checkFunctionSizes(filePath, lines);
}

const sourceFiles = (
  await Promise.all(SOURCE_ROOTS.map((root) => collectTypeScriptFiles(root)))
).flat();

await Promise.all(sourceFiles.map((filePath) => checkFile(filePath)));

if (violations.length > 0) {
  console.error("代码尺寸检查失败：");
  violations.forEach((message) => console.error(`- ${message}`));
  process.exitCode = 1;
} else {
  console.log(`代码尺寸检查通过：已检查 ${sourceFiles.length} 个 TypeScript 源文件。`);
}
