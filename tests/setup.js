import orchestrator from "./orchestrator.js";

export default async () => {
  await orchestrator.waitForAllServices();
};
