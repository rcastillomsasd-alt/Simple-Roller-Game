var Game = {
  mode: "playing",
  levelNumber: 0,
  score: 0,
  startTime: 0,
  unlockedSecret: false
};

Game.startLevel = function (levelNumber) {
  Game.levelNumber = levelNumber;
  Level.build(levelNumber);
  Player.reset();
  Game.mode = "playing";
  Game.score = 0;
  Game.startTime = performance.now();
  Game.showMessage(Level.secret ? "SECRET SECTOR // NO MAP DATA" : "");
  Game.updateHud();
};

Game.unlockSecret = function () {
  if (Game.unlockedSecret) { return; }
  Game.unlockedSecret = true;
  Game.showMessage("SECRET LEVEL UNLOCKED // LOADING...");
  Game.startLevel(2);
};

Game.showMessage = function (text) {
  document.getElementById("message").textContent = text;
};

Game.updateHud = function () {
  document.getElementById("levelName").textContent = Level.name;
  document.getElementById("score").textContent = String(Game.score).padStart(3, "0");
  document.getElementById("total").textContent = String(Level.collectibles.length).padStart(3, "0");
  document.getElementById("statusText").textContent = Level.secret ? "SIGNAL UNKNOWN" : "SYSTEM ONLINE";
  document.getElementById("time").textContent = Game.formatTime((performance.now() - Game.startTime) / 1000);
};

Game.formatTime = function (seconds) {
  return String(Math.floor(seconds / 60)).padStart(2, "0") + ":" + String(Math.floor(seconds % 60)).padStart(2, "0");
};

Game.update = function () {
  if (Input.restart) {
    Game.startLevel(Game.levelNumber);
    Input.restart = false;
    return;
  }

  if (Game.mode !== "playing") { return; }

  Player.update();

  Level.collectibles.forEach(function (gem) {
    if (!gem.got && Math.hypot(Player.x + 15 - gem.x, Player.y + 15 - gem.y) < 24) {
      gem.got = true;
      Game.score += 100;
    }
  });

  if (Player.isDead()) {
    Game.mode = "dead";
    Game.showMessage("SIGNAL LOST // PRESS R TO REBOOT");
    Game.updateHud();
    return;
  }

  if (Player.hasWon()) {
    Game.mode = "won";
    if (Level.shardsLeft() === 0) {
      Game.showMessage("PERFECT RUN // PRESS R FOR NEXT SECTOR");
    } else {
      Game.showMessage("GATE OPEN // PRESS R TO RESTART");
    }
    Game.updateHud();
    return;
  }

  Game.updateHud();
};

Game.loop = function () {
  Game.update();
  Draw.updateCamera();
  Draw.everything();
  window.requestAnimationFrame(Game.loop);
};
