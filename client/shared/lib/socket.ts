import { io, Socket } from "socket.io-client";

const URL = "http://localhost:3002/events";

export const socket: Socket = io(URL, {
  autoConnect: true,
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
  timeout: 20000,
});
