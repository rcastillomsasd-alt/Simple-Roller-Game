Draw.setup();
bindTouch();
bindMenu();
Level.loadData(function () {
  Game.mode = "menu";
  showMenu();
  Game.loop();
});
