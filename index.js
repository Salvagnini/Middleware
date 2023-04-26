import express from 'express';
import mongoose from 'mongoose';
import { User } from './model/user.js';

import cookieParser from 'cookie-parser';

import cors from 'cors';
import csurf from 'csurf';
import jwt from 'jsonwebtoken';
const csrf = csurf({ cookie: true });

const PORT = 3000;
const url = 'mongodb://127.0.0.1:27017/client';
const app = express();

const checkToken = (req, res, next) => {
    const token = req.cookies.token;
    if (token) {
      jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
          return res.status(401).json({ message: 'Invalid token' });
        } else {
          next();
        }
      });
    } else {
      return res.status(401).json({ message: 'Token not found' });
    }};

const secretKey = 'mysecretkey';
app.use(express.static('css'));
app.use(express.urlencoded({extended: true}));

app.use(cookieParser());
app.set('view engine', 'pug');

app.use(cors({
    origin: 'https://itschool.com',  //для прикладу
    optionsSuccessStatus: 200
}));

app.get('/api/users', async (req, res) => {
    const users = await User.find();
    res.send({ users });
});

mongoose
    .connect(url)
        .then(()=> {
            console.log('Connected to DB');
            app.listen(PORT, ()=> {
                console.log(`Server started on http://localhost:${PORT}`);
            })
        })
        .catch((err)=> {console.log(`DB connection error: ${err}`)});

app.get("/", async (req, res) => {
  try {
    const title = {};
    let isAdmin = false;
    if (req.cookies.username) {
      title.text = `You are in administrator mode, to logout press `;
      title.link = "http://localhost:3000/logout";
      title.linkMessage = "log out";
      isAdmin = true;
    } else {
      title.text = "If you are admin please ";
      title.link = "http://localhost:3000/login";
      title.linkMessage = "log in";
      isAdmin = false;
    }
    const users = await User.find();
    res.render("index", { users, title, isAdmin });
  } catch (err) {
    console.log(err);
  }
});

app.post('/add', async (req, res) => {
    try{
        const user = new User(req.body);
        await user.save();
        res.redirect('/');
    } catch(err){
        console.log(err);
    }
});

app.get('/edit/:id', checkToken, async (req, res)=> {
    try{
        const user = await User.findById(req.params.id)
        res.render('edit', {user});
    } catch(err){
        console.log(err);
    }
});

app.post('/change-user/:id', async (req, res)=> {
    try{
        await User.findByIdAndUpdate(req.params.id, req.body);
        res.redirect('/');
    } catch(err){
        console.log(err);
    }
});

app.delete('/remove/:id',  async (req, res)=> {
    try{
        await User.deleteOne({_id: req.params.id})
        res.status(200).json({ message: 'User deleted' });
    } catch(err){
        console.log(err);
    }
});

app.get('/login', csrf, (req, res) => {
    res.render('login', { csrfToken: req.csrfToken() })
});

// Шлях /set-cookie отримує дані з форми запитом POST та зберігає їх у константи name та password. 
//Якщо name дорівнює 'admin' і password дорівнює '123' тоді створюється cookie з ім'ям username та значенням admin. 
//В іншому випадку йде переадресація на сторінку login.
//Шлях /logout за допомогою функції clearCookie('username') видаляє cookie з ім'ям username та робить переадресацію на головну сторінку

app.post('/set-cookie', csrf, async (req, res)=> {
    const {name, password} = req.body;
    if (name == 'admin' && password == '123') {
        const token = jwt.sign({ name }, secretKey, { expiresIn: '1h' });
        res.cookie('token', token);
        res.cookie('username', name);
        res.redirect('/');
    } else {
        res.redirect('/login')
    }
});

//У цьому коді csrf використовується як middleware для маршруту /set-cookie. Це означає, що перед тим, як обробник маршруту 
//async (req, res) => {... } буде викликаний, csrf перевірить наявність валідного токена CSRF у запиті.Якщо токен CSRF у запиті відсутній або
//недійсний, csrf поверне помилку і запит не буде продовжено.Перевірка токену досягається шляхом генерації та зберігання токена CSRF на сервері,
//який потім відправляється у клієнтський код у вигляді прихованого поля у формі.При надсиланні запиту на сервер, csrf перевіряє, що 
//відправлений токен CSRF відповідає очікуваному значенню.



app.get('/logout', (req, res) => {
    res.clearCookie('username');
    res.clearCookie('token');
    res.redirect('/')
});

