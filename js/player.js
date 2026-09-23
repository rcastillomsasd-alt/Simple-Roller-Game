var Player = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  onGround: false,
  angle: 0,
  trail: []
};

Player.reset = function () {
  Player.x = Level.startX;
  Player.y = Level.startY - 2;
  Player.vx = 0;
  Player.vy = 0;
  Player.onGround = false;
  Player.angle = 0;
  Player.trail = [];
};

Player.update = function () {
  var size = CONFIG.PLAYER_SIZE;

  Player.vx = 0;
  if (Input.left) { Player.vx = -CONFIG.MOVE_SPEED; }
  if (Input.right) { Player.vx = CONFIG.MOVE_SPEED; }

  if (Input.jump && Player.onGround) {
    Player.vy = -CONFIG.JUMP_POWER;
    Player.onGround = false;
  }

  Player.vy = Math.min(Player.vy + CONFIG.GRAVITY, CONFIG.MAX_FALL);

  var stepX = 0;
  if (Player.vx > 0) { stepX = 1; }
  if (Player.vx < 0) { stepX = -1; }

  for (var i = 0; i < Math.abs(Player.vx); i++) {
    if (Collide.hitsSolid(Player.x + stepX, Player.y, size, size)) { break; }
    Player.x += stepX;
    Player.angle += stepX / CONFIG.PLAYER_RADIUS;
  }

  var stepY = 0;
  if (Player.vy > 0) { stepY = 1; }
  if (Player.vy < 0) { stepY = -1; }

  Player.onGround = false;

  for (var j = 0; j < Math.abs(Player.vy); j++) {
    if (Collide.hitsSolid(Player.x, Player.y + stepY, size, size)) {
      if (stepY > 0) { Player.onGround = true; }
      Player.vy = 0;
      break;
    }
    Player.y += stepY;
  }

  if (Player.x < 0) { Player.x = 0; }

  Player.trail.push({ x: Player.x + size / 2, y: Player.y + size / 2 });
  if (Player.trail.length > 8) { Player.trail.shift(); }
};

Player.isDead = function () {
  var size = CONFIG.PLAYER_SIZE;
  if (Collide.hitsSpike(Player.x, Player.y, size, size)) { return true; }
  if (Player.y > CONFIG.CANVAS_H + 180) { return true; }
  return false;
};

Player.hasWon = function () {
  var size = CONFIG.PLAYER_SIZE;
  return Collide.hitsFinish(Player.x, Player.y, size, size);
};
