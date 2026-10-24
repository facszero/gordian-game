# Capítulos 5–8: arte y combate

Recursos generados con la herramienta integrada image_gen (sin CLI) y preparados como WebP para el juego.

- dist/assets/foundry.webp: fundición del nivel 5.
- dist/assets/dam.webp: presa del nivel 6.
- dist/assets/reactor.webp: reactor del nivel 7.
- dist/assets/eclipse.webp: ciudadela del nivel 8.
- dist/assets/enemy-group-e.webp: grupo E, reactores, plata/teal/cobre.
- dist/assets/enemy-group-f.webp: grupo F, legión oscura, negro/carmesí.
- dist/assets/dark-dellinger.webp: cuatro poses del jefe 2. Referencia del usuario para alas, negro, rojo y oro; Dellinger como referencia de identidad. Croma eliminado al cargar.

El jefe se representa con una altura de 550 unidades, aproximadamente tres veces las 183 unidades visuales de Garbin. Su colisión corporal excluye alas y espada; los ataques tienen sus propias zonas anunciadas. El teletransporte no causa daño: tras reaparecer hay 1,25 s de aviso (0,95 s en segunda fase). Cerca de un borde usa el lado con espacio libre. Ráfagas de 3/4 disparos, barrido bajo y golpe vertical con objetivo fijo. Las pausas permiten contraatacar. Desaparece completamente tras la derrota y la salida se desbloquea.

Fondos separados de un atlas de cuatro escenarios. Se mantienen las longitudes de prototipo; la ampliación al triple y la mejora estética de los disparos están pendientes.

## Prompts finales y ajustes

### dark

Use case: stylized-concept. Game sprite sheet, exactly FOUR full body poses in equal 2x2 cells, 2048x2048. Image 1 is PRIMARY style, palette and silhouette reference: imposing black glossy evil mecha with HUGE bat-like wings with crimson inner membranes and black blades, black rounded shoulders, red chest, gold trim and helmet horns. Image 2 Dellinger is identity reference: retain recognizable Dellinger face grille, central helmet crest, red chest shape, round shoulders, segmented limbs, now demonic dark winged version. Not just a recolor: combine both, favor first image silhouette and colors. Full body facing RIGHT three-quarter profile in every cell. Top left neutral combat stance, top right aiming forearm cannon diagonally down RIGHT, bottom left holding long silver sword with red edge raised overhead, bottom right crouched sword sweep low RIGHT. Wings folded back enough to keep face, arms and sword readable. Consistent body size, same baseline, same character in all cells, whole wings and swords fully within cell with clear margin. Detailed 1980s mecha anime cel art matching game, not a toy photo. Flat PURE MAGENTA #ff00ff background. No text, no ground, no shadows, no scenery, no UI.

### worlds

Use case: stylized-concept. A game background atlas with FOUR distinct widescreen environments in exact 2 columns by 2 rows, no borders. Total 3072x1728, each panel16:9. Detailed hand painted 1980s mecha anime industrial world. Top left: blue steel foundry, distant molten orange furnaces and overhead gantry cranes. Top right: huge hydroelectric dam at blue twilight, concrete towers and deep water far below. Bottom left: subterranean reactor tunnels, teal energy conduits, dark steel walls and amber maintenance lights. Bottom right: fortress eclipse courtyard, vast obsidian industrial towers under dark violet eclipse sky and distant crimson light. All empty of characters, enemies, platforms in playable foreground, UI, words, logos. These are distant scenic backgrounds behind side scrolling gameplay. Moderate contrast, readable quieter central area.

### e

Use case: stylized-concept. Game enemy atlas EXACTLY 8 sprites in 4 columns x2rows equal cells. All face LEFT, isolated with generous spacing. Reference is style only. New group E: electrical reactor guardians in pale silver and deep teal armor, copper coils, red sensor eyes. Same industrial anime style as reference. Top row cols1/2 same small grounded coil turret in idle/fire poses; cols3/4 same compact flying manta drone idle/fire. Bottom row cols1/2 same heavy humanoid conductor robot idle/fire; cols3/4 same large armored flying gunship idle/fire. All full silhouettes within cells, no overlap. Consistent identity within each pair. Flat MAGENTA #ff00ff background, no shadow, no ground, no text, no scenery. 2048x1024.

### f

Use case: stylized-concept. Game enemy atlas EXACTLY 8 sprites in 4 columns x2rows equal cells. All face LEFT, isolated with generous spacing. Reference is style only. New group F: elite shadow legion, angular black and deep crimson armor with silver edges and red sensor eyes, armored knight and bat motifs, clearly mechanical. Same detailed industrial anime style as reference. Top row cols1/2 same small grounded angular turret idle/fire; cols3/4 same compact batlike flying drone idle/fire. Bottom row cols1/2 same heavy bipedal knight robot with forearm cannon idle/fire; cols3/4 same large winged armored gunship idle/fire. Full silhouettes within cells, no overlap. Consistent identity within each pair. Flat MAGENTA #ff00ff background, no ground, no shadow, no text, no scenery. 2048x1024.

### spacing

Edit this game sprite sheet ONLY to improve grid spacing, preserving EXACT character design, black/red/gold palette, wings, poses and cel shading. Output exactly 2048x2048, FOUR poses centered in four 1024x1024 cells. Each complete figure INCLUDING wings and sword must fit entirely inside an 820x820 inner square centered in its own cell, leaving 102px clear margin on ALL sides. No sprite crosses cell midlines x1024 y1024. Top row neutral and cannon, bottom row sword preparation and sword sweep. Keep the sword tip of bottom left COMPLETELY inside bottom left cell; angle blade more upward if necessary. All poses same body scale and feet same relative baseline. Actual transparent background, no ground, no shadows, no text, no guide lines. This is spacing correction not redesign.

### chroma

Replace ONLY the grey and white checkerboard background with perfectly flat solid PURE MAGENTA #ff00ff. Preserve all four robots exactly, their positions and sizes, poses, colors and sword tips. No checkerboard, no transparency simulation, no shadow, no other change. Whole 2x2 sprite sheet.

