var Level = {
  pieces: null,
  levels: null,
  grid: [],
  cols: 0,
  name: "",
  startX: 0,
  startY: 0,
  collectibles: [],
  secret: false
};

Level.loadData = function (whenDone) {
  Promise.all([
    fetch("data/pieces.json").then(function (response) { return response.json(); }),
    fetch("data/levels.json").then(function (response) { return response.json(); })
  ])
    .then(function (files) {
      Level.pieces = files[0];
      Level.levels = files[1].levels;
      whenDone();
    })
    .catch(function (error) {
      document.getElementById("message").textContent = "WORLD DATA ERROR";
      console.error(error);
    });
};

Level.build = function (levelNumber) {
  var level = Level.levels[levelNumber];
  Level.name = level.name;
  Level.secret = !!level.secret;
  Level.grid = [];
  Level.collectibles = [];
  Level.cols = level.pieces.length * CONFIG.PIECE_COLS;

  for (var row = 0; row < CONFIG.ROWS; row++) {
    Level.grid.push("");
  }

  for (var p = 0; p < level.pieces.length; p++) {
    var pieceName = level.pieces[p];
    var piece = Level.pieces[pieceName] || Level.pieces["flat"];

    for (var row = 0; row < CONFIG.ROWS; row++) {
      Level.grid[row] += piece[row];
    }
  }

  for (var y = 0; y < CONFIG.ROWS; y++) {
    for (var x = 0; x < Level.cols; x++) {
      var here = Level.charAt(x, y);
      if (here === "S") {
        Level.startX = x * CONFIG.TILE;
        Level.startY = y * CONFIG.TILE;
      }
      if (here === "G") {
        Level.collectibles.push({ x: x * CONFIG.TILE + 12, y: y * CONFIG.TILE + 12, got: false });
      }
    }
  }
};

Level.charAt = function (col, row) {
  if (row < 0 || row >= CONFIG.ROWS) { return "."; }
  if (col < 0 || col >= Level.cols) { return "."; }
  return Level.grid[row].charAt(col);
};

Level.isSolid = function (col, row) { return Level.charAt(col, row) === "#"; };
Level.isSpike = function (col, row) { return Level.charAt(col, row) === "^"; };
Level.isFinish = function (col, row) { return Level.charAt(col, row) === "F"; };
Level.pixelWidth = function () { return Level.cols * CONFIG.TILE; };
Level.shardsLeft = function () {
  return Level.collectibles.filter(function (gem) { return !gem.got; }).length;
};
