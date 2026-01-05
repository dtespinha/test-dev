const { spawn } = require("child_process");

const main = spawn("npm", ["run", "dev:main"], {
  stdio: "inherit",
  shell: true,
});

function cleanup() {
  const stop = spawn("npm", ["run", "postdev"], {
    stdio: "inherit",
    shell: true,
  });
  stop.on("exit", () => process.exit());
}

main.on("exit", () => {
  cleanup();
});

process.on("SIGINT", () => {
  main.kill("SIGINT");
  cleanup();
});
