import { useEffect, useState } from "react";
import { socket } from "../shared/lib/socket";

export const useSocket = () => {
  const [messages, setMessages] = useState<Array<string>>([]);

  useEffect(() => {
    const onMessage = (data: string) => {
      setMessages([...messages, data]);
    };

    socket.on("connect", () => {
      console.log("Сокет подключён! ID:", socket.id);
    });

    socket.on("avito", onMessage);
    socket.on("connect_error", (err) => {
      console.error("Ошибка подключения:", err);
    });

    return () => {
      socket.off("avito", onMessage);
      socket.off("connect_error");
    };
  }, [messages]);

  const sendMessage = (text: string) => {
    socket.emit("message", text);
  };

  return { sendMessage, messages };
};
