const { spawn, spawnSync, execSync } = require('child_process');
const {assert} = require('chai');
const config = require('./config');

let slsOfflineProcess;

const {tables} = require('../config/dynamodb');

const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

let options = {};

// connect to local DB if running offline
options = {
    region: 'localhost',
    endpoint: 'http://localhost:8000',
    accessKeyId: 'DEFAULT_ACCESS_KEY',  // needed if you don't have aws credentials at all in env
    secretAccessKey: 'DEFAULT_SECRET' // needed if you don't have aws credentials at all in env
};

const dynamodb = new AWS.DynamoDB.DocumentClient(options);


// common graphql error codes
const GraphqlErrors = {
    BAD_USER_INPUT: 'BAD_USER_INPUT',
    UNAUTHENTICATED: 'UNAUTHENTICATED',
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR'
};

// kill old dynamondb service
function killLocalDynamodbService() {
    const pid = execSync('lsof -nP -iTCP:8000 |grep LISTEN|awk \'{print $2;}\'');
    if (pid.toString() !== '') {
        execSync(`kill -9 ${pid.toString()}`);
    }
}

function startSlsOffline(done) {
    if (slsOfflineProcess) {
        return done();
    }

    killLocalDynamodbService();

    const slsEnv = Object.create(process.env);
    slsEnv.JWT_PRIVATE_KEY = config.JWT_PRIVATE_KEY;
    slsEnv.JWT_PUBLIC_KEY = config.JWT_PUBLIC_KEY;

    slsOfflineProcess = spawn("sls", ["offline", "start", '--config', 'serverless.yaml'], {env: slsEnv});

    console.log(`Serverless: Offline started with PID : ${slsOfflineProcess.pid}`);

    slsOfflineProcess.stdout.on('data', (data) => {
        if (data.includes("Offline [HTTP] listening on")) {
            console.log(data.toString().trim());
            done();
        }
    });

    slsOfflineProcess.stderr.on('data', (errData) => {
        console.log(`Error starting Serverless Offline:\n${errData}`);
        done(errData);
    });

    return slsOfflineProcess;
}

function stopSlsOffline(slsOfflineProcess) {
    slsOfflineProcess.kill(); // 这个有延迟，导致下个test case不能正常启动serverless
    killLocalDynamodbService();

    console.log("Serverless Offline stopped");
}

/**
 * check graphql success response body
 *
 * @param body graphql response body
 */
function checkResp(body) {
    assert.containsAllKeys(body, ['data']);
}

/**
 * check graphql error response body
 *
 * @param body graphql response body
 */
function checkErrorResp(body) {
    assert.containsAllKeys(body, ['graphQLErrors']);
    assert.hasAllKeys(body.graphQLErrors[0], ['extensions', 'locations', 'message', 'path']);
    // assert.hasAllKeys(body, ['error']);
}

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

module.exports = {
    startSlsOffline,
    stopSlsOffline,
    checkResp,
    checkErrorResp,
    GraphqlErrors,
    clearDynamondb
};
