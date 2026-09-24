/* Feature layer: campaign progression, first-sector slimes, menu, and audio settings. */
var Slimes = { list: [], nextSpawn: 0 };
Slimes.reset = function () { Slimes.list = []; Slimes.nextSpawn = 0; };
Slimes.spawn = function () {
  if (Game.levelNumber !== 0 || Slimes.list.length >= 5) return;
  var x = Math.min(Level.pixelWidth() - 100, Player.x + 420 + Slimes.list.length * 180);
  Slimes.list.push({ x:x, y:300, health:1, hit:0 });
};
Slimes.update = function () {
  if (Game.levelNumber !== 0 || Game.mode !== "playing") return;
  if (Slimes.list.length < 3 && Player.x > 280 && performance.now() > Slimes.nextSpawn) { Slimes.spawn(); Slimes.nextSpawn = performance.now() + 1600; }
  Slimes.list.forEach(function (s) { s.x += s.x < Player.x ? 0.7 : -0.25; s.hit = Math.max(0, s.hit - 1); if (Math.abs(s.x - Player.x) < 34 && Math.abs(s.y - Player.y) < 45 && Player.takeDamage()) { Game.mode="dead"; Game.showMessage("SLIME SWARM // PRESS R TO REBOOT"); } });
};
Slimes.draw = function (c) { Slimes.list.forEach(function (s) { c.save(); c.translate(s.x, s.y); c.fillStyle=s.hit?"#fff":"#65ff75"; c.shadowColor="#65ff75"; c.shadowBlur=18; c.beginPath(); c.arc(0,25,22,Math.PI,0); c.lineTo(22,35); c.lineTo(-22,35); c.closePath(); c.fill(); c.fillStyle="#07121b"; c.shadowBlur=0; c.fillRect(-10,17,5,7); c.fillRect(6,17,5,7); c.restore(); }); };

var originalStartLevel = Game.startLevel;
Game.startLevel = function (n, resetScore) { originalStartLevel.call(Game, n, resetScore); Slimes.reset(); if (n === 2) { Game.boss.health = CONFIG.BOSS_HEALTH; Game.boss.shotClock = -50; } };
var originalUpdate = Game.update;
Game.update = function () { originalUpdate.call(Game); Slimes.update(); if (Game.mode === "won" && Game.levelNumber >= 1 && Game.levelNumber < 7) { var next = Game.levelNumber + 1; Game.startLevel(next, false); Game.showMessage("SECTOR CLEAR // TELEPORTING TO " + Level.name); } };
var originalDraw = Draw.everything;
Draw.everything = function () { originalDraw.call(Draw); if (Game.mode === "playing" && Game.levelNumber === 0) Slimes.draw(Draw.ctx); };

AudioFX.masterVolume = 0.7; AudioFX.gunVolume = 0.8;
var originalTone = AudioFX.tone;
AudioFX.tone = function (freq, duration, type, volume) { originalTone.call(AudioFX, freq, duration, type, (volume || 0.04) * AudioFX.masterVolume); };
AudioFX.shoot = function () { AudioFX.tone(520, .07, "square", .035 * AudioFX.gunVolume); };

function showMenu() { document.getElementById("menuScreen").hidden=false; document.getElementById("gameSection").hidden=true; }
function startGame() { document.getElementById("menuScreen").hidden=true; document.getElementById("gameSection").hidden=false; Game.startLevel(CONFIG.START_LEVEL, true); }
function bindMenu() {
  document.getElementById("playButton").addEventListener("click", startGame);
  document.getElementById("settingsButton").addEventListener("click", function () { var p=document.getElementById("settingsPanel"); p.hidden=!p.hidden; });
  ["masterVolume","gunVolume"].forEach(function (id) { var input=document.getElementById(id), output=document.getElementById(id+"Value"); input.addEventListener("input", function () { AudioFX[id === "masterVolume" ? "masterVolume" : "gunVolume"]=Number(input.value); output.value=Math.round(input.value*100)+"%"; output.textContent=output.value; }); });
}
