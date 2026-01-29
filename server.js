const express = require('express');
const cors = require('cors')
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const { connectDb } = require('./config/db');

// env configuration
dotenv.config();

// Routes
const authRouter = require('./routes/auth.routes');
const app = express();

// body parsers
app.use(express.json());
app.use(cookieParser());

// cors
app.use(cors({
  origin: "http://localhost:8000",
  credentials: true, 
}))

// db Connection
connectDb();

app.get('/', (req, res) => {
  res.send('Hello From Scan to Vote');
});

app.use('/auth', authRouter);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});