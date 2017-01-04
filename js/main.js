var Unstable = Unstable || {};

// var game = new Phaser.Game("100%", "100%", Phaser.AUTO);
var game = new Phaser.Game(480, 480, Phaser.AUTO);
game.state.add("BootState", new Unstable.BootState());
game.state.add("LoadingState", new Unstable.LoadingState());
game.state.add("LevelManager", new Unstable.LevelManagerState());
game.state.add("GameState", new Unstable.TiledState());
game.state.start("BootState", true, false, "assets/levels/game_data.json");
