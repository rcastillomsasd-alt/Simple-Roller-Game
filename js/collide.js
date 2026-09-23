var Collide = {};

Collide.squaresUnder = function (x, y, width, height) {
  var squares = [];
  var firstCol = Math.floor(x / CONFIG.TILE);
  var lastCol = Math.floor((x + width - 1) / CONFIG.TILE);
  var firstRow = Math.floor(y / CONFIG.TILE);
  var lastRow = Math.floor((y + height - 1) / CONFIG.TILE);

  for (var row = firstRow; row <= lastRow; row++) {
    for (var col = firstCol; col <= lastCol; col++) {
      squares.push({ col: col, row: row });
    }
  }

  return squares;
};

Collide.hitsSolid = function (x, y, width, height) {
  var squares = Collide.squaresUnder(x, y, width, height);
  for (var i = 0; i < squares.length; i++) {
    if (Level.isSolid(squares[i].col, squares[i].row)) { return true; }
  }
  return false;
};

Collide.hitsSpike = function (x, y, width, height) {
  var squares = Collide.squaresUnder(x, y, width, height);
  for (var i = 0; i < squares.length; i++) {
    if (Level.isSpike(squares[i].col, squares[i].row)) { return true; }
  }
  return false;
};

Collide.hitsFinish = function (x, y, width, height) {
  var squares = Collide.squaresUnder(x, y, width, height);
  for (var i = 0; i < squares.length; i++) {
    if (Level.isFinish(squares[i].col, squares[i].row)) { return true; }
  }
  return false;
};
