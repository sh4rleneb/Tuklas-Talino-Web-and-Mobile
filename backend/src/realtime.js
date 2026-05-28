let ioInstance = null;

export function setRealtime(io) {
  ioInstance = io;
}

export function emitRealtime(room, event, payload) {
  if (!ioInstance) return;
  ioInstance.to(room).emit(event, payload);
}