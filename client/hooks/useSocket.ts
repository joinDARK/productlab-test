import { useEffect, useState, useCallback } from "react";
import { socket } from "../shared/lib/socket";

export type SocketStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export const useSocket = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [status, setStatus] = useState<SocketStatus>("disconnected");

  useEffect(() => {
    const handleConnect = () => {
      console.debug("Сокет подключён! ID:", socket.id);
      setStatus("connected");
    };

    const handleConnectError = (err: Error) => {
      console.error("Ошибка подключения:", err);
      setStatus("error");
    };

    const handleDisconnect = (reason: string) => {
      console.debug("Сокет отключён:", reason);
      setStatus(
        reason === "io server disconnect" ? "disconnected" : "connecting",
      );
    };

    const onMessage = (data: string) => {
      setMessages((prev) => [...prev, data]);
    };

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);
    socket.on("disconnect", handleDisconnect);
    socket.on("avito", onMessage);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
      socket.off("disconnect", handleDisconnect);
      socket.off("avito", onMessage);
    };
  }, []);

  return { messages, status };
};
