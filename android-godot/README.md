# Gordian: prototipo Android del nivel 1

Port nativo en Godot 4.7.2 (GDScript, renderizador Compatibility). El juego se ejecuta con el motor Godot; no utiliza WebView. La referencia es el commit web `11439a2ef93966d3e5c8e7df9147a979d7e61f80`.

## Alcance

Todo el recorrido de Victor Town: 40 plataformas, 26 enemigos, 18 células, 5 checkpoints, cuatro vidas y llegada al hangar con secuencia de acoplamiento. Incluye introducción con acompañante, salto variable y doble salto, disparo normal/potente/vertical, agacharse, controles multitáctiles, teclado y mando, pausa y guardado local. Recuperar partida comienza en el último checkpoint, conservando vidas, enemigos derrotados y células recogidas. Al completar el acoplamiento termina el prototipo; no carga el nivel 2.

Los datos geométricos proceden del nivel web completo. Esto no significa paridad exacta: la IA, algunos efectos, sonidos sintetizados y la representación del disparo vertical son implementaciones iniciales que requieren comparación y ajuste. El esquema de guardado es independiente de la versión web.

## Preparar y ejecutar

Requisitos: Node.js compatible con el proyecto web y Godot **4.7.2 standard**, no .NET. Desde la raíz del repositorio:

```sh
node android-godot/tools/export-reference.mjs
godot --headless --path android-godot --script tools/prepare_assets.gd
godot --headless --path android-godot --editor --import
godot --path android-godot
```

Sustituir `godot` por la ruta del ejecutable instalado. Los PNG y audios de `assets/` son generados a partir de `dist/` y están ignorados en Git; ejecutar la preparación antes de abrir el proyecto por primera vez. El APK sí incluye todos estos recursos y puede jugarse sin conexión.

En Windows se puede ejecutar `./android-godot/tools/build.ps1 -Godot 'C:/ruta/godot_console.exe'`. Agregar `-ExportAndroid` para exportar después de preparar y verificar.

## Exportar Android

Instalar las plantillas de exportación **4.7.2**, OpenJDK 17 y Android SDK (platform-tools, build-tools 36.0.0 y plataforma android-36). En los ajustes del editor de Godot, Export > Android, configurar las rutas del SDK, Java y un keystore de depuración. No guardar claves ni contraseñas privadas en Git.

```sh
godot --headless --path android-godot --export-debug "Android Debug" build/gordian-level1-debug.apk
```

Crear antes `android-godot/build/`. Preset de prueba: ARM64, Android 7/API 24 o posterior, OpenGL ES 3, orientación horizontal, target API 36, sin permiso de Internet. Identificador provisional: `com.facszero.gordian.prototype`. Es un APK de depuración para instalación directa; no es todavía una entrega para Google Play. El AAB, firma de publicación e identificador definitivo corresponden a una etapa posterior.

## Verificación

```sh
godot --headless --path android-godot --script tests/test_level1.gd
godot --headless --path android-godot --script tests/test_runtime.gd
npm test
```

Resultados del primer prototipo: 46 comprobaciones de simulación y guardado, 9 de integración, y 128 pruebas del juego web aprobadas. Las pruebas de simulación incluyen todos los huecos del recorrido principal. Se verificó renderizado de escritorio y firma APK v2/v3. Las pruebas de integración escriben un guardado de prueba: usar un perfil de usuario separado si se desea conservar una partida local.

Pendiente en teléfono físico: completar el nivel manualmente; comprobar multitáctil y comodidad de botones, muescas/barras del sistema, audio, rendimiento sostenido, pausa al bloquear/cambiar de app y restauración tras cerrar el proceso. Las pruebas automatizadas no sustituyen esta evaluación.

## Controles

- Mover: A/D o flechas; mando: cruceta/stick izquierdo.
- Saltar: espacio/Z o A del mando. Soltar y pulsar de nuevo para doble salto.
- Disparar: X/J o X del mando. Potente: C/K o B del mando.
- Apuntar arriba/agacharse: flechas arriba/abajo o W/S.
- Pausa: Escape, Start, botón de pantalla o Atrás en Android.

## Siguientes hitos

1. Validar y ajustar este nivel en un teléfono real, incluyendo rendimiento y controles.
2. Comparar con el original y cerrar diferencias de combate, animación y audio.
3. Migrar progresivamente robots, campaña, jefes y niveles secretos.
4. Preparar versión de publicación y pruebas de Google Play con requisitos vigentes en ese momento.

Este prototipo Android no incluye exportador Nintendo Switch ni confirma compatibilidad de un proveedor de consolas.
