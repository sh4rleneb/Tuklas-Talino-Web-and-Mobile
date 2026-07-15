const { withGradleProperties } = require("expo/config-plugins");

function upsertGradleProperty(modResults, key, value) {
  const next = {
    type: "property",
    key,
    value: String(value),
  };

  const index = modResults.findIndex(
    (item) => item.type === "property" && item.key === key
  );

  if (index >= 0) {
    modResults[index] = next;
  } else {
    modResults.push(next);
  }
}

module.exports = function withGradleWorkers(config, props = {}) {
  const workersMax = String(
    props.workersMax || process.env.GRADLE_WORKERS_MAX || "4"
  );

  return withGradleProperties(config, (config) => {
    upsertGradleProperty(config.modResults, "org.gradle.workers.max", workersMax);
    upsertGradleProperty(config.modResults, "org.gradle.parallel", "true");
    upsertGradleProperty(config.modResults, "org.gradle.caching", "true");

    return config;
  });
};
