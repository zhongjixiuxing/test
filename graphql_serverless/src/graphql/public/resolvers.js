const {UserInputError} = require('apollo-server-lambda');

const {dynamodb} = require('../../dynamodb');
const {tables} = require('../../../config/dynamodb');
const uuid = require('uuid/v4');
const {respJson, formatErr, encodeJwt} = require('../../utils');
const ErrorCodes = require('../../../config/errCodes');
const logger = require('../../logger');
const {login: wxLogin} = require('./wxUtil');
const appCfg = require('../../../config/appCfg');
const {GraphQLJSON, GraphQLJSONObject} = require('graphql-type-json');

const initUserData = async (user) => {
    const params = {
        TableName: tables.user.name,
        Item: {
            id: uuid(),
            wxOpenId: openId,
            profile: appCfg.defaultUserProfile
        }
    };

    await dynamodb.put(params).promise();
};

const resolvers = {
    JSON: GraphQLJSON,
    JSONObject: GraphQLJSONObject,

    Query: {},
    Mutation: {
        register: async (_, { name, password }) => {
            const query = {
                TableName: tables.user.name,
                IndexName: 'index_name',
                KeyConditionExpression: "#name = :name",
                ExpressionAttributeNames: {
                    "#name": 'name',
                },
                ExpressionAttributeValues: {
                    ":name": name
                },
                Limit: 1,
            };

            const result = await dynamodb.query(query).promise();
            if (result.Count > 0) {
                throw new UserInputError(ErrorCodes.NAME_ALREADY_EXISTS);
            }

            const params = {
                TableName: tables.user.name,
                Item: {
                    id: uuid(),
                    name,
                    password
                }
            };

            await dynamodb.put(params).promise();
            return {
                id: params.Item.id,
                name: params.Item.name
            };
        },
        login: async (_, { name, password }) => {
            const query = {
                TableName: tables.user.name,
                IndexName: 'index_name',
                KeyConditionExpression: "#name = :name",
                ExpressionAttributeNames: {
                    "#name": 'name',
                },
                ExpressionAttributeValues: {
                    ":name": name
                },
                Limit: 1,
            };

            const result = await dynamodb.query(query).promise();
            if (result.Count !== 1) {
                throw new UserInputError(ErrorCodes.USER_NAME_NOT_EXISTS);
            }

            const user = result.Items[0];
            if (user.password !== password) {
                throw new UserInputError(ErrorCodes.PASSWORD_ERROR);
            }

            return {
                id: user.id,
                name: user.name,
                token: encodeJwt({id: user.id}),
            }
        },
        wxLogin: async (_, { code }) => {
            const infos = await wxLogin(code);
            const openId = infos.openid;

            const query = {
                TableName: tables.user.name,
                IndexName: 'index_wxOpenId',
                KeyConditionExpression: "#wxOpenId = :id",
                ExpressionAttributeNames: {
                    "#wxOpenId": 'wxOpenId',
                },
                ExpressionAttributeValues: {
                    ":id": openId
                },
                Limit: 1,
            };

            const result = await dynamodb.query(query).promise();
            let user;
            if (result.Count === 0) {
                const params = {
                    TableName: tables.user.name,
                    Item: {
                        id: uuid(),
                        wxOpenId: openId,
                        profile: appCfg.defaultUserProfile
                    }
                };

                await dynamodb.put(params).promise();
                user = params.Item;

                try {
                    await initUserData(user);
                } catch (e) {
                    logger.error('Init User Default Data Error: ', e);
                }
            } else {
                user = result.Items[0];
            }

            return {
                id: user.id,
                token: encodeJwt({id: user.id}),
                profile: user.profile,
                ...infos
            }
        }
    }
};

module.exports = {
    resolvers
}
