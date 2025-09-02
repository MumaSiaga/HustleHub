const express=require('express');
const path =require('path');
const app=express();

const service = require('./backend/routes/serviceRoutes');
const employerhome = require('./backend/routes/employerRoutes');


const port=process.env.PORT||3000;
const session = require('express-session');
const passport = require('passport');
require('dotenv').config();
require('./config/auth');
require('./config/db');

app.use('/employer', employerhome);
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public', 'views'));
app.set('trust proxy',1);
app.use('/styles', express.static(path.join(__dirname, 'public','styles')));
app.use('/scripts', express.static(path.join(__dirname, 'public','scripts')));
app.use('/visuals', express.static(path.join(__dirname,'visuals')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'secretkey',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Parse JSON bodies (optional)
app.use(express.json());

app.use('/', require('./backend/routes/index'));
app.use('/auth', require('./backend/routes/authRoutes'));
app.use('/service', require('./backend/routes/serviceRoutes'));
app.use('/employer', require('./backend/routes/employerRoutes'));





app.listen(port,()=>{
    console.log(`Server is running on ${port}`);
});
