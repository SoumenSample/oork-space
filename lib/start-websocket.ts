import server from './websocket-server';

console.log('Starting Yjs WebSocket server...');
console.log('WebSocket server will be available at ws://localhost:1234');
console.log('HTTP endpoint available at http://localhost:1234');

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down WebSocket server...');
  server.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\nShutting down WebSocket server...');
  server.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});