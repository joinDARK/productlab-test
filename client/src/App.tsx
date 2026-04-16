import { useSocket } from "../hooks/useSocket";
import Message from "../shared/ui/Message";

function App() {
  const { messages } = useSocket();

  return (
    <main className="message-bg">
      {messages.map((msg, index) => (
        <Message key={index} message={msg} />
      ))}
    </main>
  );
}

export default App;
