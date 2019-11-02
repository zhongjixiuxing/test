const ErrorCodes = require('../config/errCodes');
const logger = require('./logger');
const jwt = require('jsonwebtoken');

// init jwt cert
if (!process.env.JWT_PRIVATE_KEY) {
    throw new Error('JWT_PRIVATE_KEY not set');
}
if (!process.env.JWT_PUBLIC_KEY) {
    throw new Error('JWT_PUBLIC_KEY not set');
}
let buff = Buffer.from(process.env.JWT_PRIVATE_KEY, 'base64');
const JWT_PRIVATE_KEY = buff.toString('ascii');
buff = Buffer.from(process.env.JWT_PUBLIC_KEY, 'base64');
const JWT_PUBLIC_KEY = buff.toString('ascii');




function respJson(data = null, err = ErrorCodes.OK) {
    return {err, data};
}

function formatErr(err, msg) {
    return {err, msg};
}

function encodeJwt(data) {
    return jwt.sign(data, JWT_PRIVATE_KEY, {algorithm:'RS256'});
}

function decodeJwt(encryptString) {
    return jwt.verify(encryptString, JWT_PUBLIC_KEY, {algorithms: ['RS256'] });
}

function getUserByJwtToken(token) {

}

module.exports = {
    respJson,
    formatErr,
    decodeJwt,
    encodeJwt
};
