const {ApolloServer} = require('apollo-server-lambda');

const logger = require('../../logger');
const schema = require('./schema');
const { resolvers } = require('./resolvers');

const apolloCfg = {
    endpointURL: '/public',
    schema,
    context: ({event, context}) => {
        return {
            headers: event.headers,
            functionName: context.functionName,
            event,
            context,
        }
    },
    formatError: (err) => {
        logger.error(err);
        // Don't give the specific errors to the client.
        if (err.message.startsWith("Database Error: ")) {
            return new Error('Internal server error');
        }

        // Otherwise return the original error.  The error can also
        // be manipulated in other ways, so long as it's returned.
        return err;
    },
};

if (process.env.NODE_ENV === 'prod') {
    apolloCfg.debug = false;      // disable error stacktraces to display output
    apolloCfg.playground = false; // disable playground gui
}

const server = new ApolloServer(apolloCfg);

exports.graphqlHandler = server.createHandler({
    cors: {
        origin: '*',
        credentials: true,
    },
});
