# Twitter-like API Documentation

## Overview

This file (`index.js`) serves as the main entry point for a Twitter-like API built with Node.js, Express, and MongoDB. It provides endpoints for user authentication, tweet management, and real-time updates using WebSockets. The API is designed to work with a React frontend, which is served in production mode.

## Dependencies

- express: Web application framework
- mongoose: MongoDB object modeling tool
- cors: Cross-Origin Resource Sharing middleware
- helmet: Security middleware
- express-rate-limit: Rate limiting middleware
- jsonwebtoken: JSON Web Token implementation
- bcrypt: Password hashing library
- ws: WebSocket library
- dotenv: Environment variable management

## Database Models

### User Schema
- username: String (unique, required)
- password: String (required)
- email: String (unique, required)
- followers: Array of User ObjectIds
- following: Array of User ObjectIds

### Tweet Schema
- content: String (required)
- author: User ObjectId (required)
- likes: Array of User ObjectIds
- retweets: Array of User ObjectIds
- createdAt: Date (default: current date)

## Middleware

### authenticateToken(req, res, next)
Middleware to authenticate JWT tokens.

**Parameters:**
- req: Express request object
- res: Express response object
- next: Express next function

**Usage:**
```javascript
app.get('/protected-route', authenticateToken, (req, res) => {
  // Protected route logic
});
```

## API Endpoints

### POST /api/signup
Create a new user account.

**Request body:**
- username: String
- password: String
- email: String

**Response:**
- 201: User created
- 500: Error message

### POST /api/login
Authenticate a user and return a JWT.

**Request body:**
- username: String
- password: String

**Response:**
- 200: { token: JWT }
- 400: Cannot find user
- 500: Error message

### POST /api/tweets
Create a new tweet (authenticated).

**Request body:**
- content: String

**Response:**
- 201: Created tweet object
- 500: Error message

### GET /api/tweets
Retrieve recent tweets (authenticated).

**Response:**
- 200: Array of tweet objects
- 500: Error message

### PUT /api/tweets/:id
Update a tweet (authenticated).

**Request body:**
- content: String

**Response:**
- 200: Updated tweet object
- 404: Tweet not found
- 500: Error message

### DELETE /api/tweets/:id
Delete a tweet (authenticated).

**Response:**
- 200: "Tweet deleted"
- 404: Tweet not found
- 500: Error message

### POST /api/tweets/:id/like
Toggle like on a tweet (authenticated).

**Response:**
- 200: Updated tweet object
- 404: Tweet not found
- 500: Error message

### POST /api/tweets/:id/retweet
Toggle retweet on a tweet (authenticated).

**Response:**
- 200: Updated tweet object
- 404: Tweet not found
- 500: Error message

### POST /api/users/:id/follow
Toggle follow status for a user (authenticated).

**Response:**
- 200: "Follow status updated"
- 404: User not found
- 500: Error message

### GET /api/users/:id
Retrieve user information (authenticated).

**Response:**
- 200: User object (excluding password)
- 404: User not found
- 500: Error message

## WebSocket Server

The WebSocket server is set up to broadcast messages to all connected clients except the sender.

**Event: 'connection'**
Triggered when a new WebSocket connection is established.

**Event: 'message'**
Triggered when a message is received from a client. The message is then broadcast to all other connected clients.

## Production Configuration

In production mode, the server serves the React frontend from the `react/build` directory and handles all routes to support client-side routing.

## Usage

1. Set up environment variables in a `.env` file:
   - MONGODB_URI: MongoDB connection string
   - JWT_SECRET: Secret key for JWT signing
   - PORT: (Optional) Port number for the server

2. Install dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   node index.js
   ```

The server will start on the specified PORT or default to 5000.

## Project Structure

- `index.js`: Main server file (this file)
- `package.json`: Node.js project configuration
- `react/`: Frontend React application
  - `App.js`: Main React component
  - `index.js`: React entry point
  - `package.json`: React project configuration

This file (`index.js`) serves as the backend for the React frontend, providing API endpoints and WebSocket functionality for real-time updates.