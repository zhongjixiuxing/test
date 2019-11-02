const {ApolloServer, AuthenticationError} = require('apollo-server-lambda');

const logger = require('../../logger');
const {decodeJwt} = require('../../utils');
const schema = require('./schema');

const apolloCfg = ({
    endpointURL: '/auth',
    schema,
    context: ({event, context}) => {
        if (!event.headers.Authorization || !event.headers.Authorization.startsWith('Bearer ')) {
            throw new AuthenticationError('who are you?');
        }

        const token = event.headers.Authorization.split('Bearer ').pop();
        let payload;
        try {
            payload = decodeJwt(token);
        } catch (e) {
            logger.error('[decode jwt token error] ', e);
            throw new AuthenticationError('Invalid token!');
        }

        return {
            headers: event.headers,
            functionName: context.functionName,
            event,
            context,
            user: payload
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
});

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
