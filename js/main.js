Draw.setup();
bindTouch();
bindMenu();
Level.loadData(function () { showMenu(); Game.mode="menu"; Game.loop(); });
