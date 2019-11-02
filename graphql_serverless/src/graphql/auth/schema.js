const { gql } = require('apollo-server-lambda');
const { makeExecutableSchema } = require('graphql-tools');
const { resolvers } = require('./resolvers');

const schema = `
    scalar JSON # 生命JSON类型结构体
    scalar JSONObject # 生命JSON类型结构体
    # 程序注释，graphql 客户端看不到
    type Query {
        getLists (query: GetListQuery, offset: Int, limit: Int): GetListsResp!
        getTasks (query: GetTaskQuery, offset: Int, limit: Int): GetTasksResp!
    }
    type Mutation {
        createGroup (group: GroupInput!): Group!
        updateGroup (group: GroupInput!): Group!
        deleteGroup (group: GroupInput!): Group!
        createList (list: ListInput!): List!
        updateList (list: ListInput!): List!
        deleteList (list: ListInput!): List!
        createTask (task: TaskInput!): Task!
        updateTask (task: TaskInput!): Task!
        deleteTask (task: TaskInput!): Task!
        updateUserProfile (profile: UserProfileInput!): Boolean!
    }

    input GetListQuery {
        LastEvaluatedKey: JSONObject
    }
    
    input GetTaskQuery {
        LastEvaluatedKey: JSONObject
    }

    input UserProfileInput {
        data: JSONObject
    }

    type Group{
        id: ID!,
        name: String
    }

    type GetListsResp{
        offset: Int!
        limit: Int!
        """
        总数
        """
        count: Int!
        lists: [List]
        LastEvaluatedKey: JSONObject
    }
    
    type GetTasksResp{
        offset: Int!
        limit: Int!
        """
        总数
        """
        count: Int!
        tasks: [Task]
        LastEvaluatedKey: JSONObject
    }

    type List{
        id: ID!
        name: String
        gid: String
        createdAt: String
        taskCount: Int
        theme: Theme
    }
    
    type Task{
        id: ID!
        name: String
        lid: String
        state: String
        type: String
        important: Boolean
        isMyday: Boolean
        steps: [Step]
        expireDay: Int
        comment: String
        createdAt: String
        updatedAt: String
        repeat: String
    }

    type Step{
        state: String
        value: String
    }
    
    type Theme{
        type: String
        value: String
    }
    
    input GroupInput{
        id: ID!
        name: String
        gid: String
        createdAt: String
    }

    input TaskInput{
        id: ID!
        name: String
        lid: String
        state: String
        type: String
        important: Boolean
        isMyday: Boolean
        steps: [InputStep]
        expireDay: Int
        comment: String
        createdAt: String
        updatedAt: String
        repeat: String
    }

    input ListInput{
        id: ID!
        name: String
        gid: String
        createdAt: String
        taskCount: Int
        theme: InputTheme
    }
    
    input InputTheme{
        type: String
        value: String
    }

    input InputStep{
        state: String
        value: String
    }

    schema {
        query: Query
        mutation: Mutation
    }
`;

module.exports = makeExecutableSchema({ typeDefs: schema, resolvers });
