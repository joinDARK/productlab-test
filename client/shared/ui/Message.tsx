interface Props {
  message: string;
}

export default function Message({ message }: Props) {
  return (
    <div className="message">
      <p className="message__author">Рушан</p>
      <div className="message__text">{message}</div>
    </div>
  );
}
