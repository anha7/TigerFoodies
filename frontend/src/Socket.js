import { io } from 'socket.io-client';

const socket = io(
    process.env.NODE_ENV === "production"
      ? "https://tigerfoodies.com"
      : "http://localhost:5000"
);

export default socket;