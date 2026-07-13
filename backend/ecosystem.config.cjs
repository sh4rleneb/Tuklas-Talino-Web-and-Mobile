const requestedInstances = process.env.PM2_INSTANCES || "2";

const instances =
  requestedInstances === "max"
    ? "max"
    : Number.parseInt(requestedInstances, 10);

if (
  instances !== "max" &&
  (!Number.isInteger(instances) || instances < 1)
) {
  throw new Error(
    `Invalid PM2_INSTANCES="${requestedInstances}". Use a positive integer or "max".`
  );
}

module.exports = {
  apps: [
    {
      name: "tuklas-backend",
      cwd: "/srv/development/Tuklas-Talino-Web-and-Mobile/backend",
      script: "./src/server.js",

      exec_mode: "cluster",
      instances,

      autorestart: true,
      watch: false,
      max_memory_restart: "500M",

      time: true,
      merge_logs: true,

      kill_timeout: 10000,
      listen_timeout: 10000,

      env: {
        NODE_ENV: "development"
      },

      env_production: {
        NODE_ENV: "production"
      }
    }
  ]
};
