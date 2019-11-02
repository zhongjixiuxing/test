const { stopSlsOffline, startSlsOffline, checkResp, checkErrorResp, GraphqlErrors, clearDynamondb} = require('../../common');
const {publicClient, authClient} = require('../../apollo-client');
const gql = require('graphql-tag');
const ErrorCodes = require('../../../config/errCodes');
const {assert} = require('chai');
const logger = require('../../../src/logger');

let user;
describe('Common', () => {
    beforeEach(async (done) => {
        const resp = await publicClient.mutate({
            mutation: gql`
                mutation {
                    register(name: "anxing", password: "anxing") {
                        id
                    }
                    login(name: "anxing", password: "anxing") {
                        id
                        name
                        token
                    }
                }
            `,
        });

        checkResp(resp);
        user = resp.data.login;

        done();
    });

    it('should be error when create with invalid token', async (done) => {
        try {
            const resp = await authClient.mutate({
                mutation: gql`
                    mutation {
                        createTodo(title: "todo-Title", content: "todo-Content") {
                            id
                            title
                            content
                            uid
                        }
                    }
                `,
                context: {
                    headers: {
                        Authorization: `Bearer ${user.token}1`
                    }
                }
            });

            done(resp);
        } catch (e) {
            assert.containsAllKeys(e, ['networkError']);
            assert.containsAllKeys(e.networkError, ['result']);
            assert.containsAllKeys(e.networkError.result, ['errors']);
            assert.containsAllKeys(e.networkError.result.errors[0], ['extensions']);
            assert.containsAllKeys(e.networkError.result.errors[0].extensions, ['code']);
            assert.deepStrictEqual(e.networkError.result.errors[0].extensions.code, GraphqlErrors.UNAUTHENTICATED);

            done();
        }
    });
});

