const { stopSlsOffline, startSlsOffline, checkResp, checkErrorResp, GraphqlErrors, clearDynamondb } = require('../../common');
const {publicClient} = require('../../apollo-client');
const gql = require('graphql-tag');
const ErrorCodes = require('../../../config/errCodes');
const {assert} = require('chai');
const superagent = require('superagent');
const {WechatServerMocker} = require('../../wechat.server.mocker');

let slsOfflineProcess;
let wxCB = {
    cb: (req, res) => {res.end('hello')}// 微信mocker response callback
};

describe('User', () => {
    jest.setTimeout(30000);
    let wxMockerServer;

    describe('register', () => {
        it('work', async (done) => {
            const resp = await publicClient.mutate({
                mutation: gql`
                    mutation {
                        register(name: "anxing", password: "anxing") {
                            id,
                            name
                        }
                    }
                `,
            });

            checkResp(resp);
            done();
        });

        it('get NAME_ALREADY_EXISTS when user name already exists', async (done) => {
            const mutation = {
                mutation: gql`
                    mutation {
                        register(name: "anxing", password: "anxing") {
                            id,
                            name
                        }
                    }
                `,
            };

            await publicClient.mutate(mutation);
            try {
                const result = await publicClient.mutate(mutation);
                done(result);
            } catch (e) {
                checkErrorResp(e);
                assert.deepStrictEqual(e.graphQLErrors[0].extensions.code, GraphqlErrors.BAD_USER_INPUT);
                assert.deepStrictEqual(e.graphQLErrors[0].message, ErrorCodes.NAME_ALREADY_EXISTS);
                done();
            }
        });
    });

    describe('login', () => {
        it('work', async (done) => {
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
            done();
        });

        it('get USER_NAME_NOT_EXISTS when user name not register', async (done) => {
            try {
                const resp = await publicClient.mutate({
                    mutation: gql`
                        mutation {
                            login(name: "anxing", password: "anxing") {
                                id,
                                name
                            }
                        }
                    `,
                });

                done(resp);
            } catch (e) {
                checkErrorResp(e);
                assert.deepStrictEqual(e.graphQLErrors[0].extensions.code, GraphqlErrors.BAD_USER_INPUT);
                assert.deepStrictEqual(e.graphQLErrors[0].message, ErrorCodes.USER_NAME_NOT_EXISTS);
                done();
            }
        });

        it('get PASSWORD_ERROR use invalid password', async (done) => {
            try {
                const resp = await publicClient.mutate({
                    mutation: gql`
                        mutation {
                            register(name: "anxing", password: "anxing") {
                                id 
                            }
                            login(name: "anxing", password: "invaild_password") {
                                id
                                name
                            }
                        }
                    `,
                });

                done(resp);
            } catch (e) {
                checkErrorResp(e);
                assert.deepStrictEqual(e.graphQLErrors[0].extensions.code, GraphqlErrors.BAD_USER_INPUT);
                assert.deepStrictEqual(e.graphQLErrors[0].message, ErrorCodes.PASSWORD_ERROR);
                done();
            }
        });
    });

    describe('wxLogin', () => {
        beforeEach(async (done) => {
            wxCB.cb = (req, res) => {
                res.writeHead(200, {'Content-Type': 'text/html'});
                const txt = JSON.stringify({session_key: 'T3SpO4XzgozF5Xe/ykjtZQ==', openid: 'oVCWq5Xy5ZTzaw5v4lGzVYnZMito' });
                res.end(txt);
            };

            wxMockerServer = await new WechatServerMocker(wxCB).start(); // start wechat mocker server

            done();
        });
        afterEach(async (done) => {
            wxMockerServer.stop();
            done();
        });

        it('work', async (done) => {
            const resp = await publicClient.mutate({
                mutation: gql`
                    mutation {
                        wxLogin(code: "061Wv3qi1tApav01Yxpi1fQfqi1Wv3qg") {
                            id
                            token
                            openid
                            session_key
                        }
                    }
                `,
            });
            checkResp(resp);

            // login again
            let resp2 = await publicClient.mutate({
                mutation: gql`
                    mutation {
                        wxLogin(code: "061Wv3qi1tApav01Yxpi1fQfqi1Wv3qg") {
                            id
                            token
                            openid
                            session_key
                        }
                    }
                `,
            });
            checkResp(resp2);

            done();
        });

    });
});
