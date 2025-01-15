import { io } from 'socket.io-client';

// Remplacez l'URL par celle de votre serveur
const socket = io('http://localhost:3001');

export { socket };
