const { checkResp, checkErrorResp, GraphqlErrors} = require('../../common');
const {publicClient, authClient} = require('../../apollo-client');
const gql = require('graphql-tag');
const ErrorCodes = require('../../../config/errCodes');
const {assert} = require('chai');

describe('Task', () => {
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

    describe('createTask', () => {
        it('work', async (done) => {
            const resp = await authClient.mutate({
                mutation: gql`
                    mutation CreateTask ($task: TaskInput!){
                        createTask(task: $task) {
                            id
                        }
                    }
                `,
                variables: {
                    task: {
                        id: 'task-001',
                        lid: 'list-007', // group id
                        name: '更新一份简历PDF',
                        state: 'pending', // enum, pending/finished
                        type: '',
                        important: true,
                        steps: [],
                        // expireDay: 20191029,
                        expireDay: 0,
                        isMyday: false,
                        comment: 'task-comment',
                        createdAt: '2019-09-29T14:09:06.070Z',
                        updatedAt: '2019-09-29T14:09:06.070Z',
                        repeat: '',
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

    describe('updateTask', () => {
        it('work', async (done) => {
            const resp = await authClient.mutate({
                mutation: gql`
                    mutation UpdateTask ($updateTaskInput: TaskInput!, $createTaskInput: TaskInput!){
                        createTask(task: $createTaskInput) {
                            id
                        }
                        updateTask(task: $updateTaskInput) {
                            id
                            name
                        }
                    }
                `,
                variables: {
                    createTaskInput: {
                        id: 'task-001',
                        lid: 'list-007', // group id
                        name: '更新一份简历PDF',
                        state: 'pending', // enum, pending/finished
                        type: '',
                        important: true,
                        steps: [],
                        // expireDay: 20191029,
                        expireDay: 0,
                        isMyday: false,
                        comment: 'task-comment',
                        createdAt: '2019-09-29T14:09:06.070Z',
                        updatedAt: '2019-09-29T14:09:06.070Z',
                        repeat: '',
                    },
                    updateTaskInput: {
                        id: "task-001",
                        name: "task-name-update",
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
                    query SyncTasks($query: GetTaskQuery!) {
                        getTasks(query: $query) {
                            offset
                            limit
                            count
                            tasks{
                                id
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
            let tasks = queryResp.data.getTasks;
            let hasExist = false;
            tasks.tasks.forEach(t=> {
                if (t.id === 'task-001') {
                    assert.deepStrictEqual(t.name, 'task-name-update');
                    hasExist = true;
                }
            });
            //
            assert.deepStrictEqual(hasExist, true);
            done();
        });
    });

    describe('deleteTask', () => {
        it('work', async (done) => {
            const resp = await authClient.mutate({
                mutation: gql`
                    mutation UpdateTask ($createTaskInput: TaskInput!, $deleteTaskInput: TaskInput!){
                        createTask(task: $createTaskInput) {
                            id
                        }
                        deleteTask(task: $deleteTaskInput) {
                            id
                        }
                    }
                `,
                variables: {
                    createTaskInput: {
                        id: 'task-001',
                        lid: 'list-007', // group id
                        name: '更新一份简历PDF',
                        state: 'pending', // enum, pending/finished
                        type: '',
                        important: true,
                        steps: [],
                        // expireDay: 20191029,
                        expireDay: 0,
                        isMyday: false,
                        comment: 'task-comment',
                        createdAt: '2019-09-29T14:09:06.070Z',
                        updatedAt: '2019-09-29T14:09:06.070Z',
                        repeat: '',
                    },
                    deleteTaskInput: {
                        id: "task-001",
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
                        mutation UpdateTask ($updateTaskInput: TaskInput!){
                            updateTask(task: $updateTaskInput) {
                                id
                                name
                            }
                        }
                    `,
                    variables: {
                        updateTaskInput: {
                            id: "task-001",
                            name: "new-name",
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

    describe('getTasks', () => {
        const createMultiTasks = async (count= 5) => {
            for (let i=0; i<count; i++) {
                await authClient.mutate({
                    mutation: gql`
                        mutation CreateTask ($task: TaskInput!){
                            createTask(task: $task) {
                                id
                                name
                            }
                        }
                    `,
                    variables: {
                        task: {
                            id: 'task-00' + i,
                            lid: 'list-00x', // group id
                            name: 'task-name-00' + i,
                            state: 'pending', // enum, pending/finished
                            type: '',
                            important: true,
                            steps: [],
                            // expireDay: 20191029,
                            expireDay: 0,
                            isMyday: false,
                            comment: 'task-comment',
                            createdAt: '2019-09-29T14:09:06.070Z',
                            updatedAt: '2019-09-29T14:09:06.070Z',
                            repeat: '',
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
            await createMultiTasks();
            const queryResp = await authClient.query({
                query : gql`
                    query SyncTasks($query: GetTaskQuery!) {
                        getTasks(query: $query) {
                            offset
                            limit
                            count
                            tasks{
                                id
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
            let tasks = queryResp.data.getTasks;
            assert.deepStrictEqual(tasks.count, 5);
            assert.deepStrictEqual(tasks.limit, 1000);
            assert.deepStrictEqual(tasks.offset, 0);
            assert.deepStrictEqual(tasks.tasks.length, 5);

            done();
        });

        it('success get tasks by pagination', async (done) => {
            await createMultiTasks();
            let queryResp = await authClient.query({
                query : gql`
                    query SyncTasks($query: GetTaskQuery!) {
                        getTasks(query: $query, offset: 0, limit: 2) {
                            offset
                            limit
                            count
                            tasks{
                                id
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
            let tasks = queryResp.data.getTasks;
            assert.deepStrictEqual(tasks.count, 2);
            assert.deepStrictEqual(tasks.limit, 2);
            assert.deepStrictEqual(tasks.offset, 0);
            assert.deepStrictEqual(tasks.tasks.length, 2);
            assert.ownProperty(tasks, 'LastEvaluatedKey');


            queryResp = await authClient.query({
                query : gql`
                    query SyncTasks($query: GetTaskQuery!) {
                        getTasks(query: $query, offset: 2, limit: 5) {
                            offset
                            limit
                            count
                            tasks{
                                id
                                name
                            }
                            LastEvaluatedKey
                        }
                    }
                `,
                variables: {
                    query: {
                        LastEvaluatedKey: tasks.LastEvaluatedKey
                    }
                },
                context: {
                    headers: {
                        Authorization: `Bearer ${user.token}`
                    }
                }
            });

            checkResp(queryResp);
            tasks = queryResp.data.getTasks;
            assert.deepStrictEqual(tasks.count, 3);
            assert.deepStrictEqual(tasks.limit, 5);
            assert.deepStrictEqual(tasks.offset, 2);
            assert.deepStrictEqual(tasks.tasks.length, 3);
            assert.deepStrictEqual(!tasks.LastEvaluatedKey, true);

            done();
        });
    });
});
