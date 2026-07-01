import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const MAX_FILE_LINES = 600;
const MAX_FUNCTION_LINES = 120;
const SOURCE_ROOTS = ["packages", "apps"];
const IGNORED_DIRECTORIES = new Set(["node_modules", "dist"]);
const CONTROL_KEYWORDS = new Set(["if", "for", "while", "switch", "catch", "function"]);

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
        if (IGNORED_DIRECTORIES.has(entry.name)) {
          return [];
        }

        return collectTypeScriptFiles(entryPath);
      }

      if (
        entry.isFile() &&
        entryPath.includes(`${path.sep}src${path.sep}`) &&
        entryPath.endsWith(".ts")
      ) {
        return [entryPath];
      }

      return [];
    }),
  );

  return files.flat();
}

function stripLineNoise(line) {
  return line.replace(/\/\/.*$/u, "").replace(/(['"`])(?:\\.|(?!\1).)*\1/gu, '""');
}

function findCandidateStart(line) {
  const functionMatch = line.match(/\bfunction\s+([A-Za-z_$][\w$]*)?(?:\s*<[^>{}]*>)?\s*\(/u);

  if (functionMatch) {
    return {
      name: functionMatch[1] ?? "<anonymous>",
      kind: "function",
    };
  }

  const arrowMatch = line.match(
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:(?:<[^>{}]+>\s*)?\(|[A-Za-z_$][\w$]*\s*=>)/u,
  );

  if (arrowMatch) {
    return {
      name: arrowMatch[1],
      kind: "arrow",
    };
  }

  const methodMatch = line.match(
    /^(\s+)(?:public|private|protected|static|async|\s)*([A-Za-z_$][\w$]*)(?:\s*<[^>{}]*>)?\s*\(/u,
  );

  if (methodMatch && !CONTROL_KEYWORDS.has(methodMatch[2])) {
    return {
      name: methodMatch[2],
      kind: "method",
    };
  }

  return null;
}

function signatureHasBody(signature, candidate) {
  const name = candidate.name.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");

  if (candidate.kind === "function") {
    return new RegExp(
      `\\bfunction\\s+${name === "<anonymous>" ? "" : name}(?:\\s*<[^>{}]*>)?\\s*\\([\\s\\S]*?\\)\\s*(?::[^{}]+)?\\{`,
      "u",
    ).test(signature);
  }

  if (candidate.kind === "arrow") {
    return new RegExp(
      `\\b(?:const|let|var)\\s+${name}\\s*=\\s*(?:async\\s*)?(?:<[^>{}]+>\\s*)?(?:\\([\\s\\S]*?\\)|[A-Za-z_$][\\w$]*)\\s*(?::[^=]+)?=>\\s*\\{`,
      "u",
    ).test(signature);
  }

  return new RegExp(
    `^\\s*(?:public|private|protected|static|async|\\s)*${name}(?:\\s*<[^>{}]*>)?\\s*\\([\\s\\S]*?\\)\\s*(?::[^{}]+)?\\{`,
    "u",
  ).test(signature);
}

function signatureCannotHaveBody(signature, candidate) {
  if (signatureHasBody(signature, candidate)) {
    return false;
  }

  if (candidate.kind === "method" && /^\s*[A-Za-z_$][\w$]*\s*\([\s\S]*=>/u.test(signature)) {
    return true;
  }

  if (candidate.kind === "method" && signature.includes(";")) {
    return true;
  }

  if (candidate.kind === "arrow" && signature.includes(";") && !signature.includes("=>")) {
    return true;
  }

  return signature.split("\n").length > 20;
}

function countBraceDelta(line) {
  const cleanLine = stripLineNoise(line);
  const opens = cleanLine.match(/\{/gu)?.length ?? 0;
  const closes = cleanLine.match(/\}/gu)?.length ?? 0;
  return opens - closes;
}

function reportCompletedFunctions(filePath, stack, currentLine) {
  while (stack.length > 0 && stack.at(-1).depth <= 0) {
    const entry = stack.pop();
    const lineCount = currentLine - entry.startLine + 1;

    if (lineCount > MAX_FUNCTION_LINES) {
      violations.push(
        `${filePath}:${entry.startLine} 函数 ${entry.name} 超过 ${MAX_FUNCTION_LINES} 行，当前 ${lineCount} 行`,
      );
    }
  }
}

function checkFunctionSizes(filePath, lines) {
  const stack = [];
  let pending = null;

  lines.forEach((line, index) => {
    const cleanLine = stripLineNoise(line);
    const braceDelta = countBraceDelta(cleanLine);

    stack.forEach((entry) => {
      entry.depth += braceDelta;
    });

    if (pending) {
      pending.signature += `\n${cleanLine}`;
      pending.depth += braceDelta;
    } else {
      const candidate = findCandidateStart(cleanLine);

      if (candidate) {
        pending = {
          ...candidate,
          startLine: index + 1,
          signature: cleanLine,
          depth: braceDelta,
        };
      }
    }

    if (pending && signatureHasBody(pending.signature, pending)) {
      stack.push({
        name: pending.name,
        startLine: pending.startLine,
        depth: pending.depth,
      });
      pending = null;
    } else if (pending && signatureCannotHaveBody(pending.signature, pending)) {
      pending = null;
    }

    reportCompletedFunctions(filePath, stack, index + 1);
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
