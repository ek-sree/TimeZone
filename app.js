const express = require('express');
const path = require('path');
const usrouter = require('./server/routers/userRoute')
const adrouter = require('./server/routers/adminRoute')
const flash = require('express-flash');
const session = require('express-session');

const app = express();

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public/userassets')))
app.use(express.static(path.join(__dirname,'public/adminassets')))


app.use("/", usrouter)
app.use('/admin', adrouter)


const port = 3000;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
