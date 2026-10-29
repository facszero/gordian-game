# Gordian Android — campaña 0.5.0

Port nativo Godot 4.7.2 / GDScript / Compatibility. Campaña de doce niveles, dos rutas secretas, menú principal y tema musical. Funciona sin WebView y sin conexión. La versión web en dist/ permanece intacta.

## Alcance

- Base web: 11439a2ef93966d3e5c8e7df9147a979d7e61f80.
- Referencia Android anterior: 0.4.0, commit 85b2bed4cfba7dc2c86ecd94dd15f7552d803b20. El usuario validó sus cuatro niveles en teléfono; el recorte del enemigo flotante del nivel 3 se corrige en esta entrega.
- Niveles 1–12: recorridos completos, plataformas, grupos enemigos A–F, barreras, células, checkpoints y acompañante. Se conservan las extensiones de los recorridos de la web.
- Protesser, Dellinger y Garbin: armas, poses y estadísticas propias; controles multitáctiles y mando.
- Centinela de acero, Dellinger Oscuro, cuatro encuentros de élite y Dokuma con tres fases, drones, suministros y ataques telegrafiados.
- En los combates finales, la destrucción de Garbin libera a Dellinger; la de Dellinger libera a Protesser. La derrota de Protesser consume una vida y el reintento restaura Garbin y al jefe.
- Vencer a Dokuma con Garbin lleva al epílogo; con Dellinger abre Núcleo Madokter (13); con Protesser abre Cryodrax Prime (14). Los extras comienzan con Garbin y conservan las vidas.
- Todas las transiciones y relatos, incluido el desacoplamiento doble tras el nivel 8 y el reabastecimiento del 11. Duraciones originales: 15 s tras el 3, 20,8 s tras el 8, 10 s tras el 11 y 11 s en las restantes.
- Pantalla principal con arte, textos, nueva misión, continuar y IntroGordian en bucle. La música se detiene al jugar y se suspende al enviar la app al fondo.
- Sonidos diferenciados de los nuevos jefes: teletransporte, espada, invocación, rayos, hielo y descarga del reactor.
- Las texturas de plataformas se cargan para el nivel actual y se liberan al cambiar de nivel, en vez de mantener toda la campaña simultáneamente.

## Preparar y ejecutar

Instalar Node.js y Godot **4.7.2 standard**, no .NET. Desde la raíz:

```sh
node android-godot/tools/export-reference.mjs
godot --headless --path android-godot --script tools/prepare_assets.gd
godot --headless --path android-godot --editor --import
godot --path android-godot
```

assets/ se genera a partir de dist/ y no se versiona. El APK incluye los recursos generados. El exportador también genera las referencias de transición y jefes usadas por las pruebas; estas referencias se excluyen del APK y de Git.

```powershell
./android-godot/tools/build.ps1 -Godot 'C:/ruta/godot_console.exe' -ExportAndroid
```

El script prepara, importa, ejecuta siete suites y exporta si se solicita. Usar un perfil de pruebas: las pruebas de integración escriben guardados en el perfil de Godot activo.

## Exportación e instalación

Plantillas Godot 4.7.2, OpenJDK 17, SDK Android con platform-tools, build-tools 36.0.0 y android-36. Configurar SDK, Java y keystore debug en los ajustes del editor. No versionar claves.

```sh
godot --headless --path android-godot --export-debug "Android Debug" build/gordian-level1-debug.apk
```

El nombre interno de salida se conserva por compatibilidad; contiene toda la campaña. Entrega: gordian-campaign-v0.5.0-debug.apk. Paquete com.facszero.gordian.prototype, versionCode 7, versión 0.5.0-campaign. ARM64, Android 7 mínimo, target 36, OpenGL ES 3, horizontal y sin permiso de Internet. Misma firma debug que las entregas anteriores: instalar encima, sin desinstalar.

## Guardados

Se mantienen user://level1.json y el nombre interno del proyecto para conservar los datos. Compatible con esquemas 1 y 2; añade élites derrotados, robot vencedor y página del epílogo. Las partidas anteriores reciben valores predeterminados para esos campos.

- Partida en curso: continúa desde el último checkpoint.
- Partida de 0.4.0 con el nivel 4 completado: continúa al 5.
- Durante una transición: vuelve a mostrarla desde el inicio, como la web.
- Vidas conservadas al avanzar, salvo tras los niveles 4 y 8, donde se restauran a cuatro.
- Se guardan barreras, enemigos, células y jefes/élites derrotados; el daño parcial de un jefe no persiste al reintentar.
- Victoria y epílogo se recuperan sin perder la ruta secreta correspondiente.

## Validación

422 comprobaciones: 51 de lógica inicial, 11 de integración, 56 de recursos, 10 de audio, 36 de campaña inicial, 39 de capítulos 3–4 y 219 de campaña completa.

La suite nueva comprueba los huecos principales de los niveles 5–12, las armaduras sucesivas, reintentos, guardados, restauración de vidas, avance por los doce niveles, las tres rutas de final y regreso al menú. Comprueba también la suspensión de la música y la duración de los fragmentos de audio.

La simulación se compara con JavaScript usando aleatoriedad controlada: 60 segundos del Centinela y 90 segundos de cada configuración nueva de jefe/élite, incluyendo cambios de fase. Se comparan estados, tiempos, objetivos, zonas de impacto y proyectiles; tolerancia de 0,001 para los nuevos jefes, por la precisión de Vector2 de Godot. Esto no sustituye una partida completa por una persona.

Capturas reproducibles:

```sh
godot --path android-godot --script tests/capture_full_campaign.gd
```

Revisión visual de menú, enemigo corregido, nuevos escenarios, transiciones, jefes, extras y final. Pendiente: jugar los niveles nuevos en teléfono físico, escuchar la mezcla y evaluar dificultad y rendimiento sostenido.

## Controles y diferencias conocidas

Cruceta a la izquierda; acciones verticales translúcidas (rayo, mira, salto). Teclado: A/D o flechas, espacio/Z, X/J, C/K, arriba/W, abajo/S y Escape. Mando: stick/cruceta, A, X, B y Start.

La interfaz está adaptada a Godot y usa su fuente. Los sonidos enemigos y jefes usan los fragmentos, velocidades y filtros originales, sin la normalización previa de amplitud de Web Audio. Algunos efectos generales son síntesis simplificada; los brillos, trazos y mezclas visuales se adaptaron a CanvasItem. No se afirma identidad píxel a píxel ni de mezcla sonora.

## Próximas etapas

Validación de la campaña completa en teléfono y corrección de diferencias observadas. Después: optimización, firma de publicación, AAB y pruebas de Google Play. Esta APK usa firma debug y no constituye una entrega de tienda. No incluye exportador de Nintendo Switch.
