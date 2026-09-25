var Slimes = { list: [], nextSpawn: 0, maxSpawn: 5 };
Slimes.reset = function () {
  Slimes.list = [];
  Slimes.nextSpawn = 0;
};

Slimes.spawn = function () {
  if (!Game || typeof Game.levelNumber !== "number") return;
  var cap = Math.min(5, 2 + Math.floor(Math.max(0, Game.levelNumber) / 2));
  if (Slimes.list.length >= cap) return;
  var x = Math.min(Math.max(240, Player.x + 360 + Slimes.list.length * 180), Math.max(320, Level.pixelWidth() - 80));
  Slimes.list.push({
    x: x,
    y: 250 + (Slimes.list.length % 2) * 30,
    radius: 18,
    health: 1 + Math.min(2, Math.floor(Game.levelNumber / 3)),
    hit: 0,
    speed: 0.72 + Game.levelNumber * 0.12,
    direction: Player.x < x ? -1 : 1
  });
};

Slimes.update = function () {
  if (Game.mode !== "playing") return;
  if (Game.levelNumber >= 0 && Slimes.list.length < Math.min(5, 2 + Math.floor(Game.levelNumber / 2)) && performance.now() > Slimes.nextSpawn) {
    Slimes.spawn();
    Slimes.nextSpawn = performance.now() + Math.max(1300, 2600 - Game.levelNumber * 180);
  }

  for (var i = Slimes.list.length - 1; i >= 0; i--) {
    var s = Slimes.list[i];
    s.hit = Math.max(0, s.hit - 1);
    s.direction = Player.x < s.x ? -1 : 1;
    s.x += s.direction * s.speed;

    if (Math.abs(s.x - (Player.x + 15)) < s.radius + 18 && Math.abs(s.y - (Player.y + 15)) < s.radius + 18) {
      if (Player.takeDamage()) {
        Game.mode = "dead";
        Game.showMessage("SLIME SWARM // PRESS R TO REBOOT");
      }
    }

    if (Game.bullets) {
      for (var b = Game.bullets.length - 1; b >= 0; b--) {
        var bullet = Game.bullets[b];
        if (bullet.enemy) continue;
        if (Math.abs(bullet.x - s.x) < 22 && Math.abs(bullet.y - s.y) < 22) {
          s.health -= 1;
          s.hit = 9;
          Game.bullets.splice(b, 1);
          if (s.health <= 0) {
            Slimes.list.splice(i, 1);
            Game.score += 120;
            AudioFX.tone(200, 0.12, "triangle", 0.03);
          }
          break;
        }
      }
    }
  }
};

Slimes.draw = function (c) {
  Slimes.list.forEach(function (s) {
    c.save();
    c.translate(s.x, s.y);
    c.fillStyle = s.hit ? "#fff" : "#76ff8d";
    c.shadowColor = "#76ff8d";
    c.shadowBlur = 18;
    c.beginPath();
    c.arc(0, 25, 18, Math.PI, 0);
    c.lineTo(18, 34);
    c.lineTo(-18, 34);
    c.closePath();
    c.fill();
    c.fillStyle = "#07121b";
    c.shadowBlur = 0;
    c.fillRect(-8, 16, 5, 7);
    c.fillRect(3, 16, 5, 7);
    c.restore();
  });
};

var MenuMusic = { timer: null, active: false, step: 0 };
MenuMusic.start = function () {
  if (MenuMusic.active) return;
  AudioFX.ready();
  if (!AudioFX.ctx) return;
  MenuMusic.active = true;
  MenuMusic.step = 0;
  var notes = [220, 277.18, 329.63, 277.18, 246.94, 293.66, 369.99, 293.66, 220, 196, 261.63, 329.63];
  MenuMusic.timer = setInterval(function () {
    if (!MenuMusic.active || !AudioFX.ctx) return;
    var note = notes[MenuMusic.step % notes.length];
    MenuMusic.step += 1;
    AudioFX.tone(note, 0.18, "triangle", 0.024 * (1 + AudioFX.masterVolume));
  }, 230);
};

MenuMusic.stop = function () {
  MenuMusic.active = false;
  if (MenuMusic.timer) {
    clearInterval(MenuMusic.timer);
    MenuMusic.timer = null;
  }
};

AudioFX.masterVolume = Number(localStorage.getItem("neonRollerMasterVolume"));
if (!isFinite(AudioFX.masterVolume) || AudioFX.masterVolume < 0) AudioFX.masterVolume = 1;
AudioFX.masterVolume = Math.min(1.5, Math.max(0, AudioFX.masterVolume));
AudioFX.gunVolume = Number(localStorage.getItem("neonRollerGunVolume"));
if (!isFinite(AudioFX.gunVolume) || AudioFX.gunVolume < 0) AudioFX.gunVolume = 1.1;
AudioFX.gunVolume = Math.min(1.5, Math.max(0, AudioFX.gunVolume));

var originalTone = AudioFX.tone;
AudioFX.tone = function (freq, duration, type, volume) {
  var base = volume === undefined ? 0.04 : volume;
  var finalVolume = Math.max(0, Math.min(1.5, base * AudioFX.masterVolume));
  originalTone.call(AudioFX, freq, duration, type, finalVolume);
};
AudioFX.shoot = function () {
  AudioFX.tone(520, 0.07, "square", 0.035 * AudioFX.gunVolume);
};
AudioFX.hurt = function () {
  AudioFX.tone(110, 0.22, "sawtooth", 0.07 * AudioFX.masterVolume);
};
AudioFX.bossHit = function () {
  AudioFX.tone(180, 0.1, "triangle", 0.06 * AudioFX.masterVolume);
};
AudioFX.bossDown = function () {
  AudioFX.tone(70, 0.5, "sawtooth", 0.08 * AudioFX.masterVolume);
};

var MenuArt = { canvas: null, ctx: null, frame: 0, bound: false };
MenuArt.setup = function () {
  MenuArt.canvas = document.getElementById("menuBackdrop");
  if (!MenuArt.canvas) return;
  MenuArt.ctx = MenuArt.canvas.getContext("2d");
  MenuArt.resize();
  if (!MenuArt.bound) {
    window.addEventListener("resize", MenuArt.resize);
    MenuArt.bound = true;
  }
  MenuArt.loop();
};
MenuArt.resize = function () {
  if (!MenuArt.canvas) return;
  var ratio = window.devicePixelRatio || 1;
  var width = MenuArt.canvas.clientWidth || window.innerWidth;
  var height = MenuArt.canvas.clientHeight || window.innerHeight;
  MenuArt.canvas.width = width * ratio;
  MenuArt.canvas.height = height * ratio;
  if (MenuArt.ctx) MenuArt.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
};
MenuArt.loop = function () {
  if (!MenuArt.ctx || !MenuArt.canvas) return;
  var c = MenuArt.ctx;
  var w = MenuArt.canvas.clientWidth || window.innerWidth;
  var h = MenuArt.canvas.clientHeight || window.innerHeight;
  var t = MenuArt.frame / 60;
  c.clearRect(0, 0, w, h);
  c.fillStyle = "#0b1730";
  c.fillRect(0, 0, w, h);

  c.strokeStyle = "rgba(84,245,233,0.14)";
  c.lineWidth = 2;
  for (var x = -w; x < w * 2; x += 60) {
    c.beginPath();
    c.moveTo(x + (t * 20) % 60, h);
    c.lineTo(x + 180 + (t * 20) % 60, h * 0.52);
    c.stroke();
  }

  var px = w * 0.42 + Math.sin(t * 1.8) * w * 0.03;
  var py = h * 0.56 - Math.abs(Math.sin(t * 2.3)) * h * 0.13;
  c.save();
  c.translate(px, py);
  c.rotate(Math.sin(t * 2.3) * 0.05);
  c.shadowColor = "#54f5e9";
  c.shadowBlur = 18;
  c.fillStyle = "#54f5e9";
  c.beginPath();
  c.arc(0, 0, 24, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#ff4f9a";
  c.fillRect(-15, 22, 30, 10);
  c.strokeStyle = "#ffd166";
  c.lineWidth = 7;
  c.beginPath();
  c.moveTo(-8, 28); c.lineTo(-25, 50);
  c.moveTo(8, 28); c.lineTo(24, 50);
  c.stroke();
  c.restore();

  for (var i = 0; i < 5; i++) {
    var sx = w * (0.18 + i * 0.18) + Math.sin(t * 1.5 + i) * 16;
    var sy = h * 0.72 - Math.abs(Math.sin(t * 1.7 + i)) * 12;
    c.fillStyle = "#65ff75";
    c.shadowColor = "#65ff75";
    c.shadowBlur = 14;
    c.beginPath();
    c.arc(sx, sy, 18, Math.PI, 0);
    c.lineTo(sx + 18, sy + 10);
    c.lineTo(sx - 18, sy + 10);
    c.closePath();
    c.fill();
  }
  MenuArt.frame += 1;
  requestAnimationFrame(MenuArt.loop);
};

function updateVolumeControl(id, value) {
  var key = id === "masterVolume" ? "masterVolume" : "gunVolume";
  AudioFX[key] = Math.max(0, Math.min(1.5, Number(value) || 0));
  localStorage.setItem(id === "masterVolume" ? "neonRollerMasterVolume" : "neonRollerGunVolume", String(AudioFX[key]));
  var output = document.getElementById(id + "Value");
  if (output) output.textContent = Math.round(AudioFX[key] * 100) + "%";
}

function showMenu() {
  var menu = document.getElementById("menuScreen");
  var game = document.getElementById("gameSection");
  if (menu) menu.hidden = false;
  if (game) game.hidden = true;
  MenuArt.setup();
  MenuMusic.start();
}

function startGame() {
  MenuMusic.stop();
  var menu = document.getElementById("menuScreen");
  var game = document.getElementById("gameSection");
  if (menu) menu.hidden = true;
  if (game) game.hidden = false;
  Game.campaignTransitioned = false;
  Game.mode = "playing";
  Game.startLevel(Game.levelNumber || 0, true);
}

function returnToMenu() {
  Game.mode = "menu";
  Slimes.reset();
  var menu = document.getElementById("menuScreen");
  var game = document.getElementById("gameSection");
  if (menu) menu.hidden = false;
  if (game) game.hidden = true;
  MenuMusic.start();
}

function toggleMenuFullscreen() {
  var target = document.getElementById("menuScreen");
  if (!target) return;
  if (!document.fullscreenElement) {
    if (target.requestFullscreen) {
      target.requestFullscreen().catch(function () {});
    }
    return;
  }
  if (document.exitFullscreen) document.exitFullscreen();
}

function bindMenu() {
  var play = document.getElementById("playButton");
  if (play) play.addEventListener("click", startGame);

  var settings = document.getElementById("settingsButton");
  if (settings) {
    settings.addEventListener("click", function () {
      var panel = document.getElementById("settingsPanel");
      if (panel) panel.hidden = !panel.hidden;
    });
  }

  var menuFullscreen = document.getElementById("menuFullscreenButton");
  if (menuFullscreen) menuFullscreen.addEventListener("click", toggleMenuFullscreen);

  var menuButton = document.getElementById("menuButton");
  if (menuButton) menuButton.addEventListener("click", returnToMenu);

  ["masterVolume", "gunVolume"].forEach(function (id) {
    var input = document.getElementById(id);
    if (!input) return;
    input.value = AudioFX[id === "masterVolume" ? "masterVolume" : "gunVolume"];
    updateVolumeControl(id, input.value);
    input.addEventListener("input", function () {
      updateVolumeControl(id, input.value);
      AudioFX.ready();
    });
  });

  document.addEventListener("fullscreenchange", function () {
    var button = document.getElementById("menuFullscreenButton");
    if (button) button.textContent = document.fullscreenElement ? "⛶ EXIT FULLSCREEN" : "⛶ FULLSCREEN";
    var fb = document.getElementById("fullscreenButton");
    if (fb) fb.textContent = document.fullscreenElement ? "⛶ EXIT FULLSCREEN" : "⛶ FULLSCREEN";
  });
}

window.addEventListener("load", function () {
  MenuArt.setup();
  bindMenu();
  showMenu();
});
