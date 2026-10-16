# Versión web e instalación Android

Destino: GitHub Pages. URL prevista después del primer despliegue exitoso: https://facszero.github.io/gordian-game/

Activar en Settings → Pages → Build and deployment → Source: GitHub Actions. El flujo `.github/workflows/pages.yml` verifica el juego y publica `dist` con cada cambio en `main` o `codex/first-playable-level`. Si GitHub crea restricciones de entorno, autorizar la rama de desarrollo en Settings → Environments → github-pages. La configuración previa de Sites permanece registrada pero no se utiliza para este despliegue.

Interfaz: franja superior reservada para energía, misión/jefe y herramientas; controles y paneles de estilo metálico azul/cian/dorado. La barra del jefe reemplaza el indicador de misión durante el combate.

PWA: `manifest.json`, iconos de 192/512 px, orientación horizontal y apertura independiente. En Chrome Android, usar «Instalar juego» o el menú del navegador → Añadir a pantalla de inicio → Instalar. La disponibilidad del diálogo depende de Chrome.

El primer acceso requiere conexión y descarga aproximadamente 14 MB de arte. El mensaje del menú confirma la disponibilidad sin conexión. El progreso usa el almacenamiento local del dispositivo, sin sincronización entre equipos. Las actualizaciones se aplican con el botón del menú para evitar interrumpir una partida.

Después de modificar recursos publicados, ejecutar `prepare-pwa.mjs` (requiere Sharp; admite `SHARP_PATH`) para regenerar el inventario y la versión de caché. Publicar `dist` excluyendo páginas temporales de preview. El flujo oficial de Sites utiliza la identidad guardada en `.openai/hosting.json`; los tokens nunca se guardan.

Validación: 56 pruebas del juego y tres de PWA (inventario, navegación offline con subruta, aislamiento de caché/activación explícita), revisión del jefe en viewport horizontal de 844 × 390. La instalación en un teléfono Android físico requiere la prueba del usuario.
