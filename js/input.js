var Input = { left:false, right:false, jump:false, jumpPressed:false, restart:false, fire:false, secretBuffer:"" };
window.addEventListener("keydown", function (event) {
  var jumpKey = event.key === "ArrowUp" || event.key === " " || event.key === "w" || event.key === "W";
  if (jumpKey && !Input.jump) Input.jumpPressed = true;
  setKey(event.key, true);
  if (["ArrowLeft","ArrowRight","ArrowUp"," "].indexOf(event.key) >= 0) event.preventDefault();
});
window.addEventListener("keyup", function (event) { setKey(event.key, false); });
function setKey(key, isDown) {
  if (key === "ArrowLeft" || key === "a" || key === "A") Input.left = isDown;
  if (key === "ArrowRight" || key === "d" || key === "D") Input.right = isDown;
  if (key === "ArrowUp" || key === " " || key === "w" || key === "W") Input.jump = isDown;
  if (key === "x" || key === "X") Input.fire = isDown;
  if (key === "r" || key === "R") Input.restart = isDown;
  if (isDown && key.length === 1) {
    Input.secretBuffer = (Input.secretBuffer + key.toUpperCase()).slice(-CONFIG.SECRET_WORD.length);
    if (Input.secretBuffer === CONFIG.SECRET_WORD && Game.mode === "playing") Game.unlockSecret();
  }
}
Input.clearTransient = function () { Input.jumpPressed = false; Input.restart = false; };
function bindTouch() {
  document.querySelectorAll("[data-key]").forEach(function (button) {
    var key = button.dataset.key;
    button.addEventListener("pointerdown", function (event) {
      event.preventDefault();
      if (button.setPointerCapture) button.setPointerCapture(event.pointerId);
      if (key === "jump" && !Input.jump) Input.jumpPressed = true;
      Input[key] = true;
    });
    ["pointerup","pointercancel","pointerleave"].forEach(function (name) {
      button.addEventListener(name, function () { Input[key] = false; });
    });
  });
  var fire = document.getElementById("fireButton");
  if (fire) fire.addEventListener("pointerdown", function (event) { event.preventDefault(); Game.fire(); });
  var exit = document.getElementById("exitSecret");
  if (exit) exit.addEventListener("click", function () { Game.exitSecret(); });
  var canvas = document.getElementById("game");
  if (canvas) canvas.addEventListener("pointerdown", function () { Game.fire(); });
  var fullscreenButton = document.getElementById("fullscreenButton");
  if (fullscreenButton) {
    fullscreenButton.addEventListener("click", function () {
      var target = document.querySelector(".game-wrap") || document.documentElement;
      if (!document.fullscreenElement) {
        if (!target.requestFullscreen) {
          if (Game.showMessage) Game.showMessage("FULLSCREEN IS NOT SUPPORTED BY THIS BROWSER");
          return;
        }
        target.requestFullscreen().catch(function () { if (Game.showMessage) Game.showMessage("FULLSCREEN REQUEST BLOCKED"); });
      } else if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    });
  }
  document.addEventListener("fullscreenchange", function () {
    var full = document.getElementById("fullscreenButton");
    if (full) full.textContent = document.fullscreenElement ? "⛶ EXIT FULLSCREEN" : "⛶ FULLSCREEN";
  });
}
