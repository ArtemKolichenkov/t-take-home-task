import validator from "validator";

export const requiredEnvVars = ["HOST", "PORT", "DB_URL", "CORS"];

const checkEnvironment = (): boolean => {
  let envOk = true;
  for (const varName of requiredEnvVars) {
    if (!(varName in process.env) || process.env[varName] === undefined) {
      console.info(`Env variable ${varName} must be set\n`);
      envOk = false;
    }
  }
  if (
    process.env.HOST &&
    !validator.isIP(process.env.HOST) &&
    process.env.HOST !== "localhost"
  ) {
    console.info("Env variable HOST must be a valid IP address");
    envOk = false;
  }
  if (process.env.PORT && !validator.isPort(process.env.PORT)) {
    console.info("Env variable PORT must be a valid port number");
    envOk = false;
  }
  return envOk;
};

export default checkEnvironment;
