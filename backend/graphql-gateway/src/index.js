require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("✅ GraphQL Gateway is Running");
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.all("/graphql", (_req, res) => {
  res.status(501).json({
    success: false,
    error: "GraphQL gateway is not configured with active subgraphs in this environment.",
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 GraphQL Gateway running on port ${PORT}`);
});
