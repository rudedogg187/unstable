var Unstable = Unstable || {};

Unstable.TiledState = function () {
    "use strict";
    Phaser.State.call(this);
};

Unstable.TiledState.prototype = Object.create(Phaser.State.prototype);
Unstable.TiledState.prototype.constructor = Unstable.TiledState;

Unstable.TiledState.prototype.init = function (level_data, spawnGoalId) {
    "use strict";
    this.level_data = level_data;
    this.spawnGoalId = spawnGoalId;

    // start physics system
    this.game.physics.startSystem(Phaser.Physics.ARCADE);

    this.groups = {};
    this.groups["clouds"] = this.game.add.group();

    // create map and set tilesets
    this.map = this.game.add.tilemap(level_data.map.key);
    this.map.addTilesetImage("base", level_data.map.tileset);
    this.map.addTilesetImage("collision", "collision");

    this.bombSound;
    this.aliveBombCount = 0;

    Unstable.Emitter.init();

    this.spawnGoalCoords = {x: 0, y: 0};
};

Unstable.TiledState.prototype.create = function () {
    "use strict";
    var group_name, object_layer, collision_tiles;

    this.goals = [];
    this.teleporters = [];
    this.collisionMap = [];

    this.coins = 0;

    // this.groups = {};
    this.groups["colliders"] = this.game.add.group();
    this.groups["enemy_colliders"] = this.game.add.group();


    // create map layers
    this.layers = {};
    this.map.layers.forEach(function (layer) {
        if (!layer.properties.collision) {
          this.layers[layer.name] = this.map.createLayer(layer.name);
        } else { // collision layer
            layer.data.forEach(function (data_row) { // find tiles used in the layer
                var row = [];
                data_row.forEach(function (tile) {
                  if (tile.index > 0) {
                    var groupName;
                    if (tile.properties.type === 'enemy_only') {
                        groupName = "enemy_colliders";
                    } else {
                        row.push(1);
                        groupName = "colliders";
                    }
                    new Unstable.Collider(this, {x:tile.x * 24,y:tile.y * 24}, {group: groupName,texture:"",width:24,height:24});
                  } else {
                    row.push(0);
                  }
                }, this);
                this.collisionMap.push(row);
            }, this);
        }
    }, this);
    // resize the world to be the size of the current layer
    this.layers[this.map.layer.name].resizeWorld();

    // create groups
    this.level_data.groups.forEach(function (group_name) {
        this.groups[group_name] = this.game.add.group();
    }, this);

    this.prefabs = {};
    this.player;

    for (object_layer in this.map.objects) {
        // get the type of an object from tiled tilesheet + gid information
        if (this.map.objects.hasOwnProperty(object_layer)) {
            // create layer objects
            this.map.objects[object_layer].forEach(this.create_object, this);
        }
    }

    var restart_key = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    restart_key.onDown.add(this.restart_level, this);

    this.backdropManager = new Unstable.BackdropManager(this);

    if (this.spawnGoalId) {
      this.player.respawnEffect(this.spawnGoalCoords, {
        x: this.spawnGoalCoords.x,
        y: this.spawnGoalCoords.y + 12
      });
    }
};

Unstable.TiledState.prototype.update = function() {
  this.groups["objects"].sort('y', Phaser.Group.SORT_ASCENDING); //depth sorting
  if (this.bombSound !== undefined) {
    if (this.aliveBombCount > 0) {
      if (!this.bombSound.isPlaying) {
        this.bombSound.play();
      }
    } else {
      this.bombSound.stop();
    }
  }
}

Unstable.TiledState.prototype.getPrefabProperties = function (type, properties) {
  properties = properties || {};
  if (this.isBush(type)) {
      properties.texture = type;
      type = "bush";
  } else if (this.isTree(type)) {
      properties.texture = type;
      type = "tree";
  }
  var finalProperties = {};
  Object.assign(finalProperties, this.level_data.prefabs[type].properties);
  Object.getOwnPropertyNames(properties).forEach( function(property) {
    if (properties.hasOwnProperty(property)) {
      if (finalProperties.hasOwnProperty(property) ||
        (this.level_data.prefabs[type].hasOwnProperty("required_properties") &&
        this.level_data.prefabs[type].required_properties.includes(property))) {
          //override default property
          finalProperties[property] = properties[property];
      } else {
        console.error("Game data does not contain the property [" + property + "] for [" + type + "].");
      }
    }
  }, this);
  if (this.level_data.prefabs[type].hasOwnProperty("required_properties")) {
    this.level_data.prefabs[type].required_properties.forEach( function(requiredProperty) {
      if (!finalProperties.hasOwnProperty(requiredProperty)) {
        console.error("Prefab [" + type + "] does not contain required property [" + requiredProperty + "]");
      }
    }, this);
  }
  return finalProperties;
};

Unstable.TiledState.prototype.create_object = function (object) {
    "use strict";
    var position, prefab, properties;
    // tiled coordinates starts in the bottom left corner
    position = {"x": object.x, "y": object.y - (this.map.tileHeight)};
    properties = this.getPrefabProperties(object.type, object.properties);

    if (this.isBush(object.type)) {
        object.type = "bush";
    } else if (this.isTree(object.type)) {
        object.type = "tree";
    }

    // create object according to its type
    switch (object.type) {
    case "player":
      if (this.spawnGoalId) {
        properties.spawnFromGoal = true;
      }
      prefab = new Unstable.Player(this, position, properties);
      this.player = prefab;
      break;
    case "goal":
      prefab = new Unstable.Goal(this, position, properties);
      this.goals.push(prefab);
      if ((this.spawnGoalId !== null && this.spawnGoalId !== "")
        && object.properties.id == this.spawnGoalId) {
          this.spawnGoalCoords.x = position.x;
          this.spawnGoalCoords.y = position.y;
        }
      break;
    case "coin":
      prefab = new Unstable.Coin(this, position, properties);
      break;
    case "hazard":
      prefab = new Unstable.Hazard(this, position, properties);
      break;
    case "bouncer":
      if (this.bombSound === undefined) {
        this.bombSound = this.game.add.sound("sfx_tank");
        this.bombSound.loop = true;
      }
      prefab = new Unstable.BouncerHazard(this, position, properties);
      break;
    case "tracker":
        if (this.bombSound === undefined) {
          this.bombSound = this.game.add.sound("sfx_tank");
          this.bombSound.loop = true;
        }
        prefab = new Unstable.TrackerHazard(this, position, properties);
        break;
    case "bush":
    case "tree":
      prefab = new Unstable.Scenery(this, position, properties);
      break;
    case "crate":
      prefab = new Unstable.Scenery(this, position, properties);
      break;
    case "turret":
      prefab = new Unstable.Turret(this, position, properties);
      break;
    case "trigger":
      prefab = new Unstable.Trigger(this, position, properties);
      break;
    case "teleporter":
      prefab = new Unstable.Teleporter(this, position, properties);
      this.teleporters.push(prefab);
      break;
    }
    // this.prefabs[object.name] = prefab;
};

Unstable.TiledState.prototype.isBush = function(type, properties) {
    return !!(type === "bush1" || type === "bush2" || type === "bush3");
}

Unstable.TiledState.prototype.isTree = function(type, properties) {
    return !!(type === "tree1" || type === "tree2" || type === "tree3" || type === "tree4");
}

Unstable.TiledState.prototype.shutdown = function () {
  if (this.bombSound !== undefined) {
    this.bombSound.stop();
  }
};

Unstable.TiledState.prototype.restart_level = function () {
    "use strict";
    if (this.player.alive) {
      this.player.die();
    }
    if (this.bombSound !== undefined) {
      this.bombSound.stop();
    }
    this.game.state.restart(true, false, this.level_data, null);
};
