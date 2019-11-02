const { spawn, spawnSync, execSync } = require('child_process');
const {assert} = require('chai');
const config = require('./config');
require('jest');

// kill old dynamondb service
function killLocalDynamodbService() {
    const pid = execSync('lsof -nP -iTCP:8000 |grep LISTEN|awk \'{print $2;}\'');
    if (pid.toString() !== '') {
        execSync(`kill -9 ${pid.toString()}`);
    }
}

const {tables} = require('../config/dynamodb');
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

/***
 * clear dynamondb all table data
 *
 */
async function clearDynamondb() {
    // connect to local DB if running offline
    const options = {
        region: 'localhost',
        endpoint: 'http://localhost:8000',
        accessKeyId: 'DEFAULT_ACCESS_KEY',  // needed if you don't have aws credentials at all in env
        secretAccessKey: 'DEFAULT_SECRET' // needed if you don't have aws credentials at all in env
    };

    const dynamodb = new AWS.DynamoDB.DocumentClient(options);

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

function startSlsOffline() {
    return new Promise((resolve, reject) => {
        killLocalDynamodbService();

        const slsEnv = Object.create(process.env);
        slsEnv.JWT_PRIVATE_KEY = config.JWT_PRIVATE_KEY;
        slsEnv.JWT_PUBLIC_KEY = config.JWT_PUBLIC_KEY;
        slsEnv.NODE_ENV = 'test';

        const slsOfflineProcess = spawn("sls", ["offline", "start", '--config', 'serverless.yaml'], {env: slsEnv});

        console.log(`Serverless: Offline started with PID : ${slsOfflineProcess.pid}`);

        slsOfflineProcess.stdout.on('data', async (data) => {
            if (data.includes("Offline [HTTP] listening on")) {
                console.log(data.toString().trim());

                await clearDynamondb();
                resolve(slsOfflineProcess);
            }
        });

        slsOfflineProcess.stderr.on('data', (errData) => {
            console.log(`Error starting Serverless Offline:\n${errData}`);
            reject(errData);
        });
    })
}

module.exports = async () =>  {
    const slsOfflineProcess = await startSlsOffline();
    global.slsPid = slsOfflineProcess.pid;
    return {slsOfflineProcess};
};
