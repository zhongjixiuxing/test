const { checkResp, checkErrorResp, GraphqlErrors} = require('../../common');
const {publicClient, authClient} = require('../../apollo-client');
const gql = require('graphql-tag');
const ErrorCodes = require('../../../config/errCodes');
const {assert} = require('chai');

describe('List', () => {
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

    describe('createList', () => {
        it('work', async (done) => {
            const resp = await authClient.mutate({
                mutation: gql`
                    mutation CreateList ($list: ListInput!){
                        createList(list: $list) {
                            id
                        }
                    }
                `,
                variables: {
                    list: {
                        id: "list-id-001-create",
                        name: "list-name",
                        gid: "none",
                        createdAt: "2019-09-29T14:09:06.070Z",
                        taskCount: 0,
                        theme: {
                            type: 'color',
                            value: '#ffffff'
                        }
                    }
                },
                context: {
                    headers: {
                        Authorization: `Bearer ${user.token}`
                    }
                }
            });

            checkResp(resp);
            done();
        });
    });

    describe('updateList', () => {
        it('work', async (done) => {
            const resp = await authClient.mutate({
                mutation: gql`
                    mutation UpdateList ($updateListInput: ListInput!, $createListInput: ListInput!){
                        createList(list: $createListInput) {
                            id
                        }
                        updateList(list: $updateListInput) {
                            id
                            name
                        }
                    }
                `,
                variables: {
                    createListInput: {
                        id: "list-id-001",
                        name: "list-name",
                        gid: "none",
                        createdAt: "2019-09-29T14:09:06.070Z",
                        taskCount: 0,
                        theme: {
                            type: 'color',
                            value: '#ffffff'
                        }
                    },
                    updateListInput: {
                        id: "list-id-001",
                        name: "list-name-update",
                    }
                },
                context: {
                    headers: {
                        Authorization: `Bearer ${user.token}`
                    }
                }
            });

            checkResp(resp);

            const queryResp = await authClient.query({
                query : gql`
                    query SyncLists2($query: GetListQuery!) {
                        getLists(query: $query) {
                            offset
                            limit
                            count
                            lists{
                                id
                                gid
                                name
                            }
                            LastEvaluatedKey
                        }
                    }
                `,
                variables: {
                    query: {}
                },
                context: {
                    headers: {
                        Authorization: `Bearer ${user.token}`
                    }
                }
            });

            checkResp(queryResp);
            let lists = queryResp.data.getLists;
            let hasExist = false;
            lists.lists.forEach(l => {
                if (l.id === 'list-id-001') {
                    assert.deepStrictEqual(l.name, 'list-name-update');
                    hasExist = true;
                }
            });
            //
            assert.deepStrictEqual(hasExist, true);
            done();
        });
    });

    describe('deleteList', () => {
        it('work', async (done) => {
            const resp = await authClient.mutate({
                mutation: gql`
                    mutation UpdateList ($createListInput: ListInput!, $deleteListInput: ListInput!){
                        createList(list: $createListInput) {
                            id
                        }
                        deleteList(list: $deleteListInput) {
                            id
                        }
                    }
                `,
                variables: {
                    createListInput: {
                        id: "list-id-001",
                        name: "list-name",
                        gid: "none",
                        createdAt: "2019-09-29T14:09:06.070Z",
                        taskCount: 0,
                        theme: {
                            type: 'color',
                            value: '#ffffff'
                        }
                    },
                    deleteListInput: {
                        id: "list-id-001",
                    }
                },
                context: {
                    headers: {
                        Authorization: `Bearer ${user.token}`
                    }
                }
            });

            checkResp(resp);

            try {
                const result = await authClient.mutate({
                    mutation: gql`
                        mutation UpdateList ($updateListInput: ListInput!){
                            updateList(list: $updateListInput) {
                                id
                                name
                            }
                        }
                    `,
                    variables: {
                        updateListInput: {
                            id: "list-id-001",
                            name: "list-name",
                        },
                    },
                    context: {
                        headers: {
                            Authorization: `Bearer ${user.token}`
                        }
                    }
                });
                done(result);
            } catch (e) {
                checkErrorResp(e);
                assert.deepStrictEqual(e.graphQLErrors[0].extensions.code, GraphqlErrors.BAD_USER_INPUT);
                assert.deepStrictEqual(e.graphQLErrors[0].message, ErrorCodes.GROUP_NOT_EXISTS);
                done();
            }

            done();
        });
    });
});
