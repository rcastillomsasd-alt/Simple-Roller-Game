var Input = { left:false, right:false, jump:false, restart:false, fire:false, secretBuffer:"" };
window.addEventListener("keydown", function (event) {
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
    if (Input.secretBuffer === CONFIG.SECRET_WORD) Game.unlockSecret();
  }
}
function bindTouch() {
  document.querySelectorAll("[data-key]").forEach(function (button) {
    var key = button.dataset.key;
    button.addEventListener("pointerdown", function (event) { event.preventDefault(); Input[key] = true; });
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
}
