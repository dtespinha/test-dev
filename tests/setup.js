import orchestrator from "./orchestrator.js";

const waitForAllServices = async () => {
  await orchestrator.waitForAllServices();
};

export default waitForAllServices;
