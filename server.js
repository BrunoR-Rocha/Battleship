var express = require('express');
var http = require('http');
var ejs = require('ejs');
var socketio = require('socket.io');
var bodyParser = require('body-parser');
var Vue = require('vue');

var app = express();
app.set('view engine', 'ejs');

var mongoUtils = require('./mongoUtils');
var User = require('./model/User');

var server = http.Server(app);
var io = socketio(server);
const bcrypt = require("bcryptjs");

var BattleShip = require('./app/Game');

const PORT = 3000;

server.listen(PORT, function () {
   console.log('Server is running');
});

var users = {};
var actual_user = [];
var collections;
var gameCount = 1;
var ready = [];
var bothReady = false;


app.set('views', __dirname + '/views');

mongoUtils.conectToServer(function () {
   console.log("Listening on port 3000");
});


app.use(bodyParser.urlencoded({
   extended: true
}));

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


var user_id = [];
var user_name = [];
var userId = 0;
var counter0 = 0;
var counter1 = 0;

app.get('/game', (req, res) => {
   var name = req.query.user_name;
   var id = req.query.user_id;
   userId = id;

   user_id.push(id);
   user_name.push(name);



   var ships = [{
         'type': 'Aircraft carrier',
         'size': 5,
         'location': [],
         'hits': 0,
         'amount': 1,
         'image': 'https://images.vexels.com/media/users/3/166189/isolated/lists/606bbbaf01571d08eec77ff638eb2a6b-cargo-ship-silhouette.png'
      },
      {
         'type': 'Battleship',
         'size': 4,
         'location': [],
         'hits': 0,
         'amount': 1,
         'image': 'https://cdn0.iconfinder.com/data/icons/military-5/512/b77_1-512.png'
      },
      {
         'type': 'Submarine',
         'size': 3,
         'location': [],
         'hits': 0,
         'amount': 1,
         'image': 'https://cdn0.iconfinder.com/data/icons/military-5/512/b77_3-512.png'
      },
      {
         'type': 'Destroyer',
         'size': 2,
         'location': [],
         'hits': 0,
         'amount': 1,
         'image': 'https://cdn3.iconfinder.com/data/icons/war-6/512/b135_7-512.png'
      }
   ];



   res.render('game', {
      name: name,
      id: id,
      ships: ships,
   });
})


//var MyGames = require('./views/mygames.vue');

app.get('/mygames', (req, res) => {

   res.sendFile(__dirname + "/views" + '/mygames.html');

})

io.on('connection', (socket) => {
   console.log('Someone joined the server');
   //console.log(users);

   socket.join('espera');

   socket.on('join', function () {

      console.log(io.sockets.adapter.rooms['espera']);

      users[socket.id] = {
         jogo: null,
         numero: null
      };

      // users[socket.id] = nome;
      // console.log(users[socket.id]+' joined the chatroom'); 
      // console.log(users);
      // console.log(io.sockets.adapter.rooms['waiting players']);
      var players = getGamersWaiting('espera');

      // console.log(players.length);

      if (players.length >= 2) {

         var game = new BattleShip(gameCount++, players[0].id, players[1].id);

         var matrix = [];
         for (var i = 0; i < 10; i++) {
            matrix[i] = [];
            for (var j = 0; j < 10; j++) {
               matrix[i][j] = 0;
            }
         }


         var dados = {};
         collections = mongoUtils.getDriver();
         var opponent_id = 0;

         for (let i = 0; i < players.length; i++) {
            if (i == 0) {
               opponent_id = user_id[i + 1]
               dados = {
                  "id": user_id[i],
                  "opponent_id": opponent_id,
                  "name": user_name[i],
                  "matrix": matrix,
                  "game_id": game.id
               }
            }
            if (i == 1) {
               opponent_id = user_id[i - 1]
               dados = {
                  "id": user_id[i],
                  "opponent_id": opponent_id,
                  "name": user_name[i],
                  "matrix": matrix,
                  "game_id": game.id
               }
            }
            collections.collection('games').insertOne(dados);
         }


         // var dados = [game.id, ];
         // io.to('game' + game.id).emit('getOponent', dados);

         user_id = [];
         user_name = [];


         //console.log(game.players);

         players[0].leave('espera');
         players[1].leave('espera');

         players[0].join('game' + game.id);
         players[1].join('game' + game.id);

         users[players[0].id].numero = 0;
         users[players[0].id].jogo = game;
         users[players[1].id].numero = 1;
         users[players[1].id].jogo = game;
         //console.log(players[0]);


         io.to('game' + game.id).emit('start', game.id);
         console.log(io.sockets.adapter.rooms['game' + game.id]);
      }
      //io.emit('update'," ### "+users[socket.id]+" is prepared for battle  ###");
   });

   socket.on('message', function (message) {

      if (users[socket.id].jogo != null && message) {

         //mostra a mensagem para o utilizador conectado na sala 
         socket.broadcast.to('game' + users[socket.id].jogo.id).emit('message', {
            name: 'Adversario',
            message: message,
         });

         //mostra a mensagem para o utilizador atual, de modo a manter a organizaçao no chat
         io.to(socket.id).emit('message', {
            name: 'Eu',
            message: message,
         });
      }
   });




   socket.on('getOpponent', function (dados) {

      collections = mongoUtils.getDriver();

      var hit = collections.collection('games').find({
         id: dados[0],
         game_id: parseInt(dados[1])
      }).toArray(function (err, result) {
         if (err)
            throw err;


         if (result[0]) {

            socket.emit("setOpponent", result[0].opponent_id);
            // console.log("CLAUDIO" + result[0].opponent_id);
            // io.emit('setOpponent', result[0].opponent_id);

         }


      });

   });

   socket.on('tiro', function (shot) {
      var game = users[socket.id].jogo; // aqui obtens a informação do jogo

      collections = mongoUtils.getDriver();

      //mudança de turnos quando se da um tiro
      if (game.turno == 0) {

         console.log(game.turno + " tiro efetuado no " + shot[0].x + ' , ' + shot[0].y);

         console.log(shot[1] + "id do oponente");
         console.log(shot[2]);

         var matriz_adv = [];

         var hit = collections.collection('games').find({
            id: shot[1],
            game_id: parseInt(shot[2])
         }).toArray(function (err, result) {
            if (err)
               throw err;


            if (result[0]) {

               matriz_adv = result[0].matrix;
               // matriz_adv[0][0] = 3;

               console.log("TURNO" + game.turno + "VALOR" + matriz_adv[shot[0].x][shot[0].y]);

               if (matriz_adv[shot[0].x][shot[0].y] == 1) {
                  counter0++;  //adiciona a contador 
                  
                  // se na matriz.. no local indicado.. se tiver um barco... 1 ... muda para 2 .. atingido
                  matriz_adv[shot[0].x][shot[0].y] = 2;

                  //verifica se ja chegou ao numero maximo dos barcos = 14
                     if(counter0 == 14){
                        
                        io.to(socket.id).emit('gameWinner');
                        socket.broadcast.to('game' + users[socket.id].jogo.id).emit('gameLoser');
                     }

                  
                  game.turno = 0;
                  
               } else if (matriz_adv[shot[0].x][shot[0].y] == 0) {
                  matriz_adv[shot[0].x][shot[0].y] = 3;
                  game.turno = 1; // Se falhou, muda o turno, caso contrário continua a disparar
               }

               collections.collection('games').updateOne({
                  id: shot[1],
                  game_id: parseInt(shot[2])
               }, {
                  $set: {
                     matrix: matriz_adv
                  }
               });

               console.log("CELULAAAA ALTEROUUUU" + matriz_adv[shot[0].x][shot[0].y] + "," + shot[0].x + "," + shot[0].y);
               var dados = [matriz_adv[shot[0].x][shot[0].y], shot[0].x, shot[0].y, shot[1]];
               io.to('game' + game.id).emit('celulaAlterou', dados);

               // socket.broadcast.to('game' + users[socket.id].jogo.id).emit('celulaAlterou', dados);
               // io.to('game' + game.id).emit('celulaAlterou', dados);
               // socket.broadcast.to('game' + users[socket.id].jogo.id).emit('celulaAlterou', 'A');
               // socket.broadcast.to('game' + game.id).emit('celulaAlterou', 'A');




               // socket.broadcast.to('game' + users[socket.id].jogo.id).emit('hitBoat', local);
               if (game.turno == users[socket.id].numero) {
                  // console.log(socket.id + "pode disparar");
                  io.to(socket.id).emit('cant_Fire');
                  socket.broadcast.to('game' + users[socket.id].jogo.id).emit('canFire');
               }
            }
         });
         console.log("contador 0 " +counter0);

      } else if (game.turno == 1) {
         console.log(game.turno + " tiro efetuado no " + shot[0].x + ' , ' + shot[0].y);

         console.log(shot[1] + "id do oponente");
         console.log(shot[2]);

         var matriz_adv = [];

         var hit = collections.collection('games').find({
            id: shot[1],
            game_id: parseInt(shot[2])
         }).toArray(function (err, result) {
            if (err)
               throw err;


            if (result[0]) {

               matriz_adv = result[0].matrix;
               // matriz_adv[0][0] = 3;

               console.log("TURNO" + game.turno + "VALOR" + matriz_adv[shot[0].x][shot[0].y]);

               if (matriz_adv[shot[0].x][shot[0].y] == 1) {
                  counter1++//adiciona a contador

                  matriz_adv[shot[0].x][shot[0].y] = 2;

                  if(counter1 == 14){
                     io.to(socket.id).emit('gameWinner');
                     socket.broadcast.to('game' + users[socket.id].jogo.id).emit('gameLoser');
                  }

                  // se na matriz.. no local indicado.. se tiver um barco... 1 ... muda para 2 .. atingido
                  
                  game.turno = 1;
                  //adiciona a contador
               } else if (matriz_adv[shot[0].x][shot[0].y] == 0) {
                  matriz_adv[shot[0].x][shot[0].y] = 3;
                  game.turno = 0; // Se falhou, muda o turno, caso contrário continua a disparar
               }

               collections.collection('games').updateOne({
                  id: shot[1],
                  game_id: parseInt(shot[2])
               }, {
                  $set: {
                     matrix: matriz_adv
                  }
               });


               console.log("CELULAAAA ALTEROUUUU" + matriz_adv[shot[0].x][shot[0].y] + "," + shot[0].x + "," + shot[0].y);
               var dados = [matriz_adv[shot[0].x][shot[0].y], shot[0].x, shot[0].y, shot[1]];
                              io.to('game' + game.id).emit('celulaAlterou', dados);

               // socket.broadcast.to('game' + users[socket.id].jogo.id).emit('hitBoat', local);
               // console.log("CLAUUU" + shot[1] + " " + game.turno + " " + users[socket.id].numero);

               if (game.turno == users[socket.id].numero) {
                  // console.log(socket.id + "pode disparar");
                  io.to(socket.id).emit('cant_Fire');
                  socket.broadcast.to('game' + users[socket.id].jogo.id).emit('canFire');
               }
               
            }
         })
         console.log("Contador 1 " + counter1);
      }
   });


   var matriz_sec = [];

   var cells = [];

   socket.on('place', function (coord) {

      cells.push([coord[1], coord[0]]);


      if (cells.length == coord[2]) {
         // Já recebeu todas as células do barco

         collections = mongoUtils.getDriver();
         console.log(coord[4] + "game_id ");


         // console.log(coord[1] + " , " + coord[0]); // x, y


         // collections.collection('games').remove({});

         // Ler matriz da BD aqui
         var teste = collections.collection('games').find({
            id: coord[3], //coord[3] -> user_id
            game_id: coord[4]
         }).toArray(function (err, result) {
            if (err)
               throw err;

            matriz_sec = result[0].matrix;

            // console.log("teste" + cells.length);

            for (var i = 0; i < cells.length; i++) {

               matriz_sec[cells[i][0]][cells[i][1]] = 1;

               // console.log("x" + matriz_sec[cells[i][0]][cells[i][1]]);

            }

            collections.collection('games').updateOne({
               id: coord[3],
               game_id: coord[4]
            }, {
               $set: {
                  matrix: matriz_sec
               }
            });
            cells = [];
         });
      }
   });

   //sinal que o utilizador quer sair do jogo

   socket.on('leave', function () {

      // se o jogo ainda nao tiver terminado ... 
      //guarda o jogo por completo .. ultimos updates se necessario

      socket.broadcast.to('game' + users[socket.id].jogo.id).emit('avisoSaida', {
         message: 'Opponent has left the game'
      });

      socket.leave('game' + users[socket.id].jogo.id);

      users[socket.id].jogo = null; // deixa de ter um jogo associado
      users[socket.id].numero = null; // deixa de ter um numero de jogador em jogo

      //redireciona para a pagina main; 
      //efetuado simultaneamente atraves de um pedido POST
   });

   socket.on('pronto', function (id) {
      console.log("Jogador " + id + " está pronto");
      ready.push(id);

      if (ready.length == 2) {
         var bothReady = true;
      }

      if (bothReady) {
         var game = users[socket.id].jogo; // aqui obtens a informação do jogo

         var chooseRandomPlayer = Math.floor(Math.random() * 2); //escolhe um random entre  0 e 1

         game.turno = chooseRandomPlayer;
         //console.log(game);
         if (game.turno == users[socket.id].numero) {

            console.log(game.turno + " " + socket.id + " pode disparar");

            io.to(socket.id).emit('canFire');
            socket.broadcast.to('game' + users[socket.id].jogo.id).emit('cant_Fire');
         } else {
            console.log(game.turno + " " + socket.id + " pode disparar");

            io.to(socket.id).emit('canFire');
            socket.broadcast.to('game' + users[socket.id].jogo.id).emit('cant_Fire');
         }
      }
   });
});

function getGamersWaiting(room) {

   var gamers = [];

   for (var id in io.sockets.adapter.rooms[room].sockets) {
      gamers.push(io.sockets.adapter.nsp.connected[id]);
   }

   return gamers;
}

app.post('/register', function (req, res) {
   var name = req.body.name;
   var email = req.body.email;
   var password = req.body.password;
   var password2 = req.body.password2;

   if (!name || !email || !password) {
      console.log("Incomplete Information");
   } else if (password == password2) {

      bcrypt.hash(password, 8, (err, hashedPassword) => {
         if (err) {
            return err;
         }
         collections = mongoUtils.getDriver();
         var user = collections.collection('users').find({
            email: email
         }).toArray(function (err, result) {
            if (err)
               throw err;;
            //verifica se existe mais algum utilizador com aquele email
            if (!result[0]) {
               var dados = {
                  "name": name,
                  "email": email,
                  "password": hashedPassword,
               }

               collections.collection('users').insertOne(dados);

               res.redirect('/login');
            } else {
               console.log("Utilizador já  registado");
               res.redirect('/register');
            }
         })
      });
   } else {
      console.log("Erro de insercao");
   }
});

//rota que trata do pedido para ir para a pagina principal quando sai de um jogo
//os valores sao passados pela submissao de um formulario com valores hidden na pagina de jogo
app.post('/mainMenu', (req, res) => {
      res.render('main', {
      name: req.body.name,
      id: req.body.id,
   })
})

app.post('/main', function (req, res) {

   var name = req.body.email;
   var password = req.body.password;

   collections = mongoUtils.getDriver();

   collections.collection('users').find({
      email: name
   }).toArray(function (err, result) {
      if (err)
         throw err;

      if (!result[0]) {
         res.redirect('/login');
      } else {
         // console.log(result[0].password);
         bcrypt.compare(password, result[0].password, (err, isMatch) => {
            //se as palavra passe coincidir com a da base de dados
            if (isMatch) {
               //users.push(result[0]);
               res.render('main', {
                  name: result[0].name,
                  id: result[0]._id
               });
            } else {
               console.log("Invalid Password");
               res.redirect('/login'); // mostrar mensagem de erro - password incorreta
            }
         });
      }
   })
});