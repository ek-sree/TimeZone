const express = require('express');
require('dotenv').config()
const path = require('path');
const usrouter = require('./server/routers/userRoute')
const adrouter = require('./server/routers/adminRoute')
const flash = require('express-flash');
const session = require('express-session');
const mongoose = require('mongoose')
const multer = require('multer')
const nocache = require('nocache')

const app = express();

const MONGO_URL = process.env.MONGO_URL




mongoose
.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
.then(()=>{
  console.log("Database connected");
})
.catch((err)=>{
  console.log(err);
})

app.use(function(req,res,next){
    res.header('Cache-Control','private, no-cache, no-store, must-revalidate')
    res.header('Expires', '-1')
    res.header('Pragma', 'no-cache')
    next()
})

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

app.use(flash({
    sessionKeyName:'flashMessage',
    useViewEngine:true
}))

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public/userassets')))
app.use(express.static(path.join(__dirname,'public/adminassets')))

// Add this line in your server setup
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


const storage = multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,'uploads')
    },
    filename:(req,file,cb)=>{
        cb(null, Date.now() + path.extname(file.originalname))
    }
})

const uploads = multer({storage:storage})


app.use("/", usrouter)
app.use('/admin', adrouter)

app.get('*',(req,res)=>{
    res.render('user/404')
})

const port = 3000;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
