var Unstable = Unstable || {};

Unstable.Player = function(game_state, position, properties) {
  "use strict";
  Unstable.Prefab.call(this, game_state, position, properties);

  this.walking_speed = 150;
  this.jumping_speed = 30;
  this.bouncing = 5;

  this.score = 0;

  // this.game_state.game.physics.arcade.enable(this);
  // this.body.collideWorldBounds = true;

  this.anchor.setTo(0.5);
  // this.body.setSize(16, 12, 0, 12);

  this.shadowOffset = 2;
  this.shadow = game.add.sprite(-1, this.shadowOffset, "shadow", 1);
  this.shadow.anchor.setTo(0.5,0.5);
  this.shadow.alpha = 0.4;
  this.game_state.groups["shadows"].add(this.shadow);
  //this.addChild(this.shadow);

  this.animations.add("player_run", [2, 3, 4, 5], 10, true);
  this.animations.add("player_idle", [0, 1], 1, true);

  this.animations.play("player_idle");

  this.cursors = this.game_state.game.input.keyboard.createCursorKeys();

  this.game_state.game.physics.p2.enable(this);
  this.body.setCollisionGroup(this.game_state.collision_groups[properties.cgroup]);
  this.game_state.render_groups[properties.rgroup].add(this);
  this.body.collides(this.game_state.collision_groups["coins"], this.coinCollide, this);
  this.body.collides(this.game_state.collision_groups["colliders"]);
  this.body.fixedRotation = true;
}

Unstable.Player.prototype = Object.create(Unstable.Prefab.prototype);
Unstable.Player.prototype.constructor = Unstable.Player;

Unstable.Player.prototype.update = function() {
  // this.game_state.game.physics.arcade.collide(this, this.game_state.layers.collision);
  // this.game_state.game.physics.arcade.collide(this, this.game_state.groups.colliders);
  // this.game_state.game.physics.arcade.collide(this, this.game_state.groups.goal, this.goalCollide, null, this);
  // this.game_state.game.physics.arcade.collide(this, this.game_state.groups.coins, this.coinCollide, null, this);
  // this.game_state.game.physics.arcade.collide(this, this.game_state.groups.hazards, this.hazardCollide, null, this);

  if (this.cursors.right.isDown && this.body.velocity.x >= 0) {
      // move right
      this.body.velocity.x = this.walking_speed;
      this.animations.play("player_run");
      this.scale.setTo(1, 1);
  } else if (this.cursors.left.isDown && this.body.velocity.x <= 0) {
      // move left
      this.body.velocity.x = -this.walking_speed;
      this.animations.play("player_run");
      this.scale.setTo(-1, 1);
  } else {
      // stop
      this.body.velocity.x = 0;
  }
  if (this.cursors.down.isDown && this.body.velocity.y >= 0) {
    //move down
    this.body.velocity.y = this.walking_speed;
    this.shadow.y = this.y + this.shadowOffset * 2;
    this.animations.play("player_run");
  } else if (this.cursors.up.isDown && this.body.velocity.y <= 0) {
    //move up
    this.body.velocity.y = -this.walking_speed;
    this.shadow.y = this.y + this.shadowOffset * 2;
    this.animations.play("player_run");
  } else {
    //stop
    this.body.velocity.y = 0;
    this.shadow.y = this.y + this.shadowOffset;
  }
  if (this.body.velocity.x == 0 && this.body.velocity.y == 0) {
    this.animations.play("player_idle");
  }

  this.shadow.x = this.x - 1;
}

Unstable.Player.prototype.goalCollide = function(player, goal) {
  "use strict";
  //this.game_state.restart_level();
  this.game.state.start("LevelManager", true, false, this.game_state.level_data);
}

Unstable.Player.prototype.coinCollide = function(playerBody, coinBody) {
  "use strict";
  if (!coinBody.sprite.collided) {
    coinBody.sprite.collided = true;
    coinBody.sprite.die();
    this.score += 1;
    console.log("score: " + this.score);
  }
}

Unstable.Player.prototype.hazardCollide = function(player, hazard) {
  "use strict";
  player.die();
  hazard.die();
}

Unstable.Player.prototype.die = function() {
  this.kill();
  this.shadow.kill();
}
