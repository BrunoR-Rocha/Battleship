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

var BattleShip = require('./app/Game');

const PORT = 3000;

server.listen(PORT, function(){
   console.log('Server is running');
});

var users = {};
var actual_user = [];
var collections;
var gameCount = 1;

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

   socket.join('waiting players');

   //joinWaitingPlayers();

   socket.on('join',function(){

      users[socket.id] = {
         inGame: null,
         numero: null
       }; 

      // users[socket.id] = nome;
      //console.log(users[socket.id]+' joined the chatroom'); 
      //console.log(users);
      //console.log(io.sockets.adapter.rooms['waiting players']);
      var players = getGamersWaiting('waiting players');

      console.log(players.length);
      
      if(players.length >= 2){

         var game = new BattleShip(gameCount, players[0].id, players[1].id);

         //console.log(game.players);

         players[0].leave('waiting players');
         players[1].leave('waiting players');

         players[0].join('game'+ game.id);
         players[1].join('game'+ game.id);

        // console.log(users);
        
         users[players[0].id].numero = 0;
         users[players[1].id].numero = 1;
         users[players[0].id].inGame = game;
         users[players[1].id].inGame = game;

         console.log(users);
         
         io.to('game' + game.id).emit('start', game.id);
         //console.log(io.sockets.adapter.rooms['waiting players']);
         
         //console.log(io.sockets.adapter.rooms['game'+ game.id]);
      }
      //io.emit('update'," ### "+users[socket.id]+" is prepared for battle  ###");
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
