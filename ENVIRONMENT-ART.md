# Plataformas y cápsula atómica

Recursos generados con image_gen integrado: `dist/assets/industrial-props.webp` y `dist/assets/energy-atom.webp`. Se conservaron los colores del arte y se convirtió a WebP. El atlas industrial contiene piezas de distintas proporciones; `INDUSTRIAL_REGIONS` describe sus regiones. El croma magenta se elimina al cargar, conservando cualquier alfa original.

Las plataformas se ensamblan y almacenan en caché una vez por nivel/posición. Victor Town usa acero envejecido; la cantera utiliza el borde amarillo de advertencia. Vigas, barandillas, lámparas, tuberías y escaleras inferiores son decorativas. No cambian las superficies de colisión, el salto, la longitud de los niveles ni los puntos de control. La cápsula conserva el efecto de recuperación previo (+25 salud y +25 energía, limitados a sus máximos).

La ampliación del recorrido a aproximadamente el triple está pendiente para el final, según `ROADMAP.md`. No se añadieron nubes ni humo ambiental.

## Prompt de piezas industriales

Use case: stylized-concept. Production modular environment sprite sheet for polished 1980s anime mecha side-scroller. Exactly 4 columns by 2 rows equal cells, canvas 2048x1024. Eight isolated industrial components, each centered wholly within its cell with large solid magenta #ff00ff margins and holes. Side elevation, orthographic, no perspective depth skew. Painted steel with dark navy metal, amber edge light, rust, rivets, worn paint, sharp anime outlines, inspired by industrial catwalks in an abandoned desert city and quarry. NO ground, NO scenery, NO robots, NO text, NO checkerboard.
Top row:
0 long horizontal steel platform deck, 4:1 width:height, perfectly straight horizontal walkable top, thick riveted fascia, welded plates, rusty edge, underside brackets; NO railing, NO pillars. Flat ends suitable for repeating.
1 same proportion horizontal deck for a dark quarry, yellow/black diagonal hazard stripe across top lip, riveted dark blue fascia, industrial grime, underside small reinforcement.
2 one tall narrow vertical load-bearing steel I-beam column, 1:5 width:height, riveted plates, rusty flanges, straight ends.
3 rectangular structural crossbrace frame, about 1:1.4 width:height, strong diagonal X beams with riveted circular center joint, all negative spaces pure magenta.
Bottom row:
0 long thin industrial railing, 4:1 width:height, horizontal pipe top and 4 vertical uprights, rusty joints, negative space magenta.
1 vertical metal maintenance ladder, 1:4 width:height, riveted rails and rungs, magenta gaps.
2 horizontal pipe assembly, 4:1 width:height, thick weathered metal tube, flange connectors and little red valve, flat ends.
3 compact industrial amber warning lamp mounted in dark metal safety cage, rounded luminous glass, sturdy bracket, isolated icon.
Each asset separate, not assembled into a scene. Crisp details readable at small game sizes. Keep magenta uniform.

## Prompt de energía

Use case: stylized-concept. One collectible ENERGY CAPSULE icon for a polished 1980s anime mecha side-scrolling game. Single object centered on flat solid MAGENTA #ff00ff background, large margin. A compact upright hexagonal metal canister with beveled silver casing and dark navy frame, luminous CYAN circular glass face showing a bold simple ATOM EMBLEM: three elliptical electron orbits crossing around one bright central nucleus. Tiny gold connector caps top and bottom. Strong clear silhouette and large atom symbol legible when reduced to 36 pixels. Hand-painted cel shaded metal, crisp dark outlines, small highlights, no outer glow bleeding into background, no floor or cast shadow. Front view with slight bevel depth, no text, no radiation trefoil, no other objects, no checkerboard. Square 1024x1024.
