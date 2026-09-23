Draw.setup();
bindTouch();
Level.loadData(function () {
  Game.startLevel(CONFIG.START_LEVEL);
  Game.loop();
});
