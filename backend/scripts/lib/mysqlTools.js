const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

require("dotenv").config({ path: path.join(__dirname, "../../.env") });

// Runs the MySQL command-line tools (mysqldump, mysql, mysqlbinlog) with the
// connection settings from backend/.env. Set MYSQL_BIN if they aren't on PATH;
// on Windows the default MySQL 8.4 install folder is tried automatically.
const DEFAULT_WINDOWS_BIN = "C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin";

function toolPath(tool) {
  const dir = process.env.MYSQL_BIN || (process.platform === "win32" && fs.existsSync(DEFAULT_WINDOWS_BIN) ? DEFAULT_WINDOWS_BIN : "");
  const exe = process.platform === "win32" ? `${tool}.exe` : tool;
  return dir ? path.join(dir, exe) : exe;
}

function connectionArgs() {
  return [
    `--host=${process.env.DB_HOST || "localhost"}`,
    `--port=${Number(process.env.DB_PORT) || 3306}`,
    `--user=${process.env.DB_USER || "root"}`
  ];
}

// The password goes through MYSQL_PWD rather than argv, so it never shows up
// in process listings or shell history.
function toolEnv() {
  return { ...process.env, MYSQL_PWD: process.env.DB_PASSWORD || "" };
}

function spawnTool(tool, args) {
  return spawn(toolPath(tool), [...connectionArgs(), ...args], { env: toolEnv(), windowsHide: true });
}

function collectStderr(child) {
  let stderr = "";
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });
  return () => stderr.trim();
}

function waitFor(child, label, getStderr) {
  return new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${label} exited with code ${code}: ${getStderr()}`));
    });
  });
}

// tool args > outputFile
async function runToFile(tool, args, outputFile) {
  const child = spawnTool(tool, args);
  const stderr = collectStderr(child);
  child.stdout.pipe(fs.createWriteStream(outputFile));
  await waitFor(child, tool, stderr);
}

// tool args < inputFile
async function runFromFile(tool, args, inputFile) {
  const child = spawnTool(tool, args);
  const stderr = collectStderr(child);
  fs.createReadStream(inputFile).pipe(child.stdin);
  await waitFor(child, tool, stderr);
}

// fromTool fromArgs | toTool toArgs
async function pipeTools(fromTool, fromArgs, toTool, toArgs) {
  const from = spawnTool(fromTool, fromArgs);
  const to = spawnTool(toTool, toArgs);
  const fromErr = collectStderr(from);
  const toErr = collectStderr(to);
  from.stdout.pipe(to.stdin);
  await Promise.all([waitFor(from, fromTool, fromErr), waitFor(to, toTool, toErr)]);
}

module.exports = { toolPath, runToFile, runFromFile, pipeTools };
