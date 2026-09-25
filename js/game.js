var Game = {
  mode: "menu",
  levelNumber: 0,
  score: 0,
  startTime: 0,
  unlockedSecret: false,
  bullets: [],
  boss: null,
  lastShot: 0,
  campaignTransitioned: false,
  levelHasEnemies: function () {
    return this.levelNumber === 0 || this.levelNumber >= 2;
  }
};

var AudioFX = {
  ctx: null,
  masterVolume: 1,
  gunVolume: 1.1,
  ready: function () {
    var Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return;
    if (!AudioFX.ctx) AudioFX.ctx = new Ctor();
    if (AudioFX.ctx.state === "suspended") AudioFX.ctx.resume();
  },
  tone: function (freq, duration, type, volume) {
    try {
      AudioFX.ready();
      if (!AudioFX.ctx) return;
      var osc = AudioFX.ctx.createOscillator();
      var gain = AudioFX.ctx.createGain();
      osc.type = type || "square";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime((volume === undefined ? 0.04 : volume) * AudioFX.masterVolume, AudioFX.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, AudioFX.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(AudioFX.ctx.destination);
      osc.start();
      osc.stop(AudioFX.ctx.currentTime + duration);
    } catch (e) {}
  },
  shoot: function () {
    AudioFX.tone(520, 0.07, "square", 0.035 * AudioFX.gunVolume);
  },
  hurt: function () {
    AudioFX.tone(110, 0.22, "sawtooth", 0.07 * AudioFX.masterVolume);
  },
  bossHit: function () {
    AudioFX.tone(180, 0.1, "triangle", 0.06 * AudioFX.masterVolume);
  },
  bossDown: function () {
    AudioFX.tone(70, 0.5, "sawtooth", 0.08 * AudioFX.masterVolume);
  }
};

Game.startLevel = function (n, resetScore) {
  if (!Level.levels || !Level.levels[n]) return;
  Game.levelNumber = n;
  Level.build(n);
  Player.reset();
  Game.bullets = [];
  Game.boss = Level.secret ? { x: Level.pixelWidth() - 220, y: 250, health: CONFIG.BOSS_HEALTH, shotClock: 0, flash: 0 } : null;
  Game.mode = "playing";
  Game.campaignTransitioned = false;
  Game.score = resetScore ? 0 : Game.score;
  Game.startTime = performance.now();
  Game.showMessage(Level.secret ? "SECRET SECTOR // DEFEAT THE BOSS" : "");
  Game.updateHud();
};
Game.unlockSecret = function () {
  if (Game.unlockedSecret) return;
  Game.unlockedSecret = true;
  Game.startLevel(10, true);
  Game.showMessage("SECRET LEVEL UNLOCKED // DEFEAT THE CORE BOSS");
};
Game.exitSecret = function () {
  if (!Level.secret) return;
  Game.startLevel(0, true);
  Game.showMessage("RETURNED TO MAIN SECTOR");
};
Game.showMessage = function (text) {
  var node = document.getElementById("message");
  if (node) node.textContent = text;
};
Game.updateHud = function () {
  var levelName = document.getElementById("levelName");
  var scoreEl = document.getElementById("score");
  var totalEl = document.getElementById("total");
  var timeEl = document.getElementById("time");
  var bossHud = document.getElementById("bossHud");
  var bossHealth = document.getElementById("bossHealth");
  var statusText = document.getElementById("statusText");
  var exitButton = document.getElementById("exitSecret");

  if (levelName) levelName.textContent = Level.name;
  if (scoreEl) scoreEl.textContent = String(Game.score).padStart(3, "0");
  if (totalEl) totalEl.textContent = String(Level.collectibles.length).padStart(3, "0");
  if (statusText) statusText.textContent = Level.secret ? "BOSS SIGNAL" : "SYSTEM ONLINE";
  if (timeEl) timeEl.textContent = Game.formatTime((performance.now() - Game.startTime) / 1000);
  if (bossHud) bossHud.style.display = Game.boss ? "block" : "none";
  if (bossHealth && Game.boss) bossHealth.textContent = String(Game.boss.health);
  if (exitButton) exitButton.style.display = Level.secret ? "inline-block" : "none";
};
Game.formatTime = function (seconds) {
  return String(Math.floor(seconds / 60)).padStart(2, "0") + ":" + String(Math.floor(seconds % 60)).padStart(2, "0");
};
Game.fire = function () {
  if (Game.mode !== "playing") return;
  var now = performance.now();
  if (now - Game.lastShot < 180) return;
  Game.lastShot = now;
  AudioFX.shoot();
  Game.bullets.push({ x: Player.x + CONFIG.PLAYER_SIZE, y: Player.y + 15, vx: 10, life: 0, enemy: false });
};
Game.updateBullets = function () {
  for (var i = Game.bullets.length - 1; i >= 0; i--) {
    var b = Game.bullets[i];
    b.x += b.vx;
    b.life += 1;
    if (Game.boss && !b.enemy && Math.abs(b.x - Game.boss.x) < 30 && Math.abs(b.y - (Game.boss.y + 35)) < 45) {
      Game.boss.health -= 1;
      Game.boss.flash = 8;
      Game.score += 250;
      AudioFX.bossHit();
      Game.bullets.splice(i, 1);
      if (Game.boss.health <= 0) {
        Game.boss = null;
        Game.score += 1000;
        AudioFX.bossDown();
        Game.showMessage("BOSS DELETED // FIND THE EXIT GATE");
      }
      continue;
    }
    if (b.enemy && Math.abs(b.x - (Player.x + 15)) < 20 && Math.abs(b.y - (Player.y + 15)) < 18) {
      Game.bullets.splice(i, 1);
      if (Player.takeDamage()) {
        Game.mode = "dead";
        Game.showMessage("BOSS BLAST // PRESS R TO REBOOT");
      }
      continue;
    }
    if (b.life > 100 || b.x < Draw.cameraX - 120 || b.x > Level.pixelWidth() + 200) {
      Game.bullets.splice(i, 1);
    }
  }
};
Game.updateBoss = function () {
  if (!Game.boss) return;
  var b = Game.boss;
  b.shotClock += 1;
  b.flash = Math.max(0, b.flash - 1);
  b.y = 235 + Math.sin(b.shotClock / 35) * 55;
  if (b.shotClock % 110 === 0) {
    Game.bullets.push({ x: b.x, y: b.y + 35, vx: -3.2, life: 0, enemy: true });
    AudioFX.tone(95, 0.12, "sawtooth", 0.035);
  }
  if (Math.abs(Player.x - b.x) < 48 && Math.abs(Player.y - b.y) < 70 && Player.takeDamage()) {
    Game.mode = "dead";
    Game.showMessage("BOSS HIT // PRESS R TO REBOOT");
  }
};
Game.update = function () {
  if (Input.restart) {
    Game.startLevel(Game.levelNumber, true);
    Input.restart = false;
    return;
  }
  if (Game.mode !== "playing") return;

  Player.update();
  Game.updateBullets();
  Game.updateBoss();

  if (Slimes && Slimes.update) Slimes.update();

  Level.collectibles.forEach(function (g) {
    if (!g.got && Math.hypot(Player.x + 15 - g.x, Player.y + 15 - g.y) < 22) {
      g.got = true;
      Game.score += 100;
    }
  });

  if (Player.isDead()) {
    Game.mode = "dead";
    Game.showMessage("SIGNAL LOST // PRESS R TO REBOOT");
  } else if (Player.hasWon() && !Game.campaignTransitioned) {
    Game.campaignTransitioned = true;

    if (Game.levelNumber === 0) {
      Game.startLevel(1, false);
      Game.showMessage("SECTOR CLEAR // TELEPORTING TO PRESSURE DROP");
    } else if (Game.levelNumber === 1) {
      Game.startLevel(2, false);
      Game.showMessage("SECTOR CLEAR // TELEPORTING TO STATIC RUN");
    } else if (Game.levelNumber >= 2 && Game.levelNumber < 9) {
      var nextLevel = Game.levelNumber + 1;
      Game.startLevel(nextLevel, false);
      Game.showMessage("SECTOR CLEAR // TELEPORTING TO NEXT SECTOR");
    } else if (Game.levelNumber === 9) {
      Game.mode = "won";
      Game.showMessage("ALL SECTORS CLEARED // PRESS R TO RESTART");
    } else if (Level.secret && !Game.boss) {
      Game.mode = "won";
      Game.showMessage("NULL SPACE CLEARED // PRESS R TO RESTART");
    }
  }

  Game.updateHud();
};
Game.loop = function () {
  Game.update();
  Draw.updateCamera();
  Draw.everything();
  requestAnimationFrame(Game.loop);
};

var originalMenuShow = null;
if (typeof showMenu === "function") {
  originalMenuShow = showMenu;
}

window.addEventListener("load", function () {
  Draw.setup();
  bindTouch();
  bindMenu();
  Level.loadData(function () {
    Game.mode = "menu";
    showMenu();
    Game.loop();
  });
});
