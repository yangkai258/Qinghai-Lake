import { config as loadEnv } from "dotenv";
loadEnv();
import { evaluateAlerts } from "../alerts/evaluator.js";
const r = await evaluateAlerts();
console.log(JSON.stringify(r));
process.exit(r.errors.length > 0 ? 1 : 0);