var Level = { pieces:null, levels:null, grid:[], cols:0, name:"", startX:0, startY:0, collectibles:[], secret:false };

Level.loadData = function (whenDone) {
  Promise.all(["data/pieces.json", "data/levels.json"].map(function (url) {
    return fetch(url).then(function (response) {
      if (!response.ok) throw new Error("Unable to load " + url + " (" + response.status + ")");
      return response.json();
    });
  })).then(function (files) {
    if (!files[1] || !Array.isArray(files[1].levels) || !files[1].levels.length) throw new Error("No levels found");
    Level.pieces = files[0];
    Level.levels = files[1].levels;
    whenDone();
  }).catch(function (error) {
    document.getElementById("message").textContent = "WORLD DATA ERROR";
    console.error(error);
  });
};

Level.build = function (levelNumber) {
  if (!Level.levels || !Level.levels[levelNumber]) throw new Error("Invalid level: " + levelNumber);
  var level = Level.levels[levelNumber];
  Level.name = level.name || "UNKNOWN SECTOR";
  Level.secret = !!level.secret;
  Level.grid = [];
  Level.collectibles = [];
  Level.startX = 0;
  Level.startY = 0;
  Level.cols = level.pieces.length * CONFIG.PIECE_COLS;
  for (var row = 0; row < CONFIG.ROWS; row++) Level.grid.push("");
  for (var p = 0; p < level.pieces.length; p++) {
    var piece = Level.pieces[level.pieces[p]] || Level.pieces.flat;
    if (!piece || piece.length !== CONFIG.ROWS) throw new Error("Invalid level piece");
    for (var y = 0; y < CONFIG.ROWS; y++) Level.grid[y] += piece[y];
  }
  for (var row2 = 0; row2 < CONFIG.ROWS; row2++) for (var x = 0; x < Level.cols; x++) {
    var here = Level.charAt(x, row2);
    if (here === "S") { Level.startX = x * CONFIG.TILE; Level.startY = row2 * CONFIG.TILE; }
    if (here === "G") Level.collectibles.push({x:x * CONFIG.TILE + 12, y:row2 * CONFIG.TILE + 12, got:false});
  }
};
Level.charAt = function (col, row) { return row < 0 || row >= CONFIG.ROWS || col < 0 || col >= Level.cols ? "." : Level.grid[row].charAt(col); };
Level.isSolid = function (col, row) { return Level.charAt(col, row) === "#"; };
Level.isSpike = function (col, row) { return Level.charAt(col, row) === "^"; };
Level.isFinish = function (col, row) { return Level.charAt(col, row) === "F"; };
Level.pixelWidth = function () { return Level.cols * CONFIG.TILE; };
Level.shardsLeft = function () { return Level.collectibles.filter(function (gem) { return !gem.got; }).length; };
