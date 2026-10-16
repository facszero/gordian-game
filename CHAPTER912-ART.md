# Capítulo final: niveles 9–12

Robots: 9 Protesser, 10 Dellinger, 11 Garbin, 12 Garbin. Los cuatro niveles mezclan las seis familias de enemigos; se reutilizan los fondos de ciudadela, fundición y reactor. La ampliación de los recorridos al triple continúa pendiente.

Nivel 10: dos Centinelas Cobalto, 60 PV (180/3). Nivel 11: dos Espectros Esmeralda, 110 PV (330/3). Daño dividido por tres, paletas aplicadas en Canvas conservando las animaciones originales. Las derrotas de élites se guardan; el encuentro pendiente se reinicia al morir. Los puntos de control quedan antes de las arenas.

## Grandmaster Dokuma (Evolved)

540 PV. Fase 1 sobre dos tercios de vida: pose lejana, drones destructibles y rayos. Fase 2 hasta un tercio: torso cercano, rayos oculares y puños marcados. Fase 3: reactor expuesto, tentáculos bajos, puños y rayos. Cada ataque tiene aviso y recuperación; las transiciones de fase limpian peligros y drones. La derrota elimina el dibujo y abre la salida final.

Arte generado con la herramienta integrada imagegen, sin modelo de API especificado. Referencia: imagen del usuario `a7d008fc-ef21-4fa8-8f56-135e0b8ba4eb.jpg`. Resultado utilizado: `dist/assets/dokuma.webp`, convertido con Sharp desde `exec-819dbb6e-c66a-4624-ab84-34992c776dd7.png`. Regiones de atlas declaradas en game.js; croma magenta eliminado al cargar.

Prompt inicial: atlas 2×2 del mismo emperador mecánico Cthulhu verde oscuro, negro, oro y alas púrpuras; torso frontal lejano, torso cercano de tres cuartos con puño, reactor expuesto y dron de tentáculos; sombreado anime, fondo magenta, sin texto ni escenario.

Corrección: conservar identidad y cuatro poses, dar margen magenta a cada silueta y mostrar enteras las puntas de las alas; sin líneas divisorias. La segunda imagen corregida es la versión usada.

## Android

Se conserva la identidad y ruta de la PWA. El mensaje distingue la solicitud aceptada de la aparición real del icono: `appinstalled` puede llegar antes de que Android termine de instalar el WebAPK. Revisar «Gordian» en el cajón de aplicaciones y Ajustes → Aplicaciones. El juego no puede comprobar la pantalla de inicio del teléfono. Referencia: https://web.dev/learn/pwa/detection

Validación: pruebas de rutas, grupos, guardado de élites, progresión hasta el nivel 12, daño real de Garbin, pausas, reaparición, fases, esquivas y limpieza al derrotar al jefe. Revisar equilibrio con el jugador en Android; la simulación de escritorio no reemplaza esa prueba.
