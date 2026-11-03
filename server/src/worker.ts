/// <reference path="../../worker-configuration.d.ts" />

import { httpServerHandler } from 'cloudflare:node';
import { env as cloudflareEnvironment } from 'cloudflare:workers';
import { app } from './app.js';
import { configureRuntimeBindings } from './config/runtimeBindings.js';

interface WorkerEnvironment {
  ASSETS: Fetcher;
  DB: D1Database;
  DOCUMENTS_BUCKET: R2Bucket;
}

const expressPort = 3000;
const environment = cloudflareEnvironment as unknown as WorkerEnvironment;
configureRuntimeBindings({
  database: environment.DB,
  documentsBucket: environment.DOCUMENTS_BUCKET,
});
app.listen(expressPort);
const expressHandler = httpServerHandler({ port: expressPort });
export default expressHandler;
