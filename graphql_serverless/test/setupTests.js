const {tables} = require('../config/dynamodb');
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

// connect to local DB if running offline
const options = {
    region: 'localhost',
    endpoint: 'http://localhost:8000',
    accessKeyId: 'DEFAULT_ACCESS_KEY',  // needed if you don't have aws credentials at all in env
    secretAccessKey: 'DEFAULT_SECRET' // needed if you don't have aws credentials at all in env
};

const dynamodb = new AWS.DynamoDB.DocumentClient(options);

/***
 * clear dynamondb all table data
 *
 */
async function clearDynamondb() {
    const names = Object.keys(tables);
    for (let i=0; i<names.length; i++) {
        const scanResult = await dynamodb.scan({TableName: tables[names[i]].name}).promise();
        if (!scanResult.Items || scanResult.Items.length === 0) {
            continue;
        }

        for (let k=0; k<scanResult.Items.length; k++) {
            await dynamodb.delete({TableName: tables[names[i]].name, Key: {
                    [tables[names[i]].hashKey]: scanResult.Items[k][tables[names[i]].hashKey]
                }}).promise();
        }
    }
}

afterEach(async (done) => {
    await clearDynamondb();
    done();
});
