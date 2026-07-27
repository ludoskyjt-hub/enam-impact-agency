import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appOpsRouter } from "./routes/ops/routers";
import { createOpsContext } from "./routes/ops/context";
import { registerOpsWebAuthnRoutes } from "./routes/ops/webauthn";


const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

app.use(
  "/api/ops/trpc",
  createExpressMiddleware({
    router: appOpsRouter,
    createContext: createOpsContext,
    onError({ error, path, type, input }) {
      logger.error(
        {
          path,
          type,
          input,
          errMessage: error.message,
          errCode: error.code,
          cause: error.cause instanceof Error
            ? { message: error.cause.message, name: error.cause.name, stack: error.cause.stack }
            : error.cause,
          stack: error.stack,
        },
        "trpc ops error"
      );
    },
  })
);

registerOpsWebAuthnRoutes(app);

export default app;
