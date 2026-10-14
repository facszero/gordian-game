# GORDIAN — El despertar

Primer nivel de un juego de plataformas lateral para navegador y móvil horizontal. Prototipo de aficionado inspirado en Gordian; los personajes pertenecen a sus titulares originales.

## Ejecutar

Con Node.js 20 o posterior: `npm start`. Abrir `http://localhost:4173`. No requiere instalar dependencias. Desde otro dispositivo en la misma red, usar la IP del equipo y el puerto 4173 si el firewall lo permite.

## Controles

- Flechas o A/D: movimiento.
- Z o espacio: salto de altura variable.
- X o J: disparo continuo.
- C o K: disparo potente (consume energía regenerable).
- Escape: pausa. Controles táctiles en dispositivos de puntero grueso y soporte básico de mando.

## Estado

Incluye entrada de Daigo en Protesser, un recorrido de 6200 unidades, 13 enemigos, dos puntos de control, células de recuperación, guardado local, sonidos sintetizados, pausa automática y aviso de orientación. Los otros once niveles están planificados, no implementados. Los jefes pertenecen a los niveles 4, 8 y 12; este nivel termina en el hangar sin jefe.

## Estructura

- `dist/src/level.js`: datos del escenario, robots y campaña.
- `dist/src/game.js`: simulación con paso fijo, controles, audio y render Canvas 2D.
- `dist/assets`: fondos y hoja de poses generados para el prototipo.
- `dist/style.css`: interfaz adaptable.
- `tests`: comprobaciones de física y recorrido. Ejecutar `npm test`.

La hoja de poses usa fondo croma, eliminado al cargar. El arte es una primera interpretación del concepto: requiere una pasada adicional de consistencia y animación. Los enemigos y plataformas usan dibujo procedural. El juego puede alojarse como sitio estático sirviendo `dist/`.

## Ampliación

Crear un objeto de nivel con plataformas, enemigos, puntos de control y robot asignado; después extraer el selector de nivel y la transición de acoplamiento a escenas independientes. La campaña definida conserva el retorno entre tamaños y el combate final con Garbin. No hay servicios externos, cuentas ni analítica dentro del juego.
