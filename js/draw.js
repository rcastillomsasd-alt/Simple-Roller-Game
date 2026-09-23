var Draw = {
  canvas: null,
  ctx: null,
  cameraX: 0
};

Draw.setup = function () {
  Draw.canvas = document.getElementById("game");
  Draw.ctx = Draw.canvas.getContext("2d");
};

Draw.updateCamera = function () {
  Draw.cameraX = Player.x - CONFIG.CANVAS_W * 0.38;
  if (Draw.cameraX < 0) { Draw.cameraX = 0; }

  var furthest = Level.pixelWidth() - CONFIG.CANVAS_W;
  if (furthest < 0) { furthest = 0; }
  if (Draw.cameraX > furthest) { Draw.cameraX = furthest; }
};

Draw.everything = function () {
  var ctx = Draw.ctx;
  var gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_H);
  gradient.addColorStop(0, Level.secret ? "#1a1030" : "#0d1831");
  gradient.addColorStop(1, "#090b18");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);

  ctx.save();
  ctx.translate(-Draw.cameraX, 0);
  Draw.background();
  Draw.world();
  Draw.gems();
  Draw.player();
  ctx.restore();
};

Draw.background = function () {
  var ctx = Draw.ctx;
  var drift = Draw.cameraX * 0.15;

  ctx.fillStyle = "rgba(255,255,255,0.06)";
  for (var i = 0; i < 40; i++) {
    var x = ((i * 173) - drift) % (Level.pixelWidth() + 120);
    var y = 30 + (i * 71) % 240;
    ctx.fillRect(x, y, (i % 3) + 1, (i % 3) + 1);
  }
};

Draw.world = function () {
  var ctx = Draw.ctx;
  var size = CONFIG.TILE;
  var firstCol = Math.floor(Draw.cameraX / size) - 1;
  var lastCol = firstCol + Math.ceil(CONFIG.CANVAS_W / size) + 2;

  for (var row = 0; row < CONFIG.ROWS; row++) {
    for (var col = firstCol; col <= lastCol; col++) {
      var here = Level.charAt(col, row);
      var x = col * size;
      var y = row * size;

      if (here === "#") {
        ctx.fillStyle = "#18254b";
        ctx.fillRect(x, y, size, size);
        ctx.strokeStyle = "#3554a3";
        ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
        ctx.fillStyle = "rgba(84, 245, 229, 0.18)";
        ctx.fillRect(x + 3, y + 3, size - 6, 3);
      }

      if (here === "^") {
        ctx.fillStyle = "#ff4f9a";
        ctx.beginPath();
        ctx.moveTo(x + 4, y + size);
        ctx.lineTo(x + size / 2, y + 4);
        ctx.lineTo(x + size - 4, y + size);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#ffb3d2";
        ctx.stroke();
      }

      if (here === "F") {
        ctx.strokeStyle = "#54f5e5";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + 12, y + size);
        ctx.lineTo(x + 12, y);
        ctx.stroke();

        ctx.fillStyle = "#54f5e5";
        ctx.beginPath();
        ctx.moveTo(x + 14, y + 3);
        ctx.lineTo(x + size - 3, y + 11);
        ctx.lineTo(x + 14, y + 20);
        ctx.fill();
      }
    }
  }
};

Draw.gems = function () {
  var ctx = Draw.ctx;

  Level.collectibles.forEach(function (gem) {
    if (gem.got) { return; }

    ctx.save();
    ctx.translate(gem.x, gem.y);
    ctx.rotate(Math.PI / 4);
    ctx.shadowColor = "#ffd166";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(-8, -8, 16, 16);
    ctx.fillStyle = "#fff1b8";
    ctx.fillRect(-4, -4, 8, 8);
    ctx.restore();
  });
};

Draw.player = function () {
  var ctx = Draw.ctx;
  var r = CONFIG.PLAYER_RADIUS;
  var centerX = Player.x + CONFIG.PLAYER_SIZE / 2;
  var centerY = Player.y + CONFIG.PLAYER_SIZE / 2;

  Player.trail.forEach(function (point, index) {
    ctx.fillStyle = "rgba(84, 245, 229, " + (index / Player.trail.length) * 0.18 + ")";
    ctx.beginPath();
    ctx.arc(point.x, point.y, r * (index / Player.trail.length), 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.shadowColor = "#54f5e5";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#54f5e5";
  ctx.beginPath();
  ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#0b1023";
  ctx.beginPath();
  ctx.arc(centerX + Math.cos(Player.angle) * r * CONFIG.DOT_DISTANCE,
           centerY + Math.sin(Player.angle) * r * CONFIG.DOT_DISTANCE,
           4, 0, Math.PI * 2);
  ctx.fill();
};
