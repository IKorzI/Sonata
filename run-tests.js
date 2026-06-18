import { execSync } from "child_process";

const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.split("=");
  if (key && value) {
    acc[key.trim()] = value.replace(/['"]/g, "").trim();
  }
  return acc;
}, {});

const fileName = args.fileName;
const testName = args.testName;

let command = "npx playwright test --workers=1";

if (fileName) {
  command += ` e2e/${fileName}`;
}

if (testName) {
  command += ` -g "${testName}"`;
}

console.log(`> Running command: ${command}\n`);

try {
  execSync(command, { stdio: "inherit" });
} catch (error) {
  process.exit(error.status || 1);
}
