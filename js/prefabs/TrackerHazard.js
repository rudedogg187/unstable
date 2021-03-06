var Unstable = Unstable || {};

Unstable.TrackerHazard = function (game_state, position, properties) {
    "use strict";
    Unstable.Prefab.call(this, game_state, position, properties);

    game_state.game.physics.arcade.enable(this);

    this.speed = parseInt(properties.speed);
    // this.body.velocity.setTo(parseInt(properties.velocityX), parseInt(properties.velocityY));
    this.body.bounce.set(1);

    this.body.setSize(14, 6, 5, 18);
    this.anchor.setTo(0.5, 1);

    this.shadowOffset = 2;
    this.shadow = game.add.sprite(position.x, position.y + this.shadowOffset, "shadow");
    this.shadow.anchor.setTo(0.5, 1);
    this.shadow.alpha = 0.4;
    this.game_state.groups["shadows"].add(this.shadow);

    this.animations.add("bomb_move", [0, 1, 2, 3], 8, true);
    this.animations.play("bomb_move");

    this.gameState = game_state;

    // this.emitter = new Unstable.Emitter(game_state,{x:this.x,y:this.y},{
    //   offset:{x: 10,y: -18},
    //   maxParticles: 10,
    //   width: 2,
    //   minParticleSpeed: {x: 60, y: -10},
    //   maxParticleSpeed: {x: 80, y: -30},
    //   gravity: 5,
    //   burst: false,
    //   lifetime: 150,
    //   frequency: 65,
    //   particleClass: "fuse",
    //   scale: {
    //     minX: 1,
    //     maxX: 0.3,
    //     minY: 1,
    //     maxY: 0.3,
    //     rate: 300,
    //     ease: Phaser.Easing.Exponential.In,
    //     yoyo: false
    //   }
    // });

    this.explosionEmitter = new Unstable.Emitter(game_state, {x:this.x, y:this.y},{
      offset:{x: 0, y: -12},
      maxParticles: 30,
      width: 2,
      minParticleSpeed: {x: -40, y: -40},
      maxParticleSpeed: {x: 40, y: 40},
      gravity: 0,
      burst: true,
      lifetime: 0,
      frequency: 30,
      particleClass: "fuse",
      scale: {
        minX: 1,
        maxX: 0,
        minY: 1,
        maxY: 0,
        rate: 3500,
        ease: Phaser.Easing.Exponential.In,
        yoyo: false
      }
    });

    this.spawnpoint = {x: this.x, y: this.y};

    this.game_state.aliveBombCount++;
};

Unstable.TrackerHazard.prototype = Object.create(Unstable.Hazard.prototype);
Unstable.TrackerHazard.prototype.constructor = Unstable.TrackerHazard;

Unstable.TrackerHazard.prototype.update = function() {
  this.game_state.game.physics.arcade.collide(this, this.game_state.groups.colliders);

  var x = 0;
  var y = 0;

  var xDiff = this.gameState.player.x - this.x;
  if (Math.abs(xDiff) < 2) {
      x = 0;
  } else if (xDiff < 0) {
      x = -this.speed;
  } else if (xDiff > 0) {
      x = this.speed;
  }

  var yDiff = this.gameState.player.y - this.y;
  if (Math.abs(yDiff) < 2) {
      y = 0;
  } else if (yDiff < 0) {
      y = -this.speed;
  } else if (yDiff > 0) {
      y = this.speed;
  }

  this.body.velocity.setTo(x, y);

  if (this.body.velocity.x > 0) {
    this.scale.x = 1;
    // this.emitter.flipDirection(-1);
  } else {
    this.scale.x = -1;
    // this.emitter.flipDirection(1);
  }

  this.shadow.x = this.x;
  this.shadow.y = this.y + this.shadowOffset;
  // this.emitter.updatePos(this.x, this.y);
}

Unstable.TrackerHazard.prototype.die = function() {
  this.kill();
  this.shadow.kill();
  // this.emitter.destroy();
  this.game_state.aliveBombCount--;
  this.explosionEmitter.burst(this.x, this.y);
  this.explosionEmitter.seekParticlesToLocation(this.spawnpoint);
}
