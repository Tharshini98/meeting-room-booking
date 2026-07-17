const express = require("express");
const roomRoutes = require('./routes/rooms');
const bookingRoutes = require('./routes/bookings');
const reportRoutes = require('./routes/reports');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

function createApp(){
    const app = express();
    app.use(express.json());

    app.get('/health', (req,res) => res.status(200).json({status: 'ok'}));

    app.use('/rooms', roomRoutes);
    app.use('/bookings', bookingRoutes);
    app.use('/reports', reportRoutes);

    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
}

module.exports = createApp;