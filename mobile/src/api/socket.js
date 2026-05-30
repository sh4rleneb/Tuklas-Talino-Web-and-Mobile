import { io } from 'socket.io-client';

const SOCKET_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') ||
  'http://47.129.233.4:4000';

export const socket = io(SOCKET_URL, {
  transports: ['websocket'],
  autoConnect: true,
});