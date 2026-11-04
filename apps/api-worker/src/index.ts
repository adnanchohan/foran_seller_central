import { createApp } from "./app.js";
import type { AppBindings } from "./types.js";

const app = createApp();

export default {
  fetch(request: Request, env: AppBindings, ctx: ExecutionContext): Response | Promise<Response> {
    return app.fetch(request, env, ctx);
  },
};
