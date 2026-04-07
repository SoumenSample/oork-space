# Real-time Collaboration with Yjs

This guide explains how to use the real-time collaboration features implemented in the ooakspace application using Yjs.

## Overview

The application now supports real-time collaborative editing of tables using Yjs, a CRDT-based framework for building collaborative applications.

## Components

### 1. YjsProvider (`components/YjsProvider.tsx`)
- Wraps components that need collaborative features
- Manages connection to WebSocket server
- Synchronizes data between clients using Yjs

### 2. Collaborative Table (`components/TableView.tsx`)
- Replaces the static TableView with a real-time collaborative version
- Allows multiple users to edit the same table simultaneously
- Changes are propagated instantly to all connected clients

### 3. WebSocket Server (`lib/websocket-server.ts`)
- Simple WebSocket server for broadcasting Yjs updates
- Runs on port 1234 by default

## How It Works

1. When a user opens a table page, the `YjsProvider` connects to the WebSocket server
2. The provider creates a Yjs document and binds it to the table data
3. Local changes are sent to the WebSocket server
4. The server broadcasts changes to all connected clients
5. Each client applies the changes to their local Yjs document
6. UI updates automatically through React state synchronization

## Features

- **Real-time cursor awareness** (planned enhancement)
- **Conflict-free updates** using CRDTs
- **Offline support** (changes sync when back online)
- **Preserves user intent** even with concurrent edits
- **Fine-grained updates** (cell-level changes)

## Usage

### For Developers

1. Start the WebSocket server:
   ```bash
   node lib/start-websocket.ts
   # or
   npm run websocket
   ```

2. The TableView component automatically uses Yjs when wrapped with YjsProvider

### Adding Collaboration to Other Components

1. Wrap your component with YjsProvider:
   ```tsx
   <YjsProvider roomName="unique-room-name">
     <YourComponent />
   </YjsProvider>
   ```

2. Use the `useYjsTable` hook to access collaborative data:
   ```tsx
   const { yjsInitialized, properties, rows, addRow, updateRow, deleteRow } = useYjsTable('your-room-name');
   ```

## WebSocket Server Setup

The WebSocket server runs on `ws://localhost:1234` by default. To change the port:

1. Set the PORT environment variable:
   ```bash
   PORT=8080 node lib/start-websocket.ts
   ```

2. Or modify the default port in `lib/websocket-server.ts`

## Data Structure

The collaborative table stores data in two Yjs arrays:
- `properties`: Array of column definitions
- `rows`: Array of row data (each row is an array of cell values)

## Limitations & Future Improvements

### Current Limitations:
- No user presence/awareness (cursors, selections)
- Limited to table data structure
- No persistence layer (data lost when server restarts)

### Planned Enhancements:
1. Add user presence with Yjs awareness
2. Integrate with database for persistence
3. Extend to other component types (kanban, calendar, etc.)
4. Add offline-first capabilities with IndexedDB
5. Implement role-based permissions

## Troubleshooting

### Connection Issues:
- Ensure WebSocket server is running
- Check firewall settings for port 1234
- Verify CORS settings if using different domains

### Data Not Syncing:
- Check browser console for WebSocket errors
- Verify all clients are connected to same room name
- Ensure Yjs provider is properly initialized

## Example Usage

See `app/(workspace)/table/page.tsx` for a complete example of a collaborative table page.

## License

MIT License - feel free to modify and extend for your needs.