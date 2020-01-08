var express  = require('express');
var http     = require('http');
var ejs      = require('ejs');
var socketio = require('socket.io');
var bodyParser = require('body-parser');
var Battle = require('./js/battle.js');

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
var numJogo = 1;
var actual_user = [];
var collections;

app.set('views',__dirname+'/views');

mongoUtils.conectToServer(function(){
      console.log("Listening on port 3000");
});


app.use(bodyParser.urlencoded({ extended: true })); 

app.use(bodyParser.json());

app.get('/', (req, res) => {
   res.sendFile(__dirname + "/views" + '/welcome.html');
});

app.get('/register', (req, res) => {
   res.sendFile(__dirname + "/views" + '/register.html');
});

app.get('/login', (req, res) => {
   res.sendFile(__dirname + "/views" + '/login.html');
});

app.get('/game',(req,res)=>{

   var name = req.query.user_name;
   var id = req.query.user_id;

   res.render('game',{name : name, id: id});
})

app.get('/mygames',(req,res)=>{
   res.sendFile(__dirname +"/views"+ '/mygames.html');
})


io.on('connection',(socket) => {
   console.log('Someone joined the server'); 
   //console.log(users);

   users[socket.id] = {
      game: null,
      jogador: null
    }; 


   socket.join('waiting players');

   
   //joinWaitingPlayers();

   socket.on('join',function(nome){
      users[socket.id] = nome;
      console.log(users[socket.id]+' joined the chatroom'); 
      //console.log(users);

      //joinPlayers();
      var players = getGamersWaiting('waiting players');
      //console.log(users);
      console.log(players.length);
      /*if(players.length >= 2){
        // io.emit('start');
         var jogo = new Battle(numJogo++, players[0], players[1]);
         //console.log(jogo);

         //sair da sala de espera para iniciar o jogo
         players[0].leave('waiting players');
         players[1].leave('waiting players');

         players[0].join('game' + jogo.id);
         players[1].join('game'+ jogo.id);

         /*
            users[players[0].id].game = jogo;
            users[players[1].id];
            console.log(users[players[0].id].game);
         */

        /* console.log(io.sockets.adapter.rooms['game'+ jogo.id]);
         io.to('game'+jogo.id).emit('start', jogo.id);

         
      }*/

      //io.emit('update'," ### "+users[socket.id]+" is prepared for battle  ###");
  });

  socket.on('sending message', (message) => {
   console.log('Message is received :', message);
   
   io.emit('chat message server', {message: message});
});
   
});


 function getGamersWaiting(room) {

      var gamers=[];

      for (var id in io.sockets.adapter.rooms[room].sockets) {
         gamers.push(io.sockets.adapter.nsp.connected[id]);
       }

      return gamers;
 }
 

app.post('/register', function (req,res){
   var name = req.body.name;
   var email = req.body.email;
   var password = req.body.password;
   var password2 = req.body.password2;

   if (!name || !email || !password) {
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

      bcrypt.hash(password, 8, (err, hashedPassword) => {
         if (err) {
            return err;
         }
         var dados = {
            "name": name,
            "email": email,
            "password": hashedPassword,
         }

         collections = mongoUtils.getDriver();

         users.push(dados);
         console.log(users);

            res.redirect('/login');
         });
   }
});

app.post('/main', function (req,res) {

   var name = req.body.email;
   var password = req.body.password;

   collections = mongoUtils.getDriver();

   collections.collection('users').find({email:name}).toArray(function(err, result){
      if(err)
      throw err;

      if(!result[0]){
         res.redirect('/login');
      }
      else{
           // console.log(result[0].password);
            bcrypt.compare(password, result[0].password, (err, isMatch) => { 
               //se as palavra passe coincidir com a da base de dados
               if(isMatch){
                  //users.push(result[0]);
                  res.render('main', {name: result[0].name, id: result[0]._id});
               }else{
                  console.log("Invalid Password");
                  res.redirect('/login'); // mostrar mensagem de erro - password incorreta
               }
            });
         }
      })
});

