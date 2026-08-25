// backend/src/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const healthRoutes = require("./routes/healthRoutes");
const choreRoutes = require("./routes/choreRoutes");
const noticeRoutes = require("./routes/noticeRoutes");
const groceryRoutes = require("./routes/groceryRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const householdRoutes = require("./routes/householdRoutes");
const settlementRoutes = require("./routes/settlementRoutes");
const aiRoutes = require("./routes/aiRoutes");
const visionRoutes = require('./routes/visionRoutes');

const app = express();

// connect to MongoDB
connectDB();

// middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));


// routes
app.use("/api/auth", authRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/chores", choreRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/groceries", groceryRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/households", householdRoutes);
app.use("/api/settlements", settlementRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/vision", visionRoutes);

// root route
app.get("/", (req, res) => {
	res.send("CozyShare backend is running successfully.");
});

// start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}`);
});
