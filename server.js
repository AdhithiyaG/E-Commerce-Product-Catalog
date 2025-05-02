
require('dotenv').config()
const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const mongoose = require('mongoose');
const schema = require('./graphql/schema');

const app = express();

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 4000;

app.use('/graphql', graphqlHTTP((req) => {
  const userId = req.headers['x-replit-user-id'];
  const userName = req.headers['x-replit-user-name'];
  const userRoles = req.headers['x-replit-user-roles'];

  return {
    schema: schema,
    graphiql: true,
    context: {
      user: userId ? {
        id: userId,
        name: userName,
        isAdmin: userRoles?.includes('admin') || false
      } : null
    },
    customFormatErrorFn: (err) => {
      if (err.originalError instanceof UserInputError ||
          err.originalError instanceof AuthenticationError ||
          err.originalError instanceof AuthorizationError) {
        return {
          message: err.message,
          status: err.originalError.name
        };
      }
      return {
        message: 'Internal server error',
        status: 'ERROR'
      };
    }
  };
}));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://0.0.0.0:${PORT}/graphql`);
});
