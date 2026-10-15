# Arte de casillas, hangar y compañero

Generado con la herramienta integrada image_gen (sin API externa). Archivos del proyecto:
- dist/assets/companion.webp — ocho poses del felino robótico, referencia: figura aportada por el usuario.
- dist/assets/hangar-background.webp — fondo estático de la transición; se conserva la coreografía aprobada.
- dist/assets/stations.webp — entrada, salida y puntos de control apagado/activo.

El título usa CSS (cara roja y extrusión amarilla inspiradas en el afiche), no una fuente instalada. El felino sigue una ruta decorativa por las plataformas principales y salta las barreras. Sale de cámara en unos dos segundos, no participa en combate y no reaparece al morir o continuar una partida guardada. Se omite si el usuario prefiere movimiento reducido.

## Prompts

### Felino
Production sprite atlas for side-scrolling anime mecha game. Reference image defines the ROBOTIC BLACK PANTHER only, ignore human and product branding. Dark navy graphite feline robot, cyan eyes, gold collar with red studs, red circular shoulder and hip panels, silver articulated paws, segmented tail. Match hand-painted cel anime game art, not toy photography. Exactly 4 columns and 2 rows, equal cells, 2048x1024, ample magenta margin, full bodies strictly facing RIGHT. Row1 four successive full-speed galloping poses (stretch, gather, push, stretch). Row2: takeoff, airborne stretched jump, descending jump, landing crouch. Same body size and anatomy in all cells, baseline consistent for running poses. No floor, no shadows, no labels, no streaks. Flat solid #ff00ff MAGENTA background, including gaps between limbs. No checkerboard.

### Fondo
Create a polished 16:9 anime game BACKGROUND ONLY, a vast dark steel maintenance hangar for giant robots, inspired by attached image's architecture. No robots, no people, no text, no UI. Hand-painted detailed 1980s mecha anime cel background. Blue-grey steel walls, rivets, massive vertical ribs, hanging cables, amber industrial lamps, distant catwalks and service gantries on edges. Keep center and right 60% open unobstructed for a foreground robot animation. Perspective floor begins at 84 percent height, flat staging area there. Left side dark for overlaid interface text. Warm amber against desaturated midnight blue. Static, crisp architectural illustration, widescreen.

### Casillas y puntos de control
Create a 2x2 game prop sprite atlas, four separate objects strictly within equal quadrants, plenty of blank margin. Flat uniform pure MAGENTA #ff00ff background. No ground, no shadows outside objects, no text. Detailed 1980s hand drawn mecha anime cel style, dark blue industrial steel with bronze worn edges, rivets, pipes, amber lamps and cyan inset lights. Top left: small rectangular open industrial entry portal hut, front view, cyan lit doorway interior, thick steel frame, hazard stripe threshold and amber overhead light. Top right: matching destination portal hut, front view, more elaborate antenna and twin amber lamps, open cyan lit doorway. Bottom left: narrow waist high checkpoint terminal pedestal with amber glowing circular beacon and tiny screen, protective pipes and solid foot, front view. Bottom right: exact same checkpoint pedestal but activated cyan glowing beacon and screen. Objects isolated, full silhouettes, no clipping, equal scale within each matching pair. Game-ready beautiful mechanical props, legible at small scale.
