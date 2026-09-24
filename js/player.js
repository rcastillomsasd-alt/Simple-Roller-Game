var Player = { x:0,y:0,vx:0,vy:0,onGround:false,angle:0,trail:[],health:3,hitUntil:0,jumpsRemaining:2 };
Player.reset = function () { Player.x=Level.startX; Player.y=Level.startY-2; Player.vx=0; Player.vy=0; Player.onGround=false; Player.angle=0; Player.trail=[]; Player.health=3; Player.hitUntil=0; Player.jumpsRemaining=2; };
Player.update = function () {
  var size=CONFIG.PLAYER_SIZE;
  Player.vx=0; if(Input.left) Player.vx=-CONFIG.MOVE_SPEED; if(Input.right) Player.vx=CONFIG.MOVE_SPEED;
  if (Input.jumpPressed) {
    if (Player.onGround) { Player.vy=-CONFIG.JUMP_POWER; Player.onGround=false; Player.jumpsRemaining=1; }
    else if (Player.jumpsRemaining > 0) { Player.vy=-CONFIG.JUMP_POWER; Player.jumpsRemaining=0; }
    Input.jumpPressed=false;
  }
  Player.vy=Math.min(Player.vy+CONFIG.GRAVITY,CONFIG.MAX_FALL);
  var sx=Player.vx>0?1:-1;
  for(var i=0;i<Math.abs(Player.vx);i++){if(Collide.hitsSolid(Player.x+sx,Player.y,size,size))break;Player.x+=sx;Player.angle+=sx/CONFIG.PLAYER_RADIUS;}
  var sy=Player.vy>0?1:-1; Player.onGround=false;
  for(var j=0;j<Math.abs(Player.vy);j++){if(Collide.hitsSolid(Player.x,Player.y+sy,size,size)){if(sy>0){Player.onGround=true;Player.jumpsRemaining=2;}Player.vy=0;break;}Player.y+=sy;}
  if(Player.x<0)Player.x=0;
  Player.trail.push({x:Player.x+size/2,y:Player.y+size/2}); if(Player.trail.length>8)Player.trail.shift();
};
Player.takeDamage = function () { var now=performance.now(); if(now<Player.hitUntil)return false; Player.hitUntil=now+CONFIG.BOSS_DAMAGE_COOLDOWN; Player.health--; AudioFX.hurt(); return Player.health<=0; };
Player.isDead = function () { var size=CONFIG.PLAYER_SIZE; return Collide.hitsSpike(Player.x,Player.y,size,size)||Player.y>CONFIG.CANVAS_H+180||Player.health<=0; };
Player.hasWon = function () { return Collide.hitsFinish(Player.x,Player.y,CONFIG.PLAYER_SIZE,CONFIG.PLAYER_SIZE); };
