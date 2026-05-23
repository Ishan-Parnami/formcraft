import "dotenv/config";
import http from "node:http";
import { app as expressApplication } from "./server";
import { env } from "./env";

async function init() {
  try {
    const server = http.createServer(expressApplication);
    const PORT = parseInt(env.PORT ?? "3001", 10);
    server.listen(PORT, () => {
      console.log(`[formforge] API server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Error starting server:", err);
    process.exit(1);
  }
}

init();
