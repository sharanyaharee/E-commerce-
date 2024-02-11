require('dotenv').config();

const Swal = require('sweetalert2')
const path = require('path');
const mongoose = require('mongoose')
const mongodb = require('mongodb')
const cors = require('cors')
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const logger = require('morgan');
var easyinvoice = require('easyinvoice');

const app = express();
//connect to DB

// mongoose.connect(process.env.MONGODB_LINK)
// .then((result)=>app.listen(process.env.PORT))
// .catch((err)=>console.log(err))

mongoose.connect(process.env.MONGODB_LINK)
  .then(() => {
      console.log('connected to mongodb database')
  })
  .catch((err) => {
      console.log('failed to connect to mongodb database');
      throw new Error(err);
  }).then((result)=>app.listen(process.env.PORT))
  .catch((err)=>console.log(err))

app.set('view engine','ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(cors())
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl:process.env.MONGODB_LINK})  ,
    cookie:{
        name:'myCookie',
        maxAge:1000*60*60*2,
        sameSite: true,
         }
           
  }));


const errorHandler = require('./middlewares/errorHandling');
  // for user routes
const userRoute = require('./routes/userRoutes');
app.use('/',userRoute);

// for admin routes
const adminRoute = require('./routes/adminRoutes');
app.use('/admin',adminRoute);

app.use('/admin/*', errorHandler.adminPageNotFound);
app.use('*', errorHandler.userPageNotFound);


 
