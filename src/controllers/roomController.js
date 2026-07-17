const roomService = require('../services/roomService');
const{validateCreateRoomInput, validateListRoomsQuery} = require('../utils/validators');
 async function createRoom(req, res) {
    validateCreateRoomInput(req.body);
    const room = await roomService.createRoom(req.body);
    res.status(201).json(room);
 }

 async function listRooms(req, res) {
    const filters = validateListRoomsQuery(req.query);
    const rooms = await roomService.listRooms(filters);
    res.status(200).json(rooms);

 }

 module.exports = {createRoom, listRooms};