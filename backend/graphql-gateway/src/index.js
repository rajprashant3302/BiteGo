// // backend/order-service/src/index.js
// require("dotenv").config();
// const express = require("express");
// const cors = require("cors");
// const { prisma } = require("database"); // Shared DB package

// const app = express();
// const PORT = process.env.PORT || 5001; // Runs on 5001 internally

// app.use(cors());
// app.use(express.json());

// // Health Check
// app.get("/", (req, res) => {
//   res.send("Graphql Service is Running");
// });

// // Example: Get All Orders (Test DB Connection)
// app.get("/graphql", async (req, res) => {
//   try {
//     const orders = await prisma.orders.findMany();
//     res.json(orders);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Database error" });
//   }
// });

// app.listen(PORT, () => {
//   console.log(`🚀 Graphql Service running on port ${PORT}`);
// });


// backend/graphql-gateway/src/index.js
const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const { ApolloGateway, RemoteGraphQLDataSource } = require('@apollo/gateway');

const gateway = new ApolloGateway({
  serviceList: [
    { name: 'auth', url: 'http://auth-service:5000/graphql' },
    { name: 'order', url: 'http://order-service:5001/graphql' },
    { name: 'payment', url: 'http://payment-service:5002/graphql' },
    { name: 'delivery', url: 'http://delivery-service:5003/graphql' },
  ],
  buildService({ url }) {
    return new RemoteGraphQLDataSource({
      url,
      willSendRequest({ request, context }) {
        // Pass UserID and Role from Gateway to Subgraphs via Headers
        request.http.headers.set('x-user-id', context.userId);
        request.http.headers.set('x-user-role', context.userRole);
      },
    });
  },
});

const server = new ApolloServer({ gateway });

(async () => {
  const { url } = await startStandaloneServer(server, {
    context: async ({ req }) => {
      // JWT Validation happens here
      const token = req.headers.authorization || '';
      const user = decodeToken(token); // Implement your JWT decode logic
      return { userId: user?.id, userRole: user?.role };
    },
    listen: { port: 4000 },
  });
  console.log(`🚀 Gateway ready at ${url}`);
})();