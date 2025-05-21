# Video Streaming Platform Backend

This project is a complex backend project that is built with nodejs, expressjs, mongodb, mongoose, jwt, bcrypt, and many more. This project is a complete backend project that has all the features that a backend project should have using best practices to make a production grade application.

Built a complete video hosting website similar to youtube with all the features like login, signup, upload video, like, dislike, comment, reply, subscribe, unsubscribe, and many more

## 🚀 Features

- **User Management**
  - Registration with avatar and cover image upload
  - Login with JWT authentication 
  - Access and refresh tokens
  - Password management
  - Profile updates (avatar, cover image, account details)

- **Media Management**
  - Upload videos and images to Cloudinary
  - Automatic removal of previous media when updating profiles
  - Efficient file storage and retrieval

- **Social Features**
  - User subscription system
  - Channel profiles
  - Playlists and Watch history tracking
  - Tweets, Likes and Comments

## 🛠️ Technologies Used

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Cloudinary** - Media storage and management
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Multer** - File upload handling

## 📋 API Endpoints
you can get all of the API endpoints through this postman link:

https://parv-7345831.postman.co/workspace/Parv's-Workspace~fabb5948-3b81-40a9-8822-7316a3b01be6/collection/44884643-d4d3c77c-ad53-4739-a10d-030b55781ba8?action=share&creator=44884643

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or above)
- MongoDB
- Cloudinary account

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/youtube-backend-clone.git
cd youtube-backend-clone
```
2. install dependencies
```bash
npm  install 
```
3. create `.env` file with the following variables

```
PORT=8000
MONGODB_URI=your_mongodb_connection_string
CORS_ORIGIN=*
ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

4. Start the server
```bash
npm run dev
```



