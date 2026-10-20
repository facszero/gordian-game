# Historia y primera versión jugable

Los relatos son originales del juego, inspirados en la serie; los escenarios, guardianes oscuros, Núcleo y Cryodrax pertenecen a esta continuidad y no pretenden reproducir el final del anime.

Referencias consultadas: [Tatsunoko: Gordian the Warrior](https://tatsunoko.co.jp/en/works/gordian-the-warrior/) para Daigo y el robot creado por su padre; [Gordian Warrior](https://en.wikipedia.org/wiki/Gordian_Warrior) para Saori, Clint, Victor Town, Santore y los Madokter. Los once párrafos y los cierres están en `dist/src/story.js`.

## Acceso
- Juego: `https://facszero.github.io/gordian-game/`
- Pruebas: `https://facszero.github.io/gordian-game/?dev=1`
- Las partidas de prueba conservan la clave anterior `gordian-v2`. La campaña pública usa `gordian-release-v1`, sin sobrescribir las pruebas.

## Vidas
Cuatro intentos completos por partida. Una derrota o caída consume una vida. En Dokuma y los extras, liberar una armadura interior no consume vida: se descuenta al perder la última. Se guarda el descuento inmediatamente, por lo que recargar no lo revierte. Reiniciar desde pausa conserva las vidas restantes. Al completar la transición 8 → 9 vuelven a cuatro. Al agotarse se regresa al menú, sin opción de continuar esa partida.

## Narrativa y finales
Cada transición muestra un relato breve, también 11 → 12 sin cambio de robot. Dokuma siempre muestra su cierre antes de continuar. Ganando con Garbin, Continuar abre el epílogo; con Dellinger abre Núcleo; con Protesser abre Cryodrax. Cada extra tiene cierre propio, seguido del epílogo con una reflexión adicional. El epílogo conduce al menú principal. Se conserva el punto del cierre al recargar.
