function Battle(id, player1, player2) {
    this.id = id;
   // this.currentPlayer = Math.floor(Math.random() * 2);
    //this.winningPlayer = null;
    //this.gameStatus = 1; // em progresso

    this.players = [player1, player2];
}

/*
Battle.prototype.getPlayerId = function(player) {
    return this.players[player].id;
  };*/

module.exports = Battle;
  
