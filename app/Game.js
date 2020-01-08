var Jogador = require('./GamePlayer.js');

function Game(id, idPlayer1, idPlayer2) {
    this.id = id;
    this.winner = 0;
    this.gameStatus = 1; // inicializado
  
    this.players = [new Jogador(idPlayer1), new Jogador(idPlayer2)];
  }
  
  module.exports = Game;