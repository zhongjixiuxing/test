const { checkResp, checkErrorResp, GraphqlErrors} = require('../../common');
const {publicClient, authClient} = require('../../apollo-client');
const gql = require('graphql-tag');
const ErrorCodes = require('../../../config/errCodes');
const {assert} = require('chai');

describe('User', () => {
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

    describe('updateUserProfile', () => {
        it('work', async (done) => {
            const resp = await authClient.mutate({
                mutation: gql`
                    mutation UpdateProfile ($profile: UserProfileInput!){
                        updateUserProfile(profile: $profile)
                    }
                `,
                variables: {
                    profile: {
                        data: {
                            nickname: 'new-name'
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
            assert.deepStrictEqual(resp.data.updateUserProfile, true);
            done();
        });
    });

});
