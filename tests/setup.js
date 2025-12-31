import orchestrator from "./orchestrator.js";

module.exports = async () => {
  await orchestrator.waitForAllServices();
};
