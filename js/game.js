var Game = {
  mode: "menu",
  levelNumber: 0,
  score: 0,
  startTime: 0,
  unlockedSecret: false,
  bullets: [],
  boss: null,
  lastShot: 0,
  exitRequested: false,
  previousLevel: 0,
  campaignTransitioned: false,
  wave: 1
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
      osc.type = type || "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime((volume === undefined ? 0.04 : volume) * AudioFX.masterVolume, AudioFX.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, AudioFX.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(AudioFX.ctx.destination);
      osc.start();
      osc.stop(AudioFX.ctx.currentTime + duration);
    } catch (e) {}
  },
  shoot: function () { AudioFX.tone(520, 0.12, "triangle", 0.07 * AudioFX.gunVolume); },
  hurt: function () { AudioFX.tone(120, 0.2, "sawtooth", 0.1 * AudioFX.masterVolume); },
  bossHit: function () { AudioFX.tone(200, 0.15, "triangle", 0.12 * AudioFX.masterVolume); },
  bossDown: function () { AudioFX.tone(80, 0.8, "sawtooth", 0.12 * AudioFX.masterVolume); },
  holyLaser: function () {
    AudioFX.tone(640, 0.08, "sine", 0.14 * AudioFX.masterVolume);
    AudioFX.tone(420, 0.05, "sine", 0.1 * AudioFX.masterVolume);
  },
  lightning: function () {
    AudioFX.tone(180, 0.04, "sawtooth", 0.18 * AudioFX.masterVolume);
    AudioFX.tone(260, 0.03, "square", 0.1 * AudioFX.masterVolume);
  }
};

Game.startLevel = function (n, resetScore) {
  if (!Level.levels || !Level.levels[n]) return;
  Game.levelNumber = n;
  Game.wave = Math.max(1, n + 1);
  Level.build(n);
  Player.reset();
  Game.bullets = [];
  Game.boss = Level.secret ? { x: Level.pixelWidth() - 220, y: 150, health: CONFIG.BOSS_HEALTH, shotClock: 0, flash: 0, pattern: 0 } : null;
  Game.mode = "playing";
  Game.campaignTransitioned = false;
  if (resetScore) Game.score = 0;
  Game.startTime = performance.now();
  Game.showMessage(Level.secret ? "THE HUSH HAS A HEART // FACE THE ANCIENT MONSTER" : "THE WOODS STIR // THE HUNT BEGINS");
  Game.updateHud();
  if (Monsters) Monsters.reset();
};

Game.unlockSecret = function () {
  if (Game.unlockedSecret) return;
  Game.unlockedSecret = true;
  Game.previousLevel = Game.levelNumber;
  Game.startLevel(10, true);
  Game.showMessage("THE GLADE OPENS // THE DEEP HUSH AWAITS");
};

Game.exitSecret = function () {
  if (Level.secret) {
    var target = typeof Game.previousLevel === "number" ? Game.previousLevel : 0;
    Game.startLevel(target, true);
    Game.showMessage("YOU RETURN TO THE QUIET TRAIL");
  }
};

Game.showMessage = function (text) {
  var node = document.getElementById("message");
  if (node) node.textContent = text;
};

Game.updateHud = function () {
  if (!Level || !Level.name) return;
  var levelName = document.getElementById("levelName");
  var healthEl = document.getElementById("health");
  var waveEl = document.getElementById("wave");
  var bossHud = document.getElementById("bossHud");
  var bossHealth = document.getElementById("bossHealth");
  var statusText = document.getElementById("statusText");
  var exitButton = document.getElementById("exitSecret");

  if (levelName) levelName.textContent = Level.name;
  if (healthEl) healthEl.textContent = String(Player && typeof Player.health === "number" ? Player.health : 3);
  if (waveEl) waveEl.textContent = String(Game.wave || 1);
  if (statusText) statusText.textContent = Level.secret ? "HUSHED" : "CALM";
  if (bossHud) bossHud.classList.toggle("active", !!Game.boss);
  if (bossHealth && Game.boss) bossHealth.textContent = String(Game.boss.health);
  if (exitButton) exitButton.style.display = Level.secret ? "inline-block" : "none";
};

Game.fire = function () {
  if (Game.mode !== "playing") return;
  var now = performance.now();
  if (now - Game.lastShot < 150) return;
  Game.lastShot = now;
  AudioFX.shoot();

  var canvas = document.getElementById("game");
  if (!canvas) return;
  var targetX = Input.cursorX + Draw.cameraX;
  var targetY = Input.cursorY;

  var originX = Player.x + CONFIG.PLAYER_SIZE / 2;
  var originY = Player.y + CONFIG.PLAYER_SIZE / 2;
  var dx = targetX - originX;
  var dy = targetY - originY;
  var length = Math.hypot(dx, dy) || 1;

  Game.bullets.push({
    x: originX,
    y: originY,
    vx: (dx / length) * 11,
    vy: (dy / length) * 11,
    life: 0,
    enemy: false
  });
};

Game.updateBullets = function () {
  for (var i = Game.bullets.length - 1; i >= 0; i--) {
    var b = Game.bullets[i];
    b.x += b.vx;
    b.y += b.vy;
    b.life += 1;

    if (Game.boss && !b.enemy && Math.abs(b.x - Game.boss.x) < 35 && Math.abs(b.y - Game.boss.y) < 35) {
      Game.boss.health -= 1;
      Game.boss.flash = 8;
      Game.score += 250;
      AudioFX.bossHit();
      Game.bullets.splice(i, 1);
      if (Game.boss.health <= 0) {
        Game.boss = null;
        Game.score += 2000;
        AudioFX.bossDown();
        Game.showMessage("THE HUSH IS BROKEN // THE GATE IS NOW OPEN");
      }
      continue;
    }

    if (b.enemy && Math.abs(b.x - (Player.x + 15)) < 20 && Math.abs(b.y - (Player.y + 15)) < 18) {
      Game.bullets.splice(i, 1);
      if (Player.takeDamage()) {
        Game.mode = "dead";
        Game.showMessage("THE FOREST STRIKES // PRESS R TO RETURN");
      }
      continue;
    }

    if (b.life > 150 || b.x < Draw.cameraX - 120 || b.x > Level.pixelWidth() + 200 || b.y < -40 || b.y > CONFIG.CANVAS_H + 40) {
      Game.bullets.splice(i, 1);
    }
  }
};

Game.updateBoss = function () {
  if (!Game.boss) return;
  var b = Game.boss;
  b.shotClock += 1;
  b.flash = Math.max(0, b.flash - 1);
  b.y = 120 + Math.sin(b.shotClock / 38) * 62 + Math.cos(b.shotClock / 62) * 30;

  if (b.shotClock % 60 === 0) {
    for (var angle = -30; angle <= 30; angle += 15) {
      var rad = (angle + 90) * Math.PI / 180;
      Game.bullets.push({
        x: b.x,
        y: b.y,
        vx: Math.cos(rad) * 2.8,
        vy: Math.sin(rad) * 2.8 + 2.8,
        life: 0,
        enemy: true
      });
    }
    AudioFX.holyLaser();
    AudioFX.lightning();
  }

  if (b.shotClock % 120 === 60) {
    var dx = Player.x - b.x;
    var dy = Player.y - b.y;
    var len = Math.hypot(dx, dy) || 1;
    Game.bullets.push({
      x: b.x,
      y: b.y,
      vx: (dx / len) * 3,
      vy: (dy / len) * 3,
      life: 0,
      enemy: true
    });
    AudioFX.holyLaser();
  }

  if (Math.abs(Player.x - b.x) < 60 && Math.abs(Player.y - b.y) < 80 && Player.takeDamage()) {
    Game.mode = "dead";
    Game.showMessage("THE HUSH DEVOURS // PRESS R TO RESTART");
  }
};

Game.update = function () {
  if (Input.restart) {
    Game.startLevel(Game.levelNumber || 0, true);
    Input.restart = false;
    return;
  }

  if (Game.mode !== "playing") return;

  Player.update();
  Game.updateBullets();
  Game.updateBoss();
  if (Monsters && Monsters.update) Monsters.update();

  Level.collectibles.forEach(function (g) {
    if (!g.got && Math.hypot(Player.x + 15 - g.x, Player.y + 15 - g.y) < 22) {
      g.got = true;
      Game.score += 100;
    }
  });

  if (Player.isDead()) {
    Game.mode = "dead";
    Game.showMessage("THE FOREST CLAIMS YOU // PRESS R TO RETURN");
  } else if (Player.hasWon()) {
    if (Level.secret) {
      Game.exitSecret();
    } else if (!Game.campaignTransitioned) {
      Game.campaignTransitioned = true;
      var nextLevel = Game.levelNumber + 1;
      if (Level.levels[nextLevel]) {
        Game.startLevel(nextLevel, false);
        Game.showMessage("PATH CLEAR // INTO THE NEXT GLADE");
      } else {
        Game.mode = "won";
        Game.showMessage("ALL PATHS RESTORED // PRESS R TO RESTART");
      }
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

window.addEventListener("load", function () {
  Draw.setup();
  bindTouch();
  bindMenu();
  Input.cursorX = CONFIG.CANVAS_W * 0.8;
  Input.cursorY = CONFIG.CANVAS_H * 0.5;
  Level.loadData(function () {
    Game.mode = "menu";
    showMenu();
    Game.loop();
  });
});
