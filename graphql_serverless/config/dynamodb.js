const process = require('process');
const stage = process.env.NODE_ENV || 'dev';

module.exports = {
    tables: {
        user: {
            name: `User_${stage}`,
            hashKey: 'id'
        },
        list: {
            name: `List_${stage}`,
            hashKey: 'id'
        },
        task: {
            name: `Task_${stage}`,
            hashKey: 'id'
        }
    }
};
