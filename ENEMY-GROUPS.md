# Grupos enemigos A–F

A: militar verde oliva, listo, nivel 1. B: insectoide burdeos, listo, nivel 2. C: industrial ocre, listo, nivel 3. D: asedio, listo, nivel 4. E y F: pendientes de diseño. Cada grupo disponible contiene centinela ligero, dron ligero, centinela pesado y dron pesado con poses reposo/disparo.

La distribución completa está en `ENEMY_GROUP_PLAN` en `dist/src/enemies.js`. Desde nivel 5 se mezclan grupos; en los niveles 11 y 12 se prevén los seis. Los niveles 1–4 son jugables. Los futuros grupos no se sustituyen silenciosamente por A.

Recursos: `dist/assets/enemy-army.webp` (A), `enemy-group-b.webp` (B), `enemy-group-c.webp` (C). Galería: `dist/enemy-gallery.html`. Creados con image_gen integrado; B y C recibieron una segunda edición para cambiar únicamente el fondo cuadriculado a croma magenta. El juego elimina ese croma al cargar. Los atlas se normalizaron a 2048 × 1024.

## Prompt B

Use case: stylized-concept. Create GROUP B of an original robot enemy army for a polished 1980s anime platform shooter. Reference image is GROUP A: match its painted cel quality, crisp silhouette, metal edge treatment and red sensors, but create clearly INSECTOID mechanical designs. Transparent background with real alpha, no ground or shadow, no labels, no scenery. Exact 4-column by 2-row sprite atlas at 2048x1024, equal cells, generous margin and full bodies, all facing RIGHT. Each adjacent pair is the same robot idle then firing with a tiny warm muzzle flash; maintain scale and alignment between the pair.
Row1 cells0/1: small six-legged mechanical mite sentry, low segmented carapace, mandible cannon pointing right. Burgundy and dark violet armor, gunmetal legs, ivory metal claws, clustered amber-red sensors. Width about 1.5 times height.
Row1 cells2/3: small airborne beetle drone, plated oval abdomen, two hard wing casings partly open revealing small turbine wings, little chin cannon pointing right. Same burgundy palette. Width 1.6 times height.
Row2 cells0/1: large spider-like armored sentinel, eight sturdy articulated metal legs, tall frontal carapace, abdomen behind, forward jaw cannon at 45 percent body height, amber-red sensor cluster. Clearly mechanical not organic or scary, no human skulls. Width 1.35 times height.
Row2 cells2/3: heavy flying scarab gunship, layered armored wing cases, bulky segmented abdomen, two thrusters, jaw cannon low forward. Width 1.6 times height.
Only these 8 isolated sprites in regular cells. Similar faction craftsmanship to reference but immediately distinct from the olive army. No projectile trails.

## Prompt C

Use case: stylized-concept. Create GROUP C, industrial siege machines for an original 1980s anime platform shooter robot army. Reference is GROUP A: same high quality painted cel illustration, silver metal edges, readable chunky silhouettes, red sensor lenses. GROUP C is distinct: ochre orange construction armor, charcoal hydraulic joints, white diagonal industrial markings without text. Real transparent alpha background, no ground or shadows. Production atlas EXACTLY 4 columns x 2 rows, 2048x1024 equal cells with generous margins, eight full-body isolated sprites. ALL facing RIGHT. Pair layout idle then firing slight recoil and tiny muzzle flash, same alignment and design.
Row1 cells0/1: light industrial quadruped sentry, four chunky piston legs, squat angular armored body, single small side drill stowed safely on rear, horizontal main cannon pointing right. Width 1.5 times height.
Row1 cells2/3: small flying industrial survey drone, angular orange body, two enclosed lift fans, tiny articulated grabbing claws folded below, forward chin cannon. Width1.6 times height.
Row2 cells0/1: massive biped siege automaton, broad blocky orange shoulders, piston legs and broad feet, hydraulic piledriver arm folded near body and giant forward horizontal cannon arm aimed right at mid torso height. Height 1.25 times width, no insect anatomy.
Row2 cells2/3: heavy industrial transport gunship, angular boxy armor, four lift engines, underslung clamp assembly, long front chin cannon. Width1.7 times height.
All eight sprites from one coherent industrial family, meaningful idle/fire differences but no shape drift. No labels, no grids, no landscape, no text, no cropping or touching between cells.

## Edición del fondo

Preserve all eight robots, colors, poses, positions and the 4 by 2 grid. Change ONLY the gray white checkerboard background to flat solid magenta #ff00ff, including gaps between limbs. No gradients, checkerboards or shadows. Preserve small muzzle flashes.

Grupo D — Asedio: tanque, escarabajo de ataque, artillero pesado y nave de asedio. Implementado en nivel 4; comparte acero azul, bronce y luces rojas con el jefe escorpión.

Grupos E (reactores: plata, teal y cobre) y F (legión oscura: negro y carmesí) implementados. Se mezclan desde los niveles 6 y 8 respectivamente, según el plan. Recursos y prompts en CHAPTER58-ART.md.
