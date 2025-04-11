require("rootpath")();
require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const errorHandler = require("_middleware/error-handler");
const db = require("./_helpers/db"); // make sure to include this!

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Serve uploaded profile images
app.use("/profile-uploads", express.static("profile-uploads"));

// API Routes
app.use("/accounts", require("./accounts/accounts.controller"));
app.use("/uploads", require("./upload/uploads.controller"));
app.use("/profile-uploads", require("./upload/profile-uploads.controller"));
app.use("/api-docs", require("_helpers/swagger"));
app.use("/attendances", require("./attendances/attendances.controller"));
app.use("/action-logs", require("./attendances/action_logs.controller"));
app.use("/payslips", require("./payslips/payslips.controller"));
app.use("/leaves", require("./leaves/leaves.controller"));
app.use("/calendars", require("./calendars/calendars.controller"));

// Global Error Handler
app.use(errorHandler);

// Wait for DB initialization before starting server
db.ready
  .then(() => {
    const port = process.env.PORT || 4000;
    app.listen(port, () => console.log(`Server listening on port ${port}`));
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
  });
