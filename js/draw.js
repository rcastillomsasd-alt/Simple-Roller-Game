var Draw = { canvas: null, ctx: null, cameraX: 0 };

Draw.setup = function () {
  Draw.canvas = document.getElementById("game");
  Draw.ctx = Draw.canvas.getContext("2d");
};

Draw.updateCamera = function () {
  if (!Level || typeof Level.pixelWidth !== "function") return;
  Draw.cameraX = Math.max(0, Math.min(Player.x - CONFIG.CANVAS_W * 0.35, Math.max(0, Level.pixelWidth() - CONFIG.CANVAS_W)));
};

Draw.drawBackground = function (c) {
  var sky = c.createLinearGradient(0, 0, 0, CONFIG.CANVAS_H);
  sky.addColorStop(0, "#dfe7d5");
  sky.addColorStop(0.5, "#bfd1b4");
  sky.addColorStop(1, "#2a3d33");
  c.fillStyle = sky;
  c.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);

  c.fillStyle = "rgba(255,255,255,0.12)";
  for (var i = 0; i < 12; i++) {
    var glowX = ((i * 120 - Draw.cameraX * 0.2) % (CONFIG.CANVAS_W + 160)) - 80;
    c.beginPath();
    c.arc(glowX, 80 + (i % 3) * 25, 26, 0, Math.PI * 2);
    c.fill();
  }

  c.fillStyle = "rgba(32, 52, 45, 0.9)";
  for (var ti = 0; ti < 18; ti++) {
    var tx = (ti * 70 - Draw.cameraX * 0.5) % (CONFIG.CANVAS_W + 120);
    var tw = 15 + (ti % 4) * 8;
    var th = 80 + (ti % 5) * 36;
    c.fillRect(tx - 50, CONFIG.CANVAS_H - th, tw, th);
    c.beginPath();
    c.arc(tx - 43, CONFIG.CANVAS_H - th - 14, 28 + (ti % 3) * 7, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.arc(tx + 5, CONFIG.CANVAS_H - th - 10, 24 + (ti % 2) * 8, 0, Math.PI * 2);
    c.fill();
  }
};

Draw.drawTiles = function (c) {
  if (!Level || !Level.grid) return;
  var cols = Level.cols || 0;
  var rows = CONFIG.ROWS;
  var tile = CONFIG.TILE;
  for (var row = 0; row < rows; row++) {
    for (var col = 0; col < cols; col++) {
      var ch = Level.charAt(col, row);
      if (ch !== "#") continue;
      var x = col * tile - Draw.cameraX;
      var y = row * tile;
      c.fillStyle = "#496a52";
      c.fillRect(x, y, tile, tile);
      c.fillStyle = "rgba(142, 191, 135, 0.15)";
      c.fillRect(x + 2, y + 2, tile - 4, tile - 4);
      c.fillStyle = "rgba(28, 42, 36, 0.25)";
      c.fillRect(x, y + tile - 6, tile, 6);
    }
  }

  for (var r = 0; r < rows; r++) {
    for (var c = 0; c < cols; c++) {
      var ch = Level.charAt(c, r);
      if (ch === "^") {
        var x = c * tile - Draw.cameraX + 5;
        var y = r * tile + 18;
        c.fillStyle = "#b6947a";
        c.beginPath();
        c.moveTo(x, y + 10);
        c.lineTo(x + 6, y - 12);
        c.lineTo(x + 12, y + 10);
        c.closePath();
        c.fill();
      }
      if (ch === "F") {
        var fx = c * tile - Draw.cameraX + 6;
        var fy = r * tile + 6;
        c.fillStyle = "#f3e7d0";
        c.fillRect(fx, fy, 22, 22);
      }
      if (ch === "G") {
        var gx = c * tile - Draw.cameraX + 10;
        var gy = r * tile + 10;
        c.fillStyle = "#c9af74";
        c.beginPath();
        c.arc(gx, gy, 6, 0, Math.PI * 2);
        c.fill();
      }
    }
  }
};

Draw.drawPlayer = function (c) {
  var px = Player.x - Draw.cameraX + CONFIG.PLAYER_SIZE / 2;
  var py = Player.y + CONFIG.PLAYER_SIZE / 2;
  c.save();
  c.translate(px, py);
  c.rotate(Player.angle || 0);
  c.fillStyle = "#f5eee0";
  c.beginPath();
  c.arc(0, 0, 15, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#7f9b7d";
  c.fillRect(-7, 16, 14, 10);
  c.restore();
};

Draw.drawBullets = function (c) {
  Game.bullets.forEach(function (b) {
    c.fillStyle = b.enemy ? "#c87d67" : "#f1dac0";
    c.beginPath();
    c.arc(b.x - Draw.cameraX, b.y, 4, 0, Math.PI * 2);
    c.fill();
  });
};

Draw.everything = function () {
  var c = Draw.ctx;
  c.clearRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);
  Draw.drawBackground(c);
  Draw.drawTiles(c);
  if (Monsters && Monsters.draw) Monsters.draw(c);
  Draw.drawBullets(c);
  Draw.drawPlayer(c);

  if (Game.boss) {
    c.save();
    c.translate(Game.boss.x - Draw.cameraX, Game.boss.y);
    c.fillStyle = Game.boss.flash ? "#f3d6be" : "#d89a6b";
    c.shadowColor = "#d89a6b";
    c.shadowBlur = 18;
    c.beginPath();
    c.arc(0, 0, 26, 0, Math.PI * 2);
    c.fill();
    c.shadowBlur = 0;
    c.fillStyle = "rgba(24, 31, 28, 0.8)";
    c.fillRect(-18, 26, 36, 6);
    c.restore();
  }
};

Draw.canvas = null;
Draw.ctx = null;
