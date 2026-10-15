# GORDIAN — El despertar

Cuatro niveles de un juego de plataformas lateral para navegador y móvil horizontal. Prototipo de aficionado inspirado en Gordian; los personajes pertenecen a sus titulares originales.

## Ejecutar

Con Node.js 20 o posterior: `npm start`. Abrir `http://localhost:4173`. No requiere instalar dependencias. Desde otro dispositivo en la misma red, usar la IP del equipo y el puerto 4173 si el firewall lo permite.

## Controles

- Flechas o A/D: movimiento.
- Z o espacio: salto de altura variable. Soltar y volver a pulsar en el aire activa un segundo salto para cualquiera de los tres robots; se recupera al aterrizar. También funciona con el botón táctil y el mando.
- Flecha abajo o S: agacharse en el suelo, con menor altura de colisión y movimiento lento. Soltar para levantarse; saltar también levanta al robot.
- Flecha arriba o W + disparo: disparar verticalmente, también en el aire o con disparo potente.
- En móvil y mando: arriba apunta y abajo agacha; el salto mantiene su botón independiente.
- X o J: disparo continuo.
- C o K: disparo potente (consume energía regenerable).
- Escape: pausa. Controles táctiles en dispositivos de puntero grueso y soporte básico de mando.

## Estado

Incluye Victor Town con Protesser (6200 unidades) y la cantera de Santore con Dellinger (6400 unidades). Hay acoplamiento frontal animado de 11 segundos, con encaje de extremidades, cierre de armadura por etapas y giro a perfil, omisión de la secuencia, enemigos blindados y barreras destructibles. Dellinger tiene 150 de salud, menor velocidad y doble daño por disparo. Cada nivel tiene dos puntos de control. Se guardan el nivel, los objetos recogidos, enemigos derrotados, barreras destruidas y progreso de campaña en el navegador. Se recuperan partidas del primer prototipo. Los niveles 3 y 4 están implementados con Protesser y Garbin, fondos propios y el primer jefe en el nivel 4. Los niveles 5–12 y los jefes 8/12 están pendientes.

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

Crear un objeto de nivel con plataformas, enemigos, puntos de control y robot asignado y añadirlo a `LEVELS`. El selector de desarrollo lo incorporará automáticamente. Se incluyen el desacoplamiento Dellinger → Protesser y el acoplamiento doble Protesser → Dellinger → Garbin; las transiciones posteriores al nivel 4 quedan pendientes. La campaña definida conserva el retorno entre tamaños y el combate final con Garbin. No hay servicios externos, cuentas ni analítica dentro del juego.


## Grupos enemigos

A (militar) aparece en el nivel 1. B (insectoide) aparece en el nivel 2. C (industrial) aparece en el nivel 3 y D (asedio) en el nivel 4. Cada grupo tiene cuatro unidades en pares de poses reposo/disparo. La galería `enemy-gallery.html`, accesible desde el menú de desarrollo, permite compararlos. `ENEMY_GROUP_PLAN` define las mezclas desde el nivel 5 y los seis grupos en los niveles 11–12; E y F están pendientes de diseño. Este plan no desbloquea niveles sin implementar.

La ampliación del territorio de los niveles a aproximadamente el triple está pendiente para la etapa final; ver `ROADMAP.md`.

Las casillas de entrada/salida y los puntos de control tienen arte industrial propio. La transición conserva sus movimientos sobre un fondo ilustrado de hangar. El humano de polígonos del inicio está oculto. Un felino robótico decorativo corre y salta al comenzar cada nivel; no interviene en combate, no se repite al recuperar una partida y respeta la preferencia de movimiento reducido. El título tiene letras rojas con volumen amarillo inspiradas en el afiche. Referencias, recursos y prompts en `COMPANION-ART.md`; ruta del compañero en `dist/src/companion.js`.

## Capítulos 3 y 4

Nivel 3: Túneles de infiltración, Protesser y grupo C. Nivel 4: Bastión de acero, Garbin y grupo D, con el Centinela de Acero al final. El jefe tiene dos fases y cuatro ataques anunciados: láser alto (agacharse), impacto marcado (moverse) onda baja (saltar) y ráfaga dirigida de tres o cuatro proyectiles (esquivar). El orden de ataque y las pausas varían; el jefe avanza y retrocede en la arena, manteniendo espacio delante del jugador. La segunda fase aumenta la velocidad y acorta las pausas. El punto de control anterior permite reintentar con vida completa; el jefe recupera toda su vida tras la muerte del jugador. La salida solo se abre al derrotarlo.

El selector permite comenzar en cualquiera de los cuatro niveles. La vista de transición usa el nivel seleccionado y el botón «Probar jefe 01» empieza directamente en la arena. Las partidas antiguas que completaron el nivel 2 continúan hacia el 3. Arte y prompts: CHAPTER34-ART.md.
El jefe anima sus patas según su desplazamiento y desaparece completamente al ser derrotado. Las cajas usan versiones industriales intacta y dañada. Recursos y prompts: WALK-CRATE-ART.md.
