/* Feature layer: campaign progression, first-sector slimes, menu, settings, and music. */
var Slimes = { list: [], nextSpawn: 0 };
Slimes.reset = function () { Slimes.list = []; Slimes.nextSpawn = 0; };
Slimes.spawn = function () {
  if (Game.levelNumber !== 0 || Slimes.list.length >= 5) return;
  var maxX = Math.max(160, Level.pixelWidth() - 100);
  var x = Math.min(maxX, Player.x + 420 + Slimes.list.length * 180);
  Slimes.list.push({ x:x, y:300, health:1, hit:0 });
};
Slimes.update = function () {
  if (Game.levelNumber !== 0 || Game.mode !== "playing") return;
  if (Slimes.list.length < 3 && Player.x > 280 && performance.now() > Slimes.nextSpawn) {
    Slimes.spawn();
    Slimes.nextSpawn = performance.now() + 1600;
  }
  for (var i = Slimes.list.length - 1; i >= 0; i--) {
    var s = Slimes.list[i];
    s.x += s.x < Player.x ? 0.7 : -0.25;
    s.hit = Math.max(0, s.hit - 1);
    if (Math.abs(s.x - (Player.x + 15)) < 34 && Math.abs(s.y + 25 - (Player.y + 15)) < 45 && Player.takeDamage()) {
      Game.mode = "dead";
      Game.showMessage("SLIME SWARM // PRESS R TO REBOOT");
    }
  }
};
Slimes.draw = function (c) {
  Slimes.list.forEach(function (s) {
    c.save(); c.translate(s.x, s.y); c.fillStyle=s.hit ? "#fff" : "#65ff75"; c.shadowColor="#65ff75"; c.shadowBlur=18;
    c.beginPath(); c.arc(0,25,22,Math.PI,0); c.lineTo(22,35); c.lineTo(-22,35); c.closePath(); c.fill();
    c.fillStyle="#07121b"; c.shadowBlur=0; c.fillRect(-10,17,5,7); c.fillRect(6,17,5,7); c.restore();
  });
};

var MenuMusic = { timer:null, step:0, active:false };
MenuMusic.start = function () {
  if (MenuMusic.active) return;
  AudioFX.ready();
  if (!AudioFX.ctx) return;
  MenuMusic.active = true; MenuMusic.step = 0;
  var notes = [220,277.18,329.63,277.18,246.94,293.66,369.99,293.66];
  MenuMusic.timer = setInterval(function () {
    if (!MenuMusic.active || !AudioFX.ctx) return;
    AudioFX.tone(notes[MenuMusic.step++ % notes.length], 0.18, "triangle", 0.018);
  }, 240);
};
MenuMusic.stop = function () { MenuMusic.active = false; if (MenuMusic.timer) { clearInterval(MenuMusic.timer); MenuMusic.timer = null; } };

AudioFX.masterVolume = Number(localStorage.getItem("neonRollerMasterVolume")) || 0.7;
AudioFX.gunVolume = Number(localStorage.getItem("neonRollerGunVolume")) || 0.8;
var originalTone = AudioFX.tone;
AudioFX.tone = function (freq, duration, type, volume) {
  originalTone.call(AudioFX, freq, duration, type, (volume === undefined ? 0.04 : volume) * AudioFX.masterVolume);
};
AudioFX.shoot = function () { AudioFX.tone(520, .07, "square", .035 * AudioFX.gunVolume); };

var originalStartLevel = Game.startLevel;
Game.startLevel = function (n, resetScore) {
  if (!Level.levels || !Level.levels[n]) return;
  originalStartLevel.call(Game, n, resetScore);
  Slimes.reset();
  if (Game.boss && Level.secret) { Game.boss.health = CONFIG.BOSS_HEALTH; Game.boss.shotClock = -50; }
};
var originalUpdate = Game.update;
Game.update = function () {
  if (Game.mode === "menu") return;
  originalUpdate.call(Game);
  Slimes.update();
  if (Game.mode === "won" && Game.levelNumber >= 1 && Game.levelNumber < 7 && !Game.campaignTransitioned) {
    Game.campaignTransitioned = true;
    var next = Game.levelNumber + 1;
    Game.startLevel(next, false);
    Game.showMessage("SECTOR CLEAR // TELEPORTING TO " + Level.name);
  }
};
var originalDraw = Draw.everything;
Draw.everything = function () { originalDraw.call(Draw); if (Game.mode === "playing" && Game.levelNumber === 0) Slimes.draw(Draw.ctx); };

function showMenu() { document.getElementById("menuScreen").hidden=false; document.getElementById("gameSection").hidden=true; MenuMusic.start(); }
function startGame() { MenuMusic.stop(); document.getElementById("menuScreen").hidden=true; document.getElementById("gameSection").hidden=false; Game.campaignTransitioned=false; Game.startLevel(CONFIG.START_LEVEL, true); }
function updateVolumeControl(id, value) {
  var key = id === "masterVolume" ? "masterVolume" : "gunVolume";
  AudioFX[key] = Math.max(0, Math.min(1, Number(value)));
  localStorage.setItem(id === "masterVolume" ? "neonRollerMasterVolume" : "neonRollerGunVolume", String(AudioFX[key]));
  var output = document.getElementById(id + "Value");
  if (output) output.textContent = Math.round(AudioFX[key] * 100) + "%";
}
function bindMenu() {
  document.getElementById("playButton").addEventListener("click", startGame);
  document.getElementById("settingsButton").addEventListener("click", function () { var p=document.getElementById("settingsPanel"); p.hidden=!p.hidden; });
  ["masterVolume", "gunVolume"].forEach(function (id) {
    var input=document.getElementById(id); input.value=AudioFX[id === "masterVolume" ? "masterVolume" : "gunVolume"]; updateVolumeControl(id, input.value);
    input.addEventListener("input", function () { updateVolumeControl(id, input.value); });
  });
}
