const express = require('express');
const cors = require('cors');
const path = require('path'); // Required to work with file paths
const { connectToDB } = require('./conf/db');
const lessonRoutes = require('./routes/lessonRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const PORT = 3000;

//  Middleware
app.use(cors({ origin: 'http://localhost:5173' })); // Restrict CORS to the frontend's origin
app.use(express.json()); // Parses incoming JSON requests

// Serve static files from the "static" folder
app.use('/static', express.static(path.join(__dirname, 'static')));

// Logger middleware
app.use((req, res, next) => {
    console.log(`${req.method} request to ${req.url}`);
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        console.log('Request Body:', req.body); // Log body for relevant methods
    }
    next();
});

// Routes
app.use('/lessons', lessonRoutes);
app.use('/orders', orderRoutes);

// Start server and connect to MongoDB
connectToDB().then(() => {
    app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
});
