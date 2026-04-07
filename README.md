# OoakSpace - Collaborative Workspace Platform

A modern, real-time collaborative workspace platform built with Next.js, React, and Yjs.

## Features

### 🔐 Authentication
- Email/password signup with OTP verification
- Google OAuth integration
- Forgot password & reset password flows
- Admin bypass for `kayalabhi04@gmail.com` / `admin1234`
- JWT-based session management

### 👥 Real-time Collaboration
- **Yjs-powered CRDTs** for conflict-free collaboration
- Real-time table editing with multiple users
- WebSocket server for low-latency synchronization
- Automatic conflict resolution

### 📊 Workspace Tools
- Interactive tables with drag & drop
- Kanban boards
- Calendar views
- Task management
- File uploads
- Formula columns
- Charts & visualizations

### 🎨 UI/UX
- Modern, responsive design
- Dark/light mode support
- Intuitive navigation
- Customizable workspaces
- Mobile-friendly interface

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB instance
- Gmail account (for email notifications)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` with your configuration:
   ```env
   # Database
   MONGODB_URI="your_mongodb_connection_string"

   # JWT Secret
   JWT_SECRET="your_jwt_secret_here"

   # Email Configuration (for OTP emails)
   EMAIL_USER="your_email@gmail.com"
   EMAIL_PASS="your_gmail_app_password"

   # NextAuth Configuration
   NEXTAUTH_SECRET="your_nextauth_secret"
   NEXTAUTH_URL="http://localhost:3000"

   # Google OAuth (optional)
   GOOGLE_CLIENT_ID="your_google_client_id"
   GOOGLE_CLIENT_SECRET="your_google_client_secret"
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Start the WebSocket server for real-time collaboration:
   ```bash
   npm run websocket
   ```

### Features in Detail

#### Authentication
- Secure signup with email verification OTP
- Social login via Google
- Password reset flows
- Admin account with bypass verification

#### Real-time Collaboration
Powered by [Yjs](https://yjs.dev/), the platform offers:
- Conflict-free replicated data types (CRDTs)
- Operational transforms for smooth collaboration
- Network resilience with automatic reconnection
- Fine-grained updates (cell-level changes)

#### Workspace Modules
- **Tables**: Spreadsheet-like data management with formulas
- **Kanban Boards**: Agile project management
- **Calendars**: Date-based scheduling and timeline views
- **Tasks**: To-do lists with assignments and priorities
- **Files**: Document upload and management
- **Automation**: Workflow automation and integrations

## Architecture

### Frontend
- Next.js 13+ with App Router
- React 18 with hooks
- TypeScript for type safety
- TailwindCSS for styling
- Headless UI for accessible components

### Backend
- Node.js API routes
- MongoDB with Mongoose ODM
- JWT authentication
- WebSocket server for real-time sync

### Real-time Sync
- Yjs for CRDT-based collaboration
- WebSocket protocol for low-latency messaging
- Room-based collaboration (one room per document)
- Automatic conflict resolution

## API Routes

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Password reset initiation
- `POST /api/auth/reset-password` - Password reset completion
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `GET /api/auth/[...nextauth]` - NextAuth OAuth handlers

### Data Operations
- Various RESTful API endpoints for workspace entities
- WebSocket-based real-time updates for collaborative features

## Development

### Available Scripts
- `npm run dev` - Start Next.js development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run websocket` - Start WebSocket server for collaboration

### Environment Variables
See `.env.example` for required variables.

## Real-time Collaboration Guide

See [COLLABORATION_GUIDE.md](COLLABORATION_GUIDE.md) for detailed information on:
- How Yjs integration works
- WebSocket server setup
- Adding collaboration to new components
- Data structures and limitations
- Troubleshooting tips

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Yjs](https://yjs.dev/) for the CRDT framework
- [Next.js](https://nextjs.org/) for the React framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [MongoDB](https://www.mongodb.com/) for the database
- All open-source contributors
