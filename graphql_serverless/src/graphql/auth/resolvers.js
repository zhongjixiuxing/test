const {UserInputError, AuthenticationError} = require('apollo-server-lambda');

const {dynamodb} = require('../../dynamodb');
const {tables} = require('../../../config/dynamodb');
const uuid = require('uuid/v4');
const {respJson, formatErr, encodeJwt} = require('../../utils');
const ErrorCodes = require('../../../config/errCodes');
const logger = require('../../logger');
const {GraphQLJSON, GraphQLJSONObject} = require('graphql-type-json');

const generateExpression = (data, excludes = []) => {
    const keys = Object.keys(data);
    let UpdateExpression = 'SET ';
    const ExpressionAttributeNames = {};
    const ExpressionAttributeValues = {};

    for (let i=0; i<keys.length; i++) {
        const key = keys[i];
        if (excludes.includes(key)) {
            continue;
        }

        UpdateExpression = `${UpdateExpression}#${key}=:${key},`;
        ExpressionAttributeNames[`#${key}`] = key;
        ExpressionAttributeValues[`:${key}`] = data[key];
    }

    if (UpdateExpression.endsWith(',')) {
        UpdateExpression = UpdateExpression.substring(0, UpdateExpression.length - 1);
    }
    return {UpdateExpression, ExpressionAttributeNames, ExpressionAttributeValues};
};

const resolvers = {
    JSON: GraphQLJSON,
    JSONObject: GraphQLJSONObject,
    Query: {
        getLists: async (_, { query, limit = 1000, offset = 0 }, {user}) => {
            const queryOpts = {
                TableName: tables.list.name,
                IndexName: 'index_uid',
                KeyConditionExpression: "#uid = :u",
                ExpressionAttributeNames: {
                    "#uid": 'uid',
                },
                ExpressionAttributeValues: {
                    ":u": user.id
                },
                Limit: limit,
            };

            if (query.LastEvaluatedKey) {
                queryOpts.ExclusiveStartKey = query.LastEvaluatedKey;
            }

            const queryResult = await dynamodb.query(queryOpts).promise();

            return {
                offset,
                limit,
                count: queryResult.Count,
                lists: queryResult.Items,
                LastEvaluatedKey: queryResult.LastEvaluatedKey
            };
        },

        getTasks: async (_, { query, limit = 1000, offset = 0 }, {user}) => {
            const queryOpts = {
                TableName: tables.task.name,
                IndexName: 'index_uid',
                KeyConditionExpression: "#uid = :u",
                ExpressionAttributeNames: {
                    "#uid": 'uid',
                },
                ExpressionAttributeValues: {
                    ":u": user.id
                },
                Limit: limit,
            };

            if (query.LastEvaluatedKey) {
                queryOpts.ExclusiveStartKey = query.LastEvaluatedKey;
            }

            const queryResult = await dynamodb.query(queryOpts).promise();

            return {
                offset,
                limit,
                count: queryResult.Count,
                tasks: queryResult.Items,
                LastEvaluatedKey: queryResult.LastEvaluatedKey
            };
        }
    },
    Mutation: {
        createGroup: async (_, {group}, {user}) => {
            const params = {
                TableName: tables.list.name,
                Item: {...group, uid: user.id},
            };

            await dynamodb.put(params).promise();
            return params.Item;
        },

        updateGroup: async (_, {group}, {user}) => {
            const params = {
                TableName: tables.list.name,
                Key: { id: group.id },
                ReturnValues: 'ALL_OLD'
            };

            Object.assign(params, generateExpression(group, ['id']));
            const result = await dynamodb.update(params).promise();
            if (Object.keys(result).length === 0) {
                throw new UserInputError(ErrorCodes.GROUP_NOT_EXISTS);
            }

            return {id: result.Attributes.id};
        },
        deleteGroup: async (_, {group}, {user}) => {
            const params = {
                TableName: tables.list.name,
                Key: { id: group.id },
                ReturnValues: 'ALL_OLD'
            };

            const result = await dynamodb.delete(params).promise();
            if (!result.Attributes || !result.Attributes.id) {
                throw new UserInputError(ErrorCodes.GROUP_NOT_EXISTS);
            }

            return {id: result.Attributes.id};
        },

        createList: async (_, {list}, {user}) => {
            const params = {
                TableName: tables.list.name,
                Item: {...list, uid: user.id},
            };

            await dynamodb.put(params).promise();
            return params.Item;
        },

        updateList: async (_, {list}, {user}) => {
            const params = {
                TableName: tables.list.name,
                Key: { id: list.id },
                ReturnValues: 'ALL_OLD'
            };

            Object.assign(params, generateExpression(list, ['id']));
            const result = await dynamodb.update(params).promise();
            if (Object.keys(result).length === 0) {
                throw new UserInputError(ErrorCodes.GROUP_NOT_EXISTS);
            }

            return {id: result.Attributes.id};
        },

        deleteList: async (_, {list}, {user}) => {
            const params = {
                TableName: tables.list.name,
                Key: { id: list.id },
                ReturnValues: 'ALL_OLD'
            };

            const result = await dynamodb.delete(params).promise();
            if (!result.Attributes || !result.Attributes.id) {
                throw new UserInputError(ErrorCodes.GROUP_NOT_EXISTS);
            }

            return {id: result.Attributes.id};
        },

        createTask: async (_, {task}, {user}) => {
            const params = {
                TableName: tables.task.name,
                Item: {...task, uid: user.id},
            };

            await dynamodb.put(params).promise();
            return params.Item;
        },

        updateTask: async (_, {task}, {user}) => {
            const params = {
                TableName: tables.task.name,
                Key: { id: task.id },
                ReturnValues: 'ALL_OLD'
            };

            Object.assign(params, generateExpression(task, ['id']));
            const result = await dynamodb.update(params).promise();
            if (Object.keys(result).length === 0) {
                throw new UserInputError(ErrorCodes.GROUP_NOT_EXISTS);
            }

            return {id: result.Attributes.id};
        },

        deleteTask: async (_, {task}, {user}) => {
            const params = {
                TableName: tables.task.name,
                Key: { id: task.id },
                ReturnValues: 'ALL_OLD'
            };

            const result = await dynamodb.delete(params).promise();
            if (!result.Attributes || !result.Attributes.id) {
                throw new UserInputError(ErrorCodes.GROUP_NOT_EXISTS);
            }

            return {id: result.Attributes.id};
        },
        updateUserProfile: async (_, {profile}, {user}) => {
            const params = {
                TableName: tables.user.name,
                Key: { id: user.id },
                ReturnValues: 'ALL_OLD'
            };

            Object.assign(params, generateExpression({profile: profile.data}));
            await dynamodb.update(params).promise();

            return true;
        },
    }
};

module.exports = {
    resolvers
};
