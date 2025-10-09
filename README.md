# Sustainable Construction MVP Backend

A comprehensive backend API for managing sustainable construction projects with AI-powered features for material estimation, cost prediction, and sustainability scoring.

## Features

- 📊 **Dashboard**: Project overview, analytics, weather integration, sustainability metrics
- 📦 **Material Management**: Inventory tracking, usage logs, waste monitoring, AI-based estimation
- ✅ **Task Management**: Task assignment, progress tracking, photo documentation, time logging
- 💰 **Finance Management**: Budget tracking, expense logging, AI cost prediction
- 📄 **Document Management**: File storage, image-to-text extraction, automated task generation

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Databases**: MongoDB (main), Firebase (user data)
- **AI Services**: Google Gemini API
- **Workflow Engine**: n8n (document processing)
- **External APIs**: OpenWeather API

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd uee-backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
# Copy the template
copy env.template .env      # Windows
cp env.template .env        # Mac/Linux

# Edit .env and fill in your API keys
```

**Minimum Required:**
- MongoDB URI (local: `mongodb://localhost:27017/sustainable-construction`)
- Gemini API Key (get from https://makersuite.google.com/app/apikey)
- OpenWeather API Key (get from https://openweathermap.org/api)
- n8n webhook is already configured ✅

**Optional for MVP:**
- Firebase credentials (can skip for testing)

4. Start the server:
```bash
# Development mode (recommended)
npm run dev

# Production mode
npm start
```

5. Verify it's running:
```bash
curl http://localhost:5000/health
```

## Environment Variables

See `.env.example` for required configuration:
- MongoDB connection string
- Firebase credentials
- Google Gemini API key
- OpenWeather API key
- n8n webhook URL

## API Documentation

Detailed API documentation is available in the `/docs` folder.

### Quick Start Endpoints

- **Health Check**: `GET /health`
- **Dashboard**: `GET /api/dashboard/overview`
- **Materials**: `GET /api/materials`
- **Tasks**: `GET /api/tasks`
- **Budget**: `GET /api/budget`
- **Documents**: `GET /api/documents`

## Project Structure

```
uee-backend/
├── src/
│   ├── config/          # Database and Firebase configuration
│   ├── models/          # MongoDB schemas
│   ├── controllers/     # Request handlers
│   ├── routes/          # API routes
│   ├── middleware/      # Authentication, validation, error handling
│   ├── services/        # Business logic (AI, n8n, weather)
│   └── utils/           # Helper functions
├── docs/                # API documentation
├── uploads/             # File uploads (auto-created)
├── .env.example         # Environment template
├── package.json
└── server.js            # Application entry point
```

## Development

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with hot reload
- `npm test` - Run tests (to be implemented)

## License

ISC

