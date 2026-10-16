# Ajustes visuales: Garbin y Dellinger Oscuro

Recursos generados/editados con image_gen integrado (sin CLI), convertidos a WebP:

- `dist/assets/garbin-up.webp`: Garbin apuntando verticalmente, de pie y agachado. El sprite completo evita recortar y girar parte del torso. El proyectil sale del puño en ambas orientaciones.
- `dist/assets/dark-dellinger.webp`: las cuatro poses conservan cuerpo, alas, espada y colores. Cabeza reemplazada por la de Dellinger con casco oscuro; calavera amarilla eliminada del pecho.

Las zonas lógicas de daño de la espada se conservan. Se quitaron los rellenos rectangulares rosados: el aviso usa una línea con extremos en el suelo y el ataque un trazo de espada con brillo. Las advertencias permanecen legibles.

Validación: 56 pruebas aprobadas y revisión visual de ambas poses de Garbin en las dos orientaciones, del jefe y de los avisos/cortes.

## Prompt: cabeza y pecho

Edit Image1 (the 2x2 dark boss sprite atlas). Image2 is the exact DELLINGER HEAD identity reference. In ALL FOUR poses replace the head with EXACTLY the head from Image2: smooth rounded Dellinger helmet, single short central crest, round side ear covers, blue eye/temple lens, simple flat silver faceplate and chin. NO horns, NO gold antlers, NO long spikes, NO evil skull face, NO mouth teeth or grille. Copy reference head geometry faithfully and recolor its red helmet to dark charcoal/deep crimson matching the body; retain steel grey face, red eye lens instead of blue. Keep head size proportional to existing head, not tiny. Remove yellow skull from chest in ALL FOUR poses and fill its place with smooth uninterrupted red chest armor; no replacement emblem. Preserve EVERYTHING ELSE exactly: wings, body, sword, gold boots, armor colors, positions, spacing, poses, all full silhouettes, 2x2 grid. Flat pure MAGENTA #ff00ff background. No new symbols, no text. This is a localized head-and-chest edit only.

## Prompt: Garbin

Create a two-pose Garbin sprite atlas using attached Garbin sheet as exact character identity/style reference. 1536x1024, 2 equal cells side by side, full figures entirely within cells, pure flat MAGENTA #ff00ff background. LEFT: full body Garbin standing facing right three-quarter profile, firing arm bent upward with forearm and fist aiming STRAIGHT VERTICALLY ABOVE HIS HEAD, aligned over center of body; other arm relaxed at side. RIGHT: same Garbin kneeling/crouching low facing right, one arm raised aiming STRAIGHT UP above head, other arm braced. CONTINUOUS intact torso, neck and shoulder connected naturally to raised arm. Exact blue white Garbin armor, red belt gold buckle, tall blue helmet fins, yellow eyes, silver face, chunky blue gauntlets and boots from reference. Raised fist just above head, elbow bent naturally, not excessively extended. No beams or flashes, no floor or shadows, no text, no other characters. Bold 1980s anime cel shading same as reference. Generous margins and separation.

