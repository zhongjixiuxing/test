const { checkResp, checkErrorResp, GraphqlErrors} = require('../../common');
const {publicClient, authClient} = require('../../apollo-client');
const gql = require('graphql-tag');
const ErrorCodes = require('../../../config/errCodes');
const {assert} = require('chai');

describe('Group', () => {
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

    describe('createGroup', () => {
        it('work', async (done) => {
            const resp = await authClient.mutate({
                mutation: gql`
                    mutation CreateGroup ($group: GroupInput!){
                        createGroup(group: $group) {
                            id
                        }
                    }
                `,
                variables: {
                    group: {
                        id: "group-id-001-create",
                        name: "group-name",
                        gid: "group",
                        createdAt: "2019-09-29T14:09:06.070Z"
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

    describe('updateGroup', () => {
        it('work', async (done) => {
            const resp = await authClient.mutate({
                mutation: gql`
                    mutation UpdateGroup ($updateGroupInput: GroupInput!, $createGroupInput: GroupInput!){
                        createGroup(group: $createGroupInput) {
                            id
                        }
                        updateGroup(group: $updateGroupInput) {
                            id
                            name
                        }
                    }
                `,
                variables: {
                    createGroupInput: {
                        id: "group-id-001-update",
                        name: "group-name",
                        gid: "group",
                        createdAt: "2019-09-29T14:09:06.070Z"
                    },
                    updateGroupInput: {
                        id: "group-id-001-update",
                        name: "group-name-update",
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
                if (l.id === 'group-id-001-update') {
                    assert.deepStrictEqual(l.name, 'group-name-update');
                    hasExist = true;
                }
            });
            //
            assert.deepStrictEqual(hasExist, true);
            done();
        });
    });

    describe('deleteGroup', () => {
        it('work', async (done) => {
            const resp = await authClient.mutate({
                mutation: gql`
                    mutation UpdateGroup ($createGroupInput: GroupInput!, $deleteGroupInput: GroupInput!){
                        createGroup(group: $createGroupInput) {
                            id
                        }
                        deleteGroup(group: $deleteGroupInput) {
                            id
                        }
                    }
                `,
                variables: {
                    createGroupInput: {
                        id: "group-id-001-delete",
                        name: "group-name",
                        gid: "group",
                        createdAt: "2019-09-29T14:09:06.070Z"
                    },
                    deleteGroupInput: {
                        id: "group-id-001-delete",
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
                        mutation UpdateGroup ($updateGroupInput: GroupInput!){
                            updateGroup(group: $updateGroupInput) {
                                id
                                name
                            }
                        }
                    `,
                    variables: {
                        updateGroupInput: {
                            id: "group-id-001-delete",
                            name: "group-name",
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

    describe('getLists', () => {
        const createMultiGroups = async (count= 5) => {
            for (let i=0; i<count; i++) {
                const res = await authClient.mutate({
                    mutation: gql`
                        mutation CreateGroup ($group: GroupInput!){
                            createGroup(group: $group) {
                                id
                                name
                            }
                        }
                    `,
                    variables: {
                        group: {
                            id: "group-id-00" + i,
                            name: "group-name" + i,
                            gid: "group",
                            createdAt: "2019-09-29T14:09:06.070Z"
                        }
                    },
                    context: {
                        headers: {
                            Authorization: `Bearer ${user.token}`
                        }
                    }
                });
            }
        }

        it('work', async (done) => {
            await createMultiGroups();
            const queryResp = await authClient.query({
                query : gql`
                    query SyncLists($query: GetListQuery!) {
                        getLists(query: $query) {
                            offset
                            limit
                            count
                            lists{
                                id
                                gid
                                name
                                createdAt
                                taskCount
                                theme{
                                    type
                                    value
                                }
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
            assert.deepStrictEqual(lists.count, 5);
            assert.deepStrictEqual(lists.limit, 1000);
            assert.deepStrictEqual(lists.offset, 0);
            assert.deepStrictEqual(lists.lists.length, 5);

            done();
        });

        it('success get lists by pagination', async (done) => {
            await createMultiGroups();
            let queryResp = await authClient.query({
                query : gql`
                    query SyncLists($query: GetListQuery!) {
                        getLists(query: $query, offset: 0, limit: 2) {
                            offset
                            limit
                            count
                            lists{
                                id
                                gid
                                name
                                createdAt
                                taskCount
                                theme{
                                    type
                                    value
                                }
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
            assert.deepStrictEqual(lists.count, 2);
            assert.deepStrictEqual(lists.limit, 2);
            assert.deepStrictEqual(lists.offset, 0);
            assert.deepStrictEqual(lists.lists.length, 2);
            assert.ownProperty(lists, 'LastEvaluatedKey');


            queryResp = await authClient.query({
                query : gql`
                    query SyncLists($query: GetListQuery!) {
                        getLists(query: $query, offset: 2, limit: 5) {
                            offset
                            limit
                            count
                            lists{
                                id
                                gid
                                name
                                createdAt
                                taskCount
                                theme{
                                    type
                                    value
                                }
                            }
                            LastEvaluatedKey
                        }
                    }
                `,
                variables: {
                    query: {
                        LastEvaluatedKey: lists.LastEvaluatedKey
                    }
                },
                context: {
                    headers: {
                        Authorization: `Bearer ${user.token}`
                    }
                }
            });

            checkResp(queryResp);
            lists = queryResp.data.getLists;
            assert.deepStrictEqual(lists.count, 3);
            assert.deepStrictEqual(lists.limit, 5);
            assert.deepStrictEqual(lists.offset, 2);
            assert.deepStrictEqual(lists.lists.length, 3);
            assert.deepStrictEqual(!lists.LastEvaluatedKey, true);

            done();
        });
    });
});
