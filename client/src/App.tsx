import { useSocket } from "../hooks/useSocket";
import Message from "../shared/ui/Message";

// Словарь для текстовых подписей
const statusLabels = {
  connected: "Онлайн",
  connecting: "Подключение...",
  disconnected: "Отключено",
  error: "Ошибка сети",
};

function App() {
  const { messages, status } = useSocket();

  return (
    <main className="main">
      <div className="container">
        <div className="message-history">
          <div className="message-history__header">
            <p>История сообщений</p>
            <div className={`server-status server-status--${status}`}>
              <div className="server-status__indicator"></div>
              <p className="server-status__text">
                {statusLabels[status] || "Неизвестно"}
              </p>
            </div>
          </div>
          <div className="message-bg">
            {messages.map((msg, index) => (
              <Message key={index} message={msg} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;
