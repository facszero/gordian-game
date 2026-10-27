# Ejército enemigo — niveles 1 y 2

Los cuatro diseños comparten armadura verde oliva, juntas grafito, refuerzos plateados, marcas naranjas y sensores rojos. Nivel 1: centinela sobre orugas y dron explorador. Nivel 2: centinela bípedo blindado y dron pesado. Son interpretaciones originales para el juego, no reproducciones de enemigos canónicos del anime.

Atlas: `dist/assets/enemy-army.webp`, 4 columnas y 2 filas, pares reposo/disparo. Generado con image_gen integrado y normalizado a 2048 × 1024 conservando el canal alfa. El render refleja los sprites para apuntar hacia el jugador. El tamaño de colisión y la boca del cañón dependen de cada variante; los valores de salud y cadencia se conservan.

## Animación ambiental pendiente

Se evaluaron nubes y humo entre fondo y plataformas. Una capa con pocas imágenes reutilizadas, movimiento lento y parallax tiene baja complejidad. El humo con partículas, luces o interacción tiene mayor coste. Si se implementa después, limitar transparencias superpuestas, respetar movimiento reducido y verificar rendimiento en móviles. No se agregó esta animación en este cambio.

## Prompt final

Use case: stylized-concept. Production enemy animation sprite atlas for a 1980s anime side-scrolling mecha platform game. Canvas 2048x1024, EXACTLY FOUR equal columns and TWO equal rows. Eight separate full-body sprites, each wholly within its 512x512 cell with generous margin. Pure solid magenta #ff00ff background for chroma key, no shadows or ground. Painted cel animation matching polished vintage mecha anime. A single coherent original enemy army: dark olive angular armor, graphite joints, brushed silver edges, small orange warning markings and ONE red slit sensor. No green effects, no text labels, no UI, no scenery. ALL enemies facing RIGHT in strict side view, weapons horizontal RIGHT. Consistent shapes between the idle/firing pairs; no bullets or explosions, just subtle warm muzzle glow in firing frame.
TOP ROW:
cell0 light tracked sentry idle: compact low armored chassis with 3 road wheels, angular upper turret with one long cannon, red slit and small rear antenna. Width approximately 1.35 times height.
cell1 identical light tracked sentry firing with cannon slight recoil and subtle muzzle glow. Same silhouette position and feet baseline.
cell2 light flying scout drone idle: armored beetle-shaped oval central body, red lens at right, two small ducted thrusters with metal shrouds, small chin gun pointing right. Width about 1.6 times height.
cell3 identical light flying scout firing with red lens brighter and tiny muzzle glow.
BOTTOM ROW:
cell0 heavy biped sentry idle: broad barrel chest, recessed red visor, thick olive shoulder armor, stocky mechanical legs, huge armored forearm cannon aimed right, smaller left-arm armored guard. Imposing military heavy robot, not a tank; height 1.35 times width. Full body.
cell1 same heavy biped sentry firing with slight recoil, same foot baseline and stance, subtle cannon glow.
cell2 heavy flying gunship idle: shares scout design language but angular reinforced layered plating, two larger enclosed thrusters, stout chin cannon and twin rear exhausts. Width 1.55 times height. Clearly distinct heavier silhouette.
cell3 same heavy flying gunship firing with lens brighter and tiny muzzle glow.
No overlap between cells. Fine outlines but clear silhouettes readable at small in-game sizes. NOT pixel art, NOT 3D render.
