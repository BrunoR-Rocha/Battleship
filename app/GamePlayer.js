function GamePlayer(id)
{
    this.id = id;
    this.tiros = Array(10 * 10);
    this.navios = Array(10 * 10);
}

module.exports = GamePlayer;