import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

// Create HTTP server
const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Yjs WebSocket Server\n');
});

// Create WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket, req: any) => {
  console.log('Client connected');
  
  ws.on('message', (message: any) => {
    // Broadcast to all clients
    wss.clients.forEach((client: WebSocket) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
  
  ws.on('error', (error: any) => {
    console.error('WebSocket error:', error);
  });
});

const PORT = process.env.PORT || 1234;
server.listen(PORT, () => {
  console.log(`HTTP/WebSocket server listening on port ${PORT}`);
});

export default server;