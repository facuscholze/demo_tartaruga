# Audio ambiente

El sitio **sintetiza** las olas, el crepitar del fuego y la brisa con Web Audio API
(`src/features/audio/engine.ts`): cero bytes bajados, loop perfecto y cero riesgo de
licencia. No hace falta ningún archivo acá.

## ¿Querés grabaciones propias?

Dejá tres archivos con estos nombres exactos y el motor los usa automáticamente
en lugar de la síntesis:

```
public/audio/olas.mp3
public/audio/fuego.mp3
public/audio/brisa.mp3
```

Requisitos: loops de 20–60 s, volumen bajo (-18 dBFS pico), **licencia libre o
grabación propia**. Anotá el origen y la licencia en `docs/credits.md`.
