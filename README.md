Overview

Ohm Muruga E-Pharmacy is a web-based application that allows users to search, view, and order medicines online. The platform is designed to simplify access to healthcare products by enabling prescription uploads, secure ordering, and efficient inventory management.

Features
User registration and login
Search and browse medicines
Add to cart and place orders
Upload prescriptions for verification
Order tracking
Admin panel for managing medicines, users, and orders
Technology Stack

Frontend

HTML
CSS
JavaScript

Backend

PHP / Node.js

Database

MySQL / MongoDB
Project Structure
ohm-muruga-epharmacy/
│
├── frontend/
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── assets/
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   └── server.js or index.php
│
├── database/
│   └── schema.sql
│
└── README.md
Installation and Setup
1. Clone the repository
git clone https://github.com/your-username/ohm-muruga-epharmacy.git
cd ohm-muruga-epharmacy
2. Setup frontend
cd frontend

Open index.html in a browser or run using a local server.

3. Setup backend

For Node.js:

cd backend
npm install
node server.js

For PHP:

Place the backend folder inside your server directory (e.g., htdocs for XAMPP)
Start Apache and MySQL
4. Setup database
Create a database in MySQL
Import the schema.sql file
Update database configuration in the backend
Environment Configuration

Create a .env file in the backend folder if using Node.js:

PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=epharmacy
JWT_SECRET=your_secret_key
Usage
Register or log in to the application
Search for medicines
Add products to the cart
Upload prescription if required
Place the order and track status
Future Improvements
Online doctor consultation
Mobile application support
Real-time delivery tracking
AI-based medicine suggestions
License

This project is licensed under the MIT License.

Contact

Ohm Muruga Pharmacy
Email: support@ohmmurugapharmacy.com

Phone: +91-XXXXXXXXXX
