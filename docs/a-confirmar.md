# A confirmar con el cliente (lo que la demo NO inventó)

Cada punto está marcado en el propio sitio (sellos “demo” / “a confirmar”), así
que nadie puede confundir un placeholder con información publicada. Para pasar a
sitio real hay que resolver esta lista; cuando un dato llega, se escribe en
`content/*.json` y se le pone `confirmed: true`.

## Contacto y conversión

1. **WhatsApp real** (número E.164 o el link corto `wa.me/message/…`): el del
   perfil de Instagram puede no ser el de reservas. → `site.json → contact.whatsapp`.
2. **Teléfono** `4432 18 31`: confirmar que es la línea que contestan y si
   corresponde `+598 4432 1831` u otro formato para el `tel:`.
3. ¿quién contesta y en qué horario? (define el copy del botón y el del 404).
4. Email de reservas/contacto, si existe.

## Horarios y temporada

5. Días y franjas de apertura por temporada (alta / baja / eventos).
6. Hora exacta de cierre de cocina y si hay “última mesa”.
7. Temporada: ¿abre todo el año o solo de X a Y? (hoy `hours[].days: []` → el
   sitio dice “a confirmar”).
8. Feriados / lluvia / viento: política de cierre del deck.

## Carta

9. Carta real con precios en UYU (y si quieren mostrar también referencia en ARS/USD
   → `currency.second`, ya está soportado con un `rate`).
10. ¿Qué se muestra y qué no? (`available: false` esconde sin borrar.)
11. Tildaciones reales: vegetariano/a / sin TACC / para compartir (hoy `tags` con
    etiquetas genéricas).
12. Alérgenos y avisos legales si los quieren en el PDF.
13. PDF de la carta (hoy el botón sale deshabilitado a propósito).

## Experiencias

14. Sunset: ¿hay reserva preferente? ¿hora exacta de la “hora dorada” que venden?
15. Fuego/noche: ¿todos los días? ¿hay música en vivo y de qué tipo?
16. Brunch: día, horario y si requiere reserva.
17. Eventos/casamientos/aniversarios: capacidad real, depósito, quién contrata.
18. ¿Estas 4 son las experiencias correctas o hay que renombrar/agregar?

## Diferenciales

19. **Pet friendly**: adentro/afuera, size limit, si hay agua/comedero, reglas a
    publicar (hoy el bloque solo dice “a confirmar”).
20. **Artesanal**: qué producen realmente (panadería, conservas, helados,
    proveedores locales) y sus nombres; el copy provisorio tiene que desaparecer.
21. Beneficios vigentes: promociones bancarias reales (hoy Scotiabank con
    `pending: true`), día/hora/tope de descuento, banco y medio de pago.

## Marca y material

22. **Logo vectorial** (AI/SVG) + versiones claras/oscuras, y tipografías de la
    marca si las hay. Hoy usamos una tortuga propia dibujada para la demo.
23. Name exacto para SEO: ¿“Tartaruga Sea-Bar”, “Tartaruga Punta Colorada”?
24. `sameAs`: ¿hay sitio/web de reservas propio, Facebook, Tripadvisor, Google
    Business Profile? (JSON-LD hoy solo publica el Instagram verificado).
25. Google Business Profile: ¿existe, reclamado, con horarios cargados? (hay que
    sincronizar lo del sitio con eso, si no se contradicen).
26. Idiomas: ¿PT se queda (Mercado do Porto) o sale? Es un flag en
    `src/i18n/routing.ts`.
27. Precisión del mapa: las coordenadas actuales son el faro
    (`-34.9016, -55.2635`); si la puerta está en otra calle, se corrige en
    `site.json → coords`.
28. Sonido ambiente: ¿tienen grabaciones propias (olas/fuego/brisa)? Sin eso, la
    síntesis Web Audio queda (es nuestra y no necesita licencia).
29. Términos, política de cancelación, y si corresponde aviso de filmación/eventos.
30. Datos de analytics/consent que quieran (hoy no hay trackers de terceros).
