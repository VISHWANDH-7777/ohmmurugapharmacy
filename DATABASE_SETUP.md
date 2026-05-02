# Database Setup Guide - MongoDB

## Overview
This application uses MongoDB with Mongoose ODM and a Node.js/Express backend to manage user data for customers, admins, and owners with image upload, user ID, and password authentication.

## Database Structure

### Collections

#### users
Main user collection for all user types:
- `_id` - Unique user identifier (custom string)
- `name` - User's full name
- `email` - Email address (unique)
- `password` - Hashed password (SHA-256)
- `role` - User role: 'customer', 'admin', or 'owner'
- `avatar` - User avatar/profile image (base64 or URL)
- `phone` - Phone number
- `address` - User's address
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp

#### customers
Extended data for customer accounts:
- `_id` - Customer record ID
- `user_id` - Reference to user ID
- `loyalty_points` - Accumulated loyalty points
- `order_count` - Total orders placed
- `total_spent` - Total amount spent

#### admins
Extended data for admin accounts:
- `_id` - Admin record ID
- `user_id` - Reference to user ID
- `permissions` - Admin permissions (JSON)
- `department` - Department name

#### owners
Extended data for owner accounts:
- `_id` - Owner record ID
- `user_id` - Reference to user ID
- `business_name` - Business name
- `business_license` - License number
- `company_registration` - Registration number

## Prerequisites

### 1. MongoDB Installation
Make sure MongoDB is installed and running on your system:

**Windows:**
```bash
# MongoDB Community Server - Download from https://www.mongodb.com/try/download/community
# Or install via Chocolatey
choco install mongodb-community
```

**macOS:**
```bash
brew install mongodb-community
brew services start mongodb-community
```

**Linux (Ubuntu):**
```bash
sudo apt-get install -y mongodb
sudo systemctl start mongod
```

### 2. Verify MongoDB is Running
```bash
# Check if MongoDB is running on default port 27017
mongosh
# or
mongo
```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create or update `.env` file:
```env
MONGODB_URI=mongodb://localhost:27017/design_project
PORT=5000
NODE_ENV=development
```

### 3. Run Backend Server
```bash
npm run server
```
The server will start on `http://localhost:5000`

### 4. Run Frontend (in another terminal)
```bash
npm run dev
```
The frontend will run on `http://localhost:3000`

### 5. Run Both Together
```bash
npm run dev:all
```
This runs the server and frontend concurrently.

## API Endpoints

### Authentication

#### Register User
- **POST** `/api/auth/register`
- **Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepass123",
    "role": "customer",
    "avatar": "base64_image_data_or_url"
  }
  ```

#### Login User
- **POST** `/api/auth/login`
- **Body:**
  ```json
  {
    "email": "john@example.com",
    "password": "securepass123"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "user": {
      "id": "user_abc123",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer",
      "avatar": "..."
    },
    "token": "..."
  }
  ```

### User Management

#### Get All Users
- **GET** `/api/users`
- **Query Params:** `role` (optional: customer, admin, owner)
- **Response:** Array of users

#### Get User by ID
- **GET** `/api/users/:id`
- **Response:** Single user object

#### Update User
- **PUT** `/api/users/:id`
- **Body:** `{ name?, phone?, address?, avatar? }`
- **Response:** Updated user object

#### Delete User
- **DELETE** `/api/users/:id`
- **Response:** `{ success: true, message: "User deleted" }`

#### Search Users
- **GET** `/api/users/search/:query`
- **Response:** Array of matching users

### Customer Stats Management

#### Get Customer Stats
- **GET** `/api/customers/:userId/stats`
- **Response:**
  ```json
  {
    "success": true,
    "stats": {
      "user_id": "user_abc123",
      "loyalty_points": 150,
      "order_count": 5,
      "total_spent": 1250.50
    }
  }
  ```

#### Update Customer Stats
- **PUT** `/api/customers/:userId/stats`
- **Body:**
  ```json
  {
    "orderCount": 6,
    "totalSpent": 1500.00,
    "loyaltyPoints": 180
  }
  ```

## MongoDB Tools

### MongoDB Compass (GUI)
Download: https://www.mongodb.com/products/tools/compass
- Visual database management
- Query building
- Data exploration

### Mongosh (CLI)
```bash
# Connect to local MongoDB
mongosh

# View databases
show dbs

# Switch to design_project database
use design_project

# View collections
show collections

# Query users
db.users.find()

# Query with filter
db.users.find({ role: "customer" })
```

## Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Make sure MongoDB is running with `mongod` or your system's MongoDB service.

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:** Change PORT in `.env` or kill the process using that port.

### Duplicate Email Error
MongoDB automatically enforces the unique constraint on email. Make sure to handle this in your registration logic.

## Backup & Restore

### Backup Database
```bash
mongodump --db design_project --out ./backup
```

### Restore Database
```bash
mongorestore --db design_project ./backup/design_project
```

## Production Considerations

For production deployment, use:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/design_project
```

(Use MongoDB Atlas: https://www.mongodb.com/cloud/atlas)
    "user": {
      "id": "user_xyz",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer",
      "avatar": "..."
    },
    "token": "auth_token_xyz"
  }
  ```

### User Management

#### Get All Users
- **GET** `/api/users`
- **Query Params:** `role` (optional: 'customer', 'admin', 'owner')

#### Get User by ID
- **GET** `/api/users/:id`

#### Update User Profile
- **PUT** `/api/users/:id`
- **Body:** Any fields to update (name, phone, address, avatar)

#### Delete User
- **DELETE** `/api/users/:id`

#### Search Users
- **GET** `/api/users/search/:query`

### Customer Stats

#### Get Customer Stats
- **GET** `/api/customers/:userId/stats`

#### Update Customer Stats
- **PUT** `/api/customers/:userId/stats`
- **Body:**
  ```json
  {
    "orderCount": 5,
    "totalSpent": 1500.00,
    "loyaltyPoints": 150
  }
  ```

## Frontend Service Usage

Use the `databaseService.ts` file in your React components:

```typescript
import { registerUser, loginUser, getUserById, updateUserProfile } from './services/databaseService';

// Register a customer
const result = await registerUser(
  'John Doe',
  'john@example.com',
  'password123',
  'customer',
  'avatar_data'
);

// Login
const loginResult = await loginUser('john@example.com', 'password123');

// Get specific user
const user = await getUserById('user_xyz');

// Update profile
await updateUserProfile('user_xyz', {
  phone: '555-1234',
  address: '123 Main St'
});
```

## Database File Location
The SQLite database is created at: `users.db` in the project root directory.

## Security Notes
- Passwords are hashed using SHA-256
- Use HTTPS in production
- Store authentication tokens securely
- Implement proper validation on the backend
- Use environment variables for sensitive data

## Troubleshooting

### Server won't start
- Ensure port 5000 is not in use
- Check Node.js version (v16+)
- Run `npm install` again

### CORS errors
- Ensure the backend server is running on http://localhost:5000
- Check that the `API_BASE_URL` in databaseService.ts matches

### Database errors
- Delete `users.db` to reset the database
- Check file permissions in the project directory
- Ensure better-sqlite3 is installed correctly

## Example Usage Flows

### Customer Registration & Login Flow
1. User fills registration form
2. Call `registerUser()` with role='customer'
3. Database creates users + customers record
4. User receives auth token
5. Store token and user data in localStorage

### Admin Management Flow
1. Owner/Admin registers new admin with role='admin'
2. Admin can view all users, customers, manage orders
3. Admin permissions stored in admins table
4. Update customer stats after each order

