const { gql } = require('apollo-server-lambda');
const { makeExecutableSchema } = require('graphql-tools');
const { resolvers } = require('./resolvers');

const schema = `
    scalar JSON # 生命JSON类型结构体
    scalar JSONObject # 生命JSON类型结构体
    
    type Query {
        hello: String!
    }
    type Mutation {
        register (name: String!, password: String!): User!
        login (name: String!, password: String!) : User!
        wxLogin (code: String!): WxLoginResp!
    }
    
    # 程序注释，graphql 客户端看不到
    """
    用户Model
    """
    type User {
        id: ID!
        """
        用户名称
        """
        name: String!
        password: String
        token: String
    }
    
    type WxLoginResp{
        id: ID!
        """
        用户名称
        """
        name: String!
        token: String!
        openid: String!
        session_key: String!
        profile: JSONObject
    }
    
    schema {
        query: Query
        mutation: Mutation
    }
`;

// module.exports = {schema};
module.exports = makeExecutableSchema({ typeDefs: schema, resolvers });
