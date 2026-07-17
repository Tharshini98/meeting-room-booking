const reportService = require('../services/reportService');
const {validateUtilizationQuery} = require('../utils/validators');

async function roomUtilization(req, res) {
    const{from, to} = validateUtilizationQuery(req.query);
    const report = await reportsService.getRoomUtilization({from, to});
    res.status(200).json(report);
}

module.exports = {roomUtilization};