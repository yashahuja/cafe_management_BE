require('dotenv').config();
const dbConfig = require('../config');

const getAuthToken = (req, res, next) => {
    if (
      req.headers.authorization &&
      req.headers.authorization.split(' ')[0] === 'bearer'
    ) {
      req.authToken = req.headers.authorization.split(' ')[1];
    } else {
      req.authToken = null;
    }
    next();
};
  
  
function checkIfAuthenticated(req, res, next) {
    getAuthToken(req, res, async () => {
        try {
        const { authToken } = req;
        const userInfo = await dbConfig.admin
            .auth()
            .verifyIdToken(authToken);
        req.authId = userInfo.uid;
        return next();
        } catch (e) {
        return res
            .status(401)
            .send({ error: 'You are not authorized to make this request' });
        }
    });
}

module.exports = { checkIfAuthenticated: checkIfAuthenticated }