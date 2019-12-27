/*import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import Vue from 'vue';*/


var express  = require('express');
var http     = require('http');
var ejs      = require('ejs');
var socketio = require('socket.io');
var bodyParser = require('body-parser');

var app = express();
app.set('view engine','ejs');

var mongoUtils = require('./mongoUtils');
var User = require('./model/User');

var server = http.Server(app);
var io = socketio(server);
const bcrypt = require("bcryptjs"); 

const PORT = 3000;

server.listen(PORT, function(){
   console.log('Server is running');
});

var users = [];
var actual_user = [];

app.set('views',__dirname+'/views');

mongoUtils.conectToServer(function(){
      console.log("Listening on port 3000");
});


app.use(bodyParser.urlencoded({ extended: true })); 

app.use(bodyParser.json()); 

app.get('/', (req, res) => {
   res.sendFile(__dirname +"/views"+ '/welcome.html');
});

app.get('/register', (req, res) =>{
   res.sendFile(__dirname +"/views"+ '/register.html');
});

app.get('/login', (req, res) =>{
   res.sendFile(__dirname +"/views"+ '/login.html');
});

app.get('/main', (req, res) =>{
   if(users.length == 0){
      res.redirect('/');
   }else{
      res.render('main');
   }
   //res.sendFile(__dirname +"/views"+ '/main.html');
});

app.get('/game',(req,res)=>{
   //res.sendFile(__dirname +"/views"+ '/game.html');
   if(users.length == 0){
      res.redirect('/');
   }else{
      res.render('game');
   }
})

app.get('/mygames',(req,res)=>{
   res.sendFile(__dirname +"/views"+ '/mygames.html');
})


io.on('connection',(socket) => {
   console.log('Someone joined the server'); 
   console.log(users);
   console.log(actual_user);

   socket.on('join',function(nome){
      users[socket.id] = nome;
      console.log(users[socket.id]+' joined the chatroom'); 
      console.log(users);
      io.emit('update'," ### "+users[socket.id]+" is prepared for battle  ###");
  });

   /*connections.push(socket);
   console.log(' %s sockets is connected', connections.length);

   socket.on('disconnect', () => {
      connections.splice(connections.indexOf(socket), 1);
   });

   socket.on('sending message', (message) => {
      console.log('Message is received :', message);

      io.sockets.emit('new message', {message: message});
   });*/
});

app.post('/register', function (req,res){
   var name = req.body.name;
   var email = req.body.email;
   var password = req.body.password;
   var password2 = req.body.password2;
   
   if(!name || !email || !password){
      console.log("Incomplete Information");
   }  
   else if(password == password2){
   
         bcrypt.hash(password, 8, (err, hashedPassword) => { 
            if (err) { 
               return err; 
            } 
            var dados = {
               "name": name,
               "email":email,
               "password": hashedPassword,
            }

            collections = mongoUtils.getDriver();

            users.push(dados);
            console.log(users);

            collections.collection('users').insertOne(dados);

            res.redirect('/main');
         });
   }
   else{
      console.log("Erro de insercao");
   }   
});

app.post('/login', function (req,res) {

   var name = req.body.email;
   var password = req.body.password;

   collections = mongoUtils.getDriver();

   collections.collection('users').find({email:name}).toArray(function(err, result){

      if(result[0] == undefined){
         res.redirect('/login');
      }else{
           // console.log(result[0].password);
            bcrypt.compare(password, result[0].password, (err, isMatch) => { 
               //se as palavra passe coincidir com a da base de dados
               if(isMatch){
                  users.push(result[0]);
                  actual_user = result[0];
                  res.redirect('/main'); // passa os valores do utilizador - Nome e email
               }else{
                  res.redirect('/login'); // mostrar mensagem de erro - password incorreta
               }
            });
         }
      })
});
