const express = require('express');
const cors = require('cors')
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const { connectDb } = require('./config/db');

// env configuration
dotenv.config();

// Routes
const authRouter = require('./routes/auth.routes');
const userRouter = require('./routes/user.routes');
const clientRouter = require('./routes/client.routes');
const contestRouter = require('./routes/contest.routes');


const app = express();

// body parsers
app.use(express.json());
app.use(cookieParser());

// cors coniguration
let whitelist = ["http://localhost:8005",];

// app.use(cors({
//   origin: function(origin, callback){
//     if(whitelist.indexOf(origin) !== -1){
//       callback(null, true);
//     }else{
//       callback(new Error("Not Allowed by Cors"));
//     }
//   },
//   methods: ["GET", "POST", "PUT", "DELETE"],
//   credentials: true,
// }));

// app.all(/.*/, function(req, res, next) {
//   let origin = whitelist.includes(req.header("origin").toLocaleLowerCase())
//   ? req.headers.origin 
//   : "http://localhost:8000";

//   if(whitelist.indexOf(origin)!==-1){
//     res.header("Access-control-Allow-Origin", origin);
//     res.header(
//       "Access-Control-Allow-Headers",
//       "Origin, X-Requested-With, Content-Type, Accept"
//     );
//     next();
//   }else{
//     res.status(500).send("Not Allowed")
//   }
// });

app.use(cors({
  origin : whitelist,
  credentials: true
}))

// db Connection
connectDb();

app.get('/', (req, res) => {
  res.send('Hello From Scan to Vote');
});

app.use('/auth', authRouter);
app.use('/user', userRouter);
app.use('/client', clientRouter);
app.use('/contest', contestRouter);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});