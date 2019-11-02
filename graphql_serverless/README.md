

# WeTodos

## Setup
```shell
$ npm i
$ npm i -g serverless
```

## Startup (local)
3000(apollo server) and 8000 (local dynamodb) port will be using!
```shell
$ npm run start 
```

## Todos
    - [] jest, dynamodb don't restart, should be clear table rows

## ISSUES
- [aws apigateway custom domain setting](https://medium.com/@maciejtreder/custom-domain-in-aws-api-gateway-a2b7feaf9c74)
- 本地测试环境
- 不同环境怎样隔离
- CI/CD
- 删除Service
  1. 在AWS CloudFormation 中找到对应的堆栈点击删除。如果删除遇到错误，根据错误的提示，通常是因为一些资源需要手动去确认删除，例如S3、DynamoDB、Apigateway 中有绑定自定义域名等，去到相关的服务页面将其删除后再返回执行删除操作即可.
- Test Case 中的apollo-client query 操作是默认查询在缓存中的，要设置不从缓存中查询
  ```javascript
      const authClient = new ApolloClient({
          link: createHttpLink({ uri: 'http://localhost:3000/auth', fetch}),
          cache: new InMemoryCache(),
          defaultOptions: {
              query: {
                  fetchPolicy: 'no-cache',
                  errorPolicy: 'all',
              }
          }
      });
  ```
