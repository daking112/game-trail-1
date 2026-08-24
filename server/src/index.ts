import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { ClientToServerEvents, ServerToClientEvents } from "@monsterfall/shared";
import { createRepository } from "./database";
import { registerSocketHandlers } from "./network/socketHandlers";

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.get("/health", (_req, res) => res.json({ status: "ok" }));

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: CLIENT_ORIGIN },
});

const repository = createRepository();
registerSocketHandlers(io, repository);

httpServer.listen(PORT, () => {
  console.log(`[server] Monsterfall server listening on port ${PORT}`);
});
