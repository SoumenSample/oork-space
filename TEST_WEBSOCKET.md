# Testing the WebSocket Server

## Manual Test

1. Start the WebSocket server:
   ```bash
   npm run websocket
   ```

2. In another terminal, test with a WebSocket client:
   ```bash
   # Install ws if not already installed
   npm install ws
   
   # Create a simple test client
   echo "
   const WebSocket = require('ws');
   
   const ws = new WebSocket('ws://localhost:1234/test-room');
   
   ws.on('open', function open() {
     console.log('Connected to server');
     ws.send(JSON.stringify({type: 'test', data: 'Hello from client'}));
   });
   
   ws.on('message', function message(data) {
     console.log('Received:', data);
   });
   
   ws.on('close', function close() {
     console.log('Disconnected from server');
   });
   " > test-client.js
   
   # Run the test
   node test-client.js
   ```

## Expected Output

Terminal 1 (WebSocket server):
```
Starting Yjs WebSocket server...
WebSocket server will be available at ws://localhost:1234
HTTP endpoint available at http://localhost:1234
Client connected
```

Terminal 2 (Test client):
```
Connected to server
Received: {"type":"test","data":"Hello from client"}
```

## Testing with Yjs

To test the full Yjs integration:

1. Start both servers:
   ```bash
   # Terminal 1
   npm run dev
   
   # Terminal 2
   npm run websocket
   ```

2. Open two browser windows to `/table` page
3. Edit the table in one window - changes should appear in the other window in real-time
4. Try editing the same cell from both windows - Yjs will merge the changes automatically

## Troubleshooting

If you see connection errors:
- Verify the WebSocket server is running on port 1234
- Check that your firewall allows connections to port 1234
- Make sure you're connecting to the correct URL (`ws://localhost:1234/your-room-name`)
- Check browser console for WebSocket connection errors

## Production Deployment

For production, you'll want to:
1. Use a proper WebSocket server like Socket.IO or a managed service
2. Add authentication to WebSocket connections
3. Implement persistence (save Yjs state to database)
4. Add monitoring and logging
5. Use HTTPS/WSS for secure connections