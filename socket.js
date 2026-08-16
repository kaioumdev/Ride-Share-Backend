const socketIo = require('socket.io');
const userModel = require('./models/user.model');
const captainModel = require('./models/captain.model');

let io;

function initializeSocket(server) {
    io = socketIo(server, {
        cors: {
            origin: [
                'https://ride-share-frontend-zeta.vercel.app',
                'http://localhost:5173',
                'http://localhost:4173',
            ],
            methods: [ 'GET', 'POST' ],
            credentials: true,
        },
        // Allow both websocket and polling so local dev still works,
        // but the frontend forces websocket-only transport in production.
        transports: [ 'websocket', 'polling' ],
    });

    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);


        socket.on('join', async (data) => {
            const { userId, userType } = data;

            if (userType === 'user') {
                await userModel.findByIdAndUpdate(userId, { socketId: socket.id });
            } else if (userType === 'captain') {
                await captainModel.findByIdAndUpdate(userId, { socketId: socket.id });
            }
        });


        socket.on('update-location-captain', async (data) => {
            const { userId, location } = data;

            if (!location || !location.ltd || !location.lng) {
                return socket.emit('error', { message: 'Invalid location data' });
            }

            await captainModel.findByIdAndUpdate(userId, {
                location: {
                    ltd: location.ltd,
                    lng: location.lng
                }
            });

            // Broadcast captain's live location to the user during an active ride
            const captain = await captainModel.findById(userId);
            if (captain && captain.currentRideUserId) {
                const user = await userModel.findById(captain.currentRideUserId);
                if (user && user.socketId) {
                    io.to(user.socketId).emit('captain-location-update', {
                        ltd: location.ltd,
                        lng: location.lng
                    });
                }
            }
        });

        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });
}

const sendMessageToSocketId = (socketId, messageObject) => {

console.log(messageObject);

    if (io) {
        io.to(socketId).emit(messageObject.event, messageObject.data);
    } else {
        console.log('Socket.io not initialized.');
    }
}

module.exports = { initializeSocket, sendMessageToSocketId };