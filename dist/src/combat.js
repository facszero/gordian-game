// Stance changes keep the feet anchored to the platform.
export function setStance(player, crouch, standingHeight=90) {
  const height=crouch&&player.grounded?Math.round(standingHeight*48/90):standingHeight;
  player.y+=player.h-height;
  player.h=height;
  player.crouching=height<standingHeight;
}

// Full upward-aim artwork includes the raised fist above the normal head height.
export function garbinUpHeight(height,crouching=false){return height*(crouching?1.21/.79:1.145/.84);}
export function playerShot(player, charged=false) {
  const power=player.robot==='garbin'?3:player.robot==='dellinger'?2:1;
  const speed=charged?900:780, length=charged?55:24, thickness=charged?20:7;
  const up=Boolean(player.aimUp);
  return {
    x:player.x+player.w/2+(up?0:player.face*(player.w/2+11)),
    y:up&&player.robot==='garbin'?player.y+player.h-garbinUpHeight(player.h,player.crouching):player.y+(up?-10:player.crouching?player.h/3:player.h*28/90),
    w:up?thickness:length, h:up?length:thickness,
    vx:up?0:player.face*speed, vy:up?-speed:0,
    friendly:true, damage:(charged?4:1)*power, life:1.2
  };
}

// Projectiles are drawn around their center; collisions use the same bounds.
export function shotBounds(shot) {
  return {x:shot.x-shot.w/2,y:shot.y-shot.h/2,w:shot.w,h:shot.h};
}
