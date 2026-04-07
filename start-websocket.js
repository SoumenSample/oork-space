#!/usr/bin/env node

import server from './lib/websocket-server';

console.log('Starting Yjs WebSocket server...');
console.log('WebSocket server will be available at ws://localhost:1234');
console.log('HTTP endpoint available at http://localhost:1234');

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down WebSocket server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down WebSocket server...');
  process.exit(0);
});