# GORDIAN — El despertar

Dos niveles de un juego de plataformas lateral para navegador y móvil horizontal. Prototipo de aficionado inspirado en Gordian; los personajes pertenecen a sus titulares originales.

## Ejecutar

Con Node.js 20 o posterior: `npm start`. Abrir `http://localhost:4173`. No requiere instalar dependencias. Desde otro dispositivo en la misma red, usar la IP del equipo y el puerto 4173 si el firewall lo permite.

## Controles

- Flechas o A/D: movimiento.
- Z o espacio: salto de altura variable.
- Flecha abajo o S: agacharse en el suelo, con menor altura de colisión y movimiento lento. Soltar para levantarse; saltar también levanta al robot.
- Flecha arriba o W + disparo: disparar verticalmente, también en el aire o con disparo potente.
- En móvil y mando: arriba apunta y abajo agacha; el salto mantiene su botón independiente.
- X o J: disparo continuo.
- C o K: disparo potente (consume energía regenerable).
- Escape: pausa. Controles táctiles en dispositivos de puntero grueso y soporte básico de mando.

## Estado

Incluye Victor Town con Protesser (6200 unidades) y la cantera de Santore con Dellinger (6400 unidades). Hay acoplamiento frontal animado de 11 segundos, con encaje de extremidades, cierre de armadura por etapas y giro a perfil, omisión de la secuencia, enemigos blindados y barreras destructibles. Dellinger tiene 150 de salud, menor velocidad y doble daño por disparo. Cada nivel tiene dos puntos de control. Se guardan el nivel, los objetos recogidos, enemigos derrotados, barreras destruidas y progreso de campaña en el navegador. Se recuperan partidas del primer prototipo. Los niveles 3–12 están planificados, no implementados. Los jefes siguen reservados para 4, 8 y 12.

## Estructura

- `dist/src/level.js`: datos del escenario, robots y campaña.
- `dist/src/config.js`: `DEVELOPMENT_MODE` muestra u oculta el selector temporal de nivel y el botón de prueba del acoplamiento. El selector se genera con los niveles implementados; escoger nivel y pulsar Iniciar misión. Continuar recupera la partida guardada independientemente de la selección. Poner la bandera en `false` para la versión final.
- `dist/src/campaign.js`: validación de partidas y colisión horizontal de barreras.
- `dist/src/game.js`: simulación con paso fijo, controles, audio y render Canvas 2D.
- `dist/assets`: fondos y hoja de poses generados para el prototipo.
- `dist/style.css`: interfaz adaptable.
- `tests`: comprobaciones de física y recorrido. Ejecutar `npm test`.

La hoja de poses usa fondo croma, eliminado al cargar. El arte es una primera interpretación del concepto: requiere una pasada adicional de consistencia y animación. Los enemigos usan un atlas propio con cuatro variantes de la misma familia visual: centinela ligero, explorador aéreo, centinela bípedo blindado y dron pesado. Las plataformas se ensamblan con piezas ilustradas de acero, remaches, vigas y tuberías; las cápsulas de energía muestran un emblema atómico. La geometría de colisión y el recorrido se conservan. Ver ENEMY-ART.md para las referencias de diseño y el estudio de animación ambiental pendiente. El juego puede alojarse como sitio estático sirviendo `dist/`.

## Ampliación

Crear un objeto de nivel con plataformas, enemigos, puntos de control y robot asignado y añadirlo a `LEVELS`. El selector de desarrollo lo incorporará automáticamente. Las transiciones futuras de desacoplamiento y los sprites de Garbin aún deben implementarse. La campaña definida conserva el retorno entre tamaños y el combate final con Garbin. No hay servicios externos, cuentas ni analítica dentro del juego.


## Grupos enemigos

A (militar) aparece en el nivel 1. B (insectoide) aparece en el nivel 2. C (industrial) está creado y reservado para el futuro nivel 3. Cada grupo tiene cuatro unidades en pares de poses reposo/disparo. La galería `enemy-gallery.html`, accesible desde el menú de desarrollo, permite compararlos. `ENEMY_GROUP_PLAN` define las mezclas desde el nivel 5 y los seis grupos en los niveles 11–12; D, E y F están pendientes de diseño. Este plan no desbloquea niveles sin implementar.

La ampliación del territorio de los niveles a aproximadamente el triple está pendiente para la etapa final; ver `ROADMAP.md`.
