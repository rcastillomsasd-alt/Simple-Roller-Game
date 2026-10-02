var Monsters = { list: [], nextSpawn: 0, wave: 1 };

Monsters.reset = function () {
  Monsters.list = [];
  Monsters.nextSpawn = 0;
  Monsters.wave = Game && typeof Game.wave === "number" ? Game.wave : 1;
};

Monsters.spawn = function () {
  if (!Game || typeof Game.levelNumber !== "number") return;
  var cap = Math.min(12, 3 + Math.floor((Game.wave || 1) * 1.2));
  if (Monsters.list.length >= cap) return;
  var x = Math.min(Math.max(240, Player.x + 360 + Monsters.list.length * 180), Math.max(320, Level.pixelWidth() - 120));
  var roll = Math.random();
  var kind = roll < 0.45 ? "moss" : roll < 0.8 ? "shade" : "fang";
  var baseHealth = kind === "fang" ? 2 : kind === "shade" ? 1 : 1;

  Monsters.list.push({
    x: x,
    y: 250 + (Monsters.list.length % 3) * 28,
    radius: 18,
    health: baseHealth + Math.min(3, Math.floor((Game.wave || 1) / 2)),
    hit: 0,
    speed: 0.8 + (Game.wave || 1) * 0.16,
    direction: Player.x < x ? -1 : 1,
    kind: kind,
    bob: Math.random() * Math.PI * 2
  });
};

Monsters.update = function () {
  if (Game.mode !== "playing") return;
  Monsters.wave = Game.wave || 1;
  var cap = Math.min(12, 3 + Math.floor(Monsters.wave * 1.2));
  if (Monsters.list.length < cap && performance.now() > Monsters.nextSpawn) {
    Monsters.spawn();
    Monsters.nextSpawn = performance.now() + Math.max(700, 1700 - (Monsters.wave || 1) * 90);
  }

  for (var i = Monsters.list.length - 1; i >= 0; i--) {
    var m = Monsters.list[i];
    m.hit = Math.max(0, m.hit - 1);
    m.direction = Player.x < m.x ? -1 : 1;
    m.x += m.direction * m.speed;
    m.bob += 0.08;

    if (Math.abs(m.x - (Player.x + 15)) < m.radius + 18 && Math.abs(m.y - (Player.y + 15)) < m.radius + 18) {
      if (Player.takeDamage()) {
        Game.mode = "dead";
        Game.showMessage("A MONSTER LURKS // PRESS R TO RETURN");
      }
    }

    if (Game.bullets) {
      for (var b = Game.bullets.length - 1; b >= 0; b--) {
        var bullet = Game.bullets[b];
        if (bullet.enemy) continue;
        if (Math.abs(bullet.x - m.x) < 18 && Math.abs(bullet.y - m.y) < 18) {
          m.health -= 1;
          m.hit = 8;
          Game.bullets.splice(b, 1);
          if (m.health <= 0) {
            Monsters.list.splice(i, 1);
            Game.score += 160;
            AudioFX.tone(240 + Math.random() * 120, 0.12, "triangle", 0.06);
          }
          break;
        }
      }
    }
  }
};

Monsters.draw = function (c) {
  Monsters.list.forEach(function (m) {
    c.save();
    c.translate(m.x - Draw.cameraX, m.y + Math.sin(m.bob) * 5);
    c.strokeStyle = m.hit ? "#f5f1e7" : m.kind === "shade" ? "#b8c2d8" : m.kind === "fang" ? "#d2a074" : "#8ec08e";
    c.fillStyle = m.hit ? "#f7f7ee" : m.kind === "shade" ? "#6c7478" : m.kind === "fang" ? "#b7774d" : "#5a8f68";
    c.lineWidth = 2;
    c.shadowColor = m.hit ? "#f7f7ee" : "#89c096";
    c.shadowBlur = 18;

    if (m.kind === "shade") {
      c.beginPath();
      c.moveTo(0, -18);
      c.lineTo(18, 0);
      c.lineTo(0, 18);
      c.lineTo(-18, 0);
      c.closePath();
      c.fill();
      c.stroke();
    } else if (m.kind === "fang") {
      c.beginPath();
      c.moveTo(-18, 10);
      c.lineTo(-8, -20);
      c.lineTo(0, 10);
      c.lineTo(18, -20);
      c.lineTo(18, 12);
      c.lineTo(-18, 12);
      c.closePath();
      c.fill();
      c.stroke();
    } else {
      c.beginPath();
      c.arc(0, 4, 18, Math.PI, 0);
      c.lineTo(18, 26);
      c.lineTo(-18, 26);
      c.closePath();
      c.fill();
      c.stroke();
    }

    c.shadowBlur = 0;
    c.fillStyle = "rgba(18, 24, 22, 0.9)";
    c.fillRect(-7, 8, 5, 7);
    c.fillRect(2, 8, 5, 7);
    c.restore();
  });
};

var Slimes = Monsters;

var MenuMusic = { timer: null, active: false, step: 0 };
MenuMusic.start = function () {
  if (MenuMusic.active) return;
  AudioFX.ready();
  if (!AudioFX.ctx) return;
  MenuMusic.active = true;
  MenuMusic.step = 0;
  var notes = [196, 220, 261.63, 293.66, 329.63, 293.66, 261.63, 220, 196, 174.61, 220, 246.94];
  MenuMusic.timer = setInterval(function () {
    if (!MenuMusic.active || !AudioFX.ctx) return;
    var note = notes[MenuMusic.step % notes.length];
    MenuMusic.step += 1;
    AudioFX.tone(note, 0.2, "triangle", 0.04 * (1 + AudioFX.masterVolume));
  }, 260);
};

MenuMusic.stop = function () {
  MenuMusic.active = false;
  if (MenuMusic.timer) {
    clearInterval(MenuMusic.timer);
    MenuMusic.timer = null;
  }
};

AudioFX.masterVolume = Number(localStorage.getItem("whisperMasterVolume"));
if (!isFinite(AudioFX.masterVolume) || AudioFX.masterVolume < 0) AudioFX.masterVolume = 1;
AudioFX.masterVolume = Math.min(1.5, Math.max(0, AudioFX.masterVolume));
AudioFX.gunVolume = Number(localStorage.getItem("whisperGunVolume"));
if (!isFinite(AudioFX.gunVolume) || AudioFX.gunVolume < 0) AudioFX.gunVolume = 1.1;
AudioFX.gunVolume = Math.min(1.5, Math.max(0, AudioFX.gunVolume));

var originalTone = AudioFX.tone;
AudioFX.tone = function (freq, duration, type, volume) {
  var base = volume === undefined ? 0.04 : volume;
  var finalVolume = Math.max(0, Math.min(1.5, base * AudioFX.masterVolume));
  originalTone.call(AudioFX, freq, duration, type, finalVolume);
};

function updateVolumeControl(id, value) {
  var key = id === "masterVolume" ? "masterVolume" : "gunVolume";
  AudioFX[key] = Math.max(0, Math.min(1.5, Number(value) || 0));
  localStorage.setItem(id === "masterVolume" ? "whisperMasterVolume" : "whisperGunVolume", String(AudioFX[key]));
  var output = document.getElementById(id + "Value");
  if (output) output.textContent = Math.round(AudioFX[key] * 100) + "%";
}

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

  var sky = c.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#dfe7d5");
  sky.addColorStop(0.4, "#bfd1b4");
  sky.addColorStop(1, "#29473d");
  c.fillStyle = sky;
  c.fillRect(0, 0, w, h);

  c.fillStyle = "rgba(255,255,255,0.14)";
  for (var i = 0; i < 8; i++) {
    var x = ((i * 140 + t * 35) % (w + 180)) - 80;
    var y = 90 + (i % 3) * 45;
    c.beginPath();
    c.arc(x, y, 26, 0, Math.PI * 2);
    c.fill();
  }

  c.fillStyle = "rgba(43, 62, 51, 0.65)";
  for (var n = 0; n < 14; n++) {
    var treeX = ((n * 90 + t * 18) % (w + 120)) - 50;
    var treeH = 120 + (n % 5) * 30;
    c.fillRect(treeX, h - treeH, 12, treeH);
    c.beginPath();
    c.arc(treeX + 6, h - treeH - 20, 32, 0, Math.PI * 2);
    c.fill();
  }

  c.fillStyle = "rgba(38, 56, 47, 0.82)";
  c.fillRect(0, h * 0.7, w, h * 0.3);

  var px = w * 0.52 + Math.sin(t * 1.2) * w * 0.08;
  var py = h * 0.52 - Math.abs(Math.sin(t * 1.8)) * h * 0.1;
  c.save();
  c.translate(px, py);
  c.fillStyle = "rgba(201, 175, 116, 0.18)";
  c.beginPath();
  c.arc(0, 0, 64, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#f6e6bc";
  c.beginPath();
  c.arc(0, 8, 22, 0, Math.PI * 2);
  c.fill();
  c.restore();

  MenuArt.frame += 1;
  requestAnimationFrame(MenuArt.loop);
};

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
  if (Monsters) Monsters.reset();
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
