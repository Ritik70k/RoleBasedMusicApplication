# Rhythm — Music Streaming Platform

Rhythm is a full-stack music streaming platform built with React and Node.js. It provides separate experiences for listeners and artists, allowing users to discover and play music while artists can upload songs and organize them into albums.

## Features

### User Features

* User registration and login
* User and Artist role-based access
* Browse available music
* Search music by title or artist
* Play and pause songs
* Previous and next track controls
* Audio progress control
* View artist information with songs
* Logout functionality

### Artist Features

* Artist registration and authentication
* Artist dashboard
* Upload music files
* Add song titles
* Create albums from uploaded songs
* View uploaded music
* Search songs and artists
* Built-in music player
* View created albums

### Backend Features

* JWT-based authentication
* Password hashing with bcrypt
* Role-based authorization
* HTTP-only cookie-based authentication flow
* MongoDB database integration
* Music and album data management
* Audio file upload using Multer
* Cloud-based music storage using ImageKit
* REST API

## Tech Stack

### Frontend

* React
* Vite
* React Router
* Axios
* CSS

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT
* bcryptjs
* Multer
* ImageKit
* CORS
* Cookie Parser

## Application Architecture

```text
                    ┌─────────────────────┐
                    │       React         │
                    │      Frontend       │
                    └──────────┬──────────┘
                               │
                               │ REST API
                               ↓
                    ┌─────────────────────┐
                    │      Express.js     │
                    │       Backend       │
                    └───────┬─────┬───────┘
                            │     │
                  ┌─────────┘     └──────────┐
                  ↓                          ↓
          ┌───────────────┐          ┌───────────────┐
          │    MongoDB    │          │    ImageKit   │
          │               │          │               │
          │ Users         │          │ Audio Files   │
          │ Music         │          │ Cloud Storage │
          │ Albums        │          │               │
          └───────────────┘          └───────────────┘
```

## User Roles

### User

A normal user can:

* Register and log in
* Browse music
* Search songs
* Play music
* Control playback
* Log out

### Artist

An artist has all authentication functionality and can additionally:

* Upload songs
* Create albums
* Select songs for an album
* Manage their music catalogue

## Project Structure

```text
MusicApp/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── album.controller.js
│   │   │   ├── auth.controller.js
│   │   │   └── music.controller.js
│   │   ├── db/
│   │   │   └── db.js
│   │   ├── middlewares/
│   │   │   └── auth.middleware.js
│   │   ├── models/
│   │   │   ├── album.model.js
│   │   │   ├── music.model.js
│   │   │   └── user.model.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   └── music.routes.js
│   │   ├── services/
│   │   │   └── storage.service.js
│   │   └── app.js
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── artistPages/
│   │   │   │   └── ArtistDashboard.jsx
│   │   │   ├── userPages/
│   │   │   │   └── UserDashboard.jsx
│   │   │   ├── LoginForm.jsx
│   │   │   └── Register.jsx
│   │   ├── styles/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

## API Endpoints

### Authentication

| Method | Endpoint             | Description                              |
| ------ | -------------------- | ---------------------------------------- |
| POST   | `/api/auth/register` | Register a new user                      |
| POST   | `/api/auth/login`    | Log in a user                            |
| POST   | `/api/auth/logout`   | Log out the current user                 |
| GET    | `/api/auth/me`       | Get the authenticated user's information |

### Music

| Method | Endpoint                     | Description          |
| ------ | ---------------------------- | -------------------- |
| GET    | `/api/music`                 | Get available music  |
| POST   | `/api/music/upload`          | Upload a new song    |
| POST   | `/api/music/album`           | Create an album      |
| GET    | `/api/music/albums`          | Get all albums       |
| GET    | `/api/music/albums/:albumId` | Get a specific album |

## Authentication

Rhythm uses JWT for authentication.

When a user registers or logs in:

```text
User
 ↓
Express API
 ↓
Password verification / hashing
 ↓
JWT generation
 ↓
Authentication cookie
```

Protected routes use the authentication middleware to verify the JWT and determine whether the user is authorized as a `user` or `artist`.

## Music Upload Flow

Artists can upload audio files through the Artist Dashboard.

```text
Artist
 ↓
Select audio file
 ↓
React FormData
 ↓
Multer memory storage
 ↓
Express Backend
 ↓
ImageKit
 ↓
Music URL
 ↓
MongoDB
 ↓
Music available for playback
```

The audio file itself is stored through ImageKit, while MongoDB stores the song metadata and its remote URL.

## Database Models

### User

Stores:

* Username
* Email
* Hashed password
* Role

Supported roles:

```text
user
artist
```

### Music

Stores:

* Song title
* Audio URL
* Artist reference

### Album

Stores:

* Album title
* Artist reference
* References to songs included in the album

## Installation

### Clone the Repository

```bash
git clone <your-repository-url>
cd MusicApp
```

## Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` directory:

```env
DB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
```

Start the development server:

```bash
npm run dev
```

The backend runs on:

```text
http://localhost:3000
```

## Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on:

```text
http://localhost:5173
```

## Environment Variables

The backend requires the following environment variables:

```env
DB_URI=
JWT_SECRET=
IMAGEKIT_PRIVATE_KEY=
```


## Development Flow

Start both servers:

```text
Terminal 1
──────────
cd backend
npm run dev

Terminal 2
──────────
cd frontend
npm run dev
```

Then open:

```text
http://localhost:5173
```

## Future Improvements

* Playlist creation and management
* Like/favorite songs
* Recently played music
* Artist-specific music management
* Album detail pages
* Music recommendations
* Pagination for large music libraries
* Improved responsive design
* Production API environment configuration
* Better error handling and validation
* Audio queue management
* User profile management

## License

This project is developed for educational and portfolio purposes.
