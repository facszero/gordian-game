# Gordian Android — campaña 0.2.0

Port nativo Godot 4.7.2 / GDScript / Compatibility. Incluye los niveles 1 y 2 completos, sin WebView y sin conexión. El juego web permanece intacto en dist/.

## Referencias y alcance

- Base web: commit 11439a2ef93966d3e5c8e7df9147a979d7e61f80.
- Referencia estable Android 0.1.3, validada por el usuario en teléfono: commit d83e87282b13940eaf3215d08be4284768f4007c. Su APK se conserva separado de las entregas nuevas.
- Nivel 1, Victor Town: Protesser, 40 plataformas, 26 enemigos, 18 células y 5 checkpoints.
- Nivel 2, Cantera de Santore: Dellinger, 32 plataformas, 26 enemigos grupo B, 16 células, 5 checkpoints y 8 barreras destructibles.
- Dellinger: salud 150, ancho 55, alto 120, velocidad 240, salto proporcional a su altura, disparos de daño 2/8 y cadencia 0,24 s. Armamento rojo, poses y audio propios.
- Acoplamiento 01 → 02: 11 segundos, entrada de Protesser, poses y mezclas, luces mecánicas, sombra, oscurecimiento del hangar, etiquetas de fase, indicadores, progreso, fundido final, relato completo «El legado despierta» y botón Continuar.
- Desacoplamiento al terminar el nivel 2, con relato «Bajo la roca» y destino indicado por la historia original. Después se muestra el límite de esta entrega: el nivel 3 todavía no está incluido.

## Preparar y ejecutar

Instalar Node.js y Godot **4.7.2 standard**, no .NET. Desde la raíz:

```sh
node android-godot/tools/export-reference.mjs
godot --headless --path android-godot --script tools/prepare_assets.gd
godot --headless --path android-godot --editor --import
godot --path android-godot
```

Sustituir godot por la ruta real. assets/ se genera a partir de dist/ y no se versiona; el APK incluye todos los recursos. El exportador genera los dos niveles y una referencia de la transición a 120 Hz desde el código web. Mantener estas referencias sincronizadas al modificar el original.

En PowerShell:

```powershell
./android-godot/tools/build.ps1 -Godot 'C:/ruta/godot_console.exe' -ExportAndroid
```

El script prepara, importa, ejecuta las cinco suites y exporta si se solicita. Las pruebas escriben guardados en el perfil de Godot usado: utilizar un perfil de pruebas si se quiere conservar una partida local.

## Exportación e instalación

Plantillas Godot 4.7.2, OpenJDK 17, SDK Android con platform-tools, build-tools 36.0.0 y android-36. Configurar SDK, Java y keystore debug en los ajustes del editor. No versionar claves. Crear android-godot/build/ antes de exportar directamente:

```sh
godot --headless --path android-godot --export-debug "Android Debug" build/gordian-level1-debug.apk
```

El nombre interno del archivo de salida se conserva por compatibilidad con los scripts; ahora contiene ambos niveles. APK entregado: gordian-campaign-v0.2.0-debug.apk. ARM64, API mínima 24, target 36, OpenGL ES 3, horizontal, sin permiso de Internet. Paquete com.facszero.gordian.prototype, versionCode 5, misma firma debug que 0.1.3. Instalar como actualización, sin desinstalar.

## Partidas y transición

Se mantiene la ruta user://level1.json y el nombre interno del proyecto para conservar los datos de las instalaciones anteriores. El esquema 2 identifica el nivel e incluye barreras destruidas; se aceptan partidas del esquema 1 para el nivel 1.

- Una partida en progreso retoma su último checkpoint.
- Una partida antigua que completó el nivel 1 puede continuar directamente con Dellinger.
- Si se guardó durante la transición, se vuelve a mostrar desde el inicio, igual que en la web.
- Al cambiar de nivel se conservan vidas; células, bajas y tiempo del nivel se reinician como en la referencia.
- El cambio de nivel se guarda inmediatamente, también al pulsar Continuar.
- Las cuatro vidas se recuperan al iniciar una nueva misión o reiniciar manualmente un nivel.

## Validación

164 comprobaciones: 51 de lógica del nivel 1, 11 de integración, 56 de recursos, 10 de audio enemigo y 36 de campaña. La suite de campaña incluye cada hueco del recorrido principal de la cantera, daño y colisión de barreras, salto y armas de Dellinger, migración de guardados, transición automática y manual, pausa y restauración. Una comprobación compara 1.321 muestras de poses, etiquetas, entrada y fundidos con couplingState() de la web.

Capturas reproducibles con:

```sh
godot --path android-godot --script tests/capture_campaign.gd
```

Pendiente: completar ambos niveles de esta versión en un teléfono físico, evaluar dificultad, control y rendimiento sostenido y escuchar la mezcla. La versión 0.1.3 fue validada en teléfono; eso no sustituye la prueba de la nueva campaña.

## Controles y diferencias conocidas

Cruceta multitáctil a la izquierda, acciones verticales (rayo, mira, salto), fondos translúcidos. Teclado: A/D o flechas, espacio/Z, X/J, C/K, arriba/W, abajo/S y Escape. Mando: stick/cruceta, A, X, B y Start.

Los sonidos enemigos usan fragmentos MP3, velocidad y filtros de la web, sin su normalización previa de amplitud. Algunos efectos generales siguen sintetizados de forma simplificada; el acoplamiento tiene una recreación del barrido de motor y los tres cierres mecánicos. La tipografía usa la fuente de Godot y puede variar ligeramente respecto de Arial. La interfaz conserva el estilo del port Android. No se afirma equivalencia píxel a píxel ni de mezcla sonora.

## Próximas etapas

Validar esta campaña en teléfono, corregir diferencias observadas y luego integrar el nivel 3, Garbin y el primer jefe. Después migrar la campaña restante y preparar firma de publicación, AAB y pruebas de Google Play. Este proyecto no incluye exportador de Nintendo Switch.
