const {ApolloClient} = require('apollo-boost');
const {InMemoryCache} = require('apollo-cache-inmemory');
const {createHttpLink} = require('apollo-link-http');
const fetch = require('node-fetch');

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

const publicClient = new ApolloClient({
    link: createHttpLink({ uri: 'http://localhost:3000/public', fetch}),
    cache: new InMemoryCache(),
    defaultOptions: {
        query: {
            fetchPolicy: 'no-cache',
            errorPolicy: 'all',
        }
    }
});

module.exports = {
    client: null,
    authClient,
    publicClient
};
