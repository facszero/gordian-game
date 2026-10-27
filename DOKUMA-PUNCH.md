# Animación corporal de Dokuma

Atlas: dist/assets/dokuma-punch.webp (seis celdas, 3 × 2). Generado con la herramienta integrada imagegen y convertido a WebP. El cuerpo completo sustituye a la pose estática durante reposo, preparación, impacto y recuperación en las fases cercanas. No se superpone ningún recorte de puño. La cintura se registra por fila; el núcleo vulnerable sigue el desplazamiento horizontal. Se mantiene una celda de recarga por orbe.

Prompt: seis poses completas de cintura hacia arriba de Grandmaster Dokuma, conservando armadura verde/negra, oro, alas púrpuras, ojos rojos y tentáculos mecánicos. Reposo, giro de preparación, brazo elevado, extensión, impacto con torso inclinado y recuperación. Cámara fija, escala constante, ambos brazos unidos a los hombros. Sin texto ni efectos que oculten la anatomía. Segunda edición: reemplazar únicamente el fondo cuadriculado por magenta puro para extracción con croma.

## Resolución HD y robots de reserva
Atlas actualizado a 3072 × 2048, seis celdas de 1024 × 1024, WebP calidad 90 (1.086.752 bytes). Poses generadas individualmente con imagegen; se registran sus límites contra las celdas aprobadas para conservar posición, tamaño y tiempos. La primera generación de lámina completa conservó 1536 × 1024 y fue descartada.

Prompt por pose (TOP LEFT, TOP MIDDLE, TOP RIGHT, BOTTOM LEFT, BOTTOM MIDDLE, BOTTOM RIGHT): High-resolution single game sprite, identity-preserving edit. Extract and faithfully redraw ONLY the selected robot pose from the reference 3 by 2 sprite sheet as ONE standalone square 1024x1024 image. Match exactly pose, camera, silhouette and limb positions; restore fine armor and crisp contours. Pure magenta background; no other robots, no labels, no redesign.

Durante el combate activo con Dokuma: Garbin → Dellinger → Protesser. Cada sustituto entra con su salud y energía completas y 2,5 segundos de invulnerabilidad. El jefe conserva daño, fase y orbes; se eliminan los proyectiles enemigos presentes. Al perder a Protesser se aplica el reintento habitual con Garbin y Dokuma restaurados. La cadena también rescata una caída en la arena; no se aplica al recorrido previo ni a otros jefes. Cerrar o reiniciar la partida comienza un intento nuevo, como antes.

