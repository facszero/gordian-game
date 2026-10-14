// Stance changes keep the feet anchored to the platform.
export function setStance(player, crouch, standingHeight=90) {
  const height=crouch&&player.grounded?48:standingHeight;
  player.y+=player.h-height;
  player.h=height;
  player.crouching=height<standingHeight;
}

export function playerShot(player, charged=false) {
  const speed=charged?900:780, length=charged?55:24, thickness=charged?20:7;
  const up=Boolean(player.aimUp);
  return {
    x:player.x+player.w/2+(up?0:player.face*30),
    y:player.y+(up?-10:player.crouching?16:28),
    w:up?thickness:length, h:up?length:thickness,
    vx:up?0:player.face*speed, vy:up?-speed:0,
    friendly:true, damage:charged?4:1, life:1.2
  };
}

// Projectiles are drawn around their center; collisions use the same bounds.
export function shotBounds(shot) {
  return {x:shot.x-shot.w/2,y:shot.y-shot.h/2,w:shot.w,h:shot.h};
}
