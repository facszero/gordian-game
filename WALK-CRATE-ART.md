# Caminata del jefe y cajas industriales

Recursos creados con image_gen integrado y convertidos a WebP para el juego:
- dist/assets/boss-walk.webp: cuatro pasos de patas en una hoja 2 × 2; torso y cola mantienen la misma posición. Se recortan celdas alineadas para evitar oscilaciones del cuerpo. La fase de caminata sigue el desplazamiento horizontal real y se invierte al retroceder.
- dist/assets/industrial-crates.webp: caja intacta y dañada, con acero, remaches, refuerzos y franja de advertencia. Conservan la geometría y resistencia anteriores.

El jefe deja de dibujarse completamente al morir. El doble salto permite una nueva impulsión al pulsar de nuevo salto en el aire; mantener el botón no lo activa. Se recupera al tocar una plataforma y se reinicia al reaparecer.

## Prompt de caminata

Use reference as exact identity of the giant mechanical scorpion boss. Create an animation sprite sheet with exactly FOUR full-body scorpions in a precise 2 columns x 2 rows equal-cell layout, each cell 768x512, total1536x1024. All face LEFT. Four consecutive walking gait frames: 1 near front leg lifted and extended forward, rear planted pushing; 2 near front foot planted pulling and opposite middle leg lifted; 3 near rear leg lifted swinging forward with opposite front planted; 4 near rear foot planted, front leg bends lifting for next cycle. Clearly different articulated LEG positions in all four frames, visible mechanical leg walking, not jumping. Body, pincers and tail remain the SAME POSITION, dimensions and orientation in every cell, body level, no vertical bob, identical floor baseline. Keep original blue steel, silver pincers, bronze joints and red lights, detailed anime cel style. Each whole silhouette fits within its own cell with 30 pixels clear margin, no overlap or cropping. Background flat solid PURE MAGENTA #ff00ff, no glow outside silhouette, no ground, no shadow, no labels, no text, no UI. Change legs ONLY while keeping same recognizable design.

## Prompt de cajas

Game prop sprite atlas: EXACTLY two isolated tall rectangular industrial crates side by side in equal cells on flat solid MAGENTA #ff00ff. Left: intact reinforced steel crate; right: SAME crate visibly damaged with cracks, dented plating and exposed inner braces, no detached debris. Front elevation, slight bevel depth only, vertical rectangle proportions width2 height3. Thick navy gunmetal frame, worn bronze metal edges, rivets, diagonal X structural braces, amber black hazard band across middle, small cyan indicator. Hand drawn detailed 1980s mecha anime cel shading, match industrial platforms and steel hangars. No words, no text, no numbers, no scenery, no ground or shadows outside silhouette. Identical position, dimensions and baseline in both cells. Generous magenta border. Crisp readable at 60x90 pixels. 1536x1024.
