# Guia Operativa del Proyecto

## Objetivo

Establecer reglas de trabajo consistentes para acelerar el desarrollo y reducir retrabajo entre frontend y backend.

## 1. Navegacion despues de guardar

Definir una convencion unica para alta y edicion.

Opciones a ajustar:

- En edicion:
  - volver siempre al detalle con `successMessage`
- En alta:
  - volver al home con `successMessage`
  - o ir al detalle recien creado con `successMessage`

Decision del proyecto:

- En edicion:
  - volver siempre al detalle con `successMessage`
- En alta:
  - volver al home con `successMessage`

## 2. Paginacion en homes

Definir si todas las pantallas home deben compartir el mismo criterio.

Opciones a ajustar:

- maximo `9` elementos por pagina
- otro valor
- solo algunas entidades

Decision del proyecto:

- maximo `9` elementos por pagina

## 3. Estructura base de pantallas de detalle

Decision del proyecto:

- tarjeta principal de datos
- tarjeta `Auditoria`
- tarjeta `Historial de cambios`
- boton `Volver`
- boton `Editar` solo si esta activo y el rol lo permite

## 4. Alcance del historial de cambios

Definir que tipo de eventos debe mostrar el historial por entidad.

Opciones a ajustar:

- solo cambios de campos
- cambios de campos + eventos relacionales
- casos especiales por entidad

Decision del proyecto:

- solo cambios de campos
- cambios de campos + eventos relacionales

## 5. Regla de actualizacion en formularios

Definir el comportamiento estandar de los formularios en edicion.

Opciones a ajustar:

- enviar solo los campos modificados
- si no hay cambios, no llamar al backend
- si hay error, mostrar `body.error` o `body.message`
- si hay exito, mostrar `successMessage`

## 6. Convencion de mensajes y textos UI

Definir el estilo textual de la interfaz.

Opciones a ajustar:

- usar tildes y espanol completo
- usar ASCII simple sin tildes
- definir tono de mensajes de exito y error

Decision del proyecto:

- Los mensajes de error del servidor deben aparecer con un estilo similar a: "Lo sentimos! No pudimos recuperar su informacion, intente nuevamente", y ser un llamado a la accion.
- Los mensajes de exito actuales estan bien; todos los formularios y funciones del sistema deben mantener ese estilo.

## 7. Alcance por entidad cuando cambia el backend

Definir que debo actualizar por defecto cuando una entidad cambia en backend.

Opciones a ajustar:

- solo el `service`
- `service` + `home`
- `service` + `form` + `detalle`
- actualizar todo el flujo sin esperar pedido puntual

Decision del proyecto:

- actualizar todo el flujo sin esperar pedido puntual

## 8. Zonas que no deben modificarse sin pedir permiso

Definir areas sensibles del proyecto.

Decision del proyecto:

- layout global
- router principal
- auth
- hooks compartidos
- estilos base
- componentes reutilizables globales

## 9. Manejo de relaciones en formularios

Definir el comportamiento esperado para relaciones como investigadores, becarios, autores, etc.

Opciones a ajustar:

- solo permitir altas nuevas
- permitir altas y bajas en el mismo formulario
- manejar desvinculacion desde detalle
- manejar relaciones desde pantallas separadas

Decision del proyecto:

- Permitir altas y bajas en el mismo formulario, pero sin llamar a la funcion cada vez que se ejecuta la actualizacion; desvinculacion tambien.

## 10. Consumo obligatorio del historial en frontend

Definir si todo historial expuesto por backend debe consumirse en frontend.

Decision del proyecto:

- Si, toda entidad con endpoint de historial debe mostrarlo en detalle, con paginacion de 3 items.

## 11. Coherencia entre frontend y backend

- Si se detecta una incoherencia menor entre frontend y backend que bloquea un flujo, se puede corregir tambien backend sin esperar autorizacion extra, siempre que el cambio sea acotado y consistente con la arquitectura del proyecto.

## 12. Validacion esperada por cada ajuste

Definir que nivel de validacion debe hacerse al terminar un bloque.

Decision del proyecto:

- prueba manual + test backend
- prueba completa al final del modulo

## Regla operativa resumida

Version final del equipo:

- Toda entidad nueva o ajustada debe quedar consistente entre backend y frontend.
- El frontend debe respetar el contrato actual del backend.
- Las pantallas de detalle deben consumir historial de cambios cuando exista endpoint; si no existe, implementarlo.
- Los formularios en edicion deben enviar solo diferencias reales.
- Los mensajes de exito y error deben ser visibles en UI.
- Las decisiones de navegacion y paginacion deben seguir una unica convencion de proyecto: 9 items por home y 3 items de historial de cambios.
- Por cada modulo actualizado necesito realizar un commit. No ejecutes el commit automaticamente; solo entrega el mensaje de commit siguiendo la estructura: `tipo(scope opcional): descripcion breve`.

## 13. Escalabilidad arquitectonica

Toda nueva funcionalidad debe disenarse contemplando:

- modularidad
- separacion de responsabilidades
- reutilizacion futura
- posibilidad de migracion parcial a microservicios
- versionado de datos
- trazabilidad historica
- desacoplamiento frontend/backend
- extensibilidad para nuevos modulos
- Se debe realizar una documentacion en cada carpeta `/frontend` y `/backend` que detalle las funcionalidades, contratos, y demas. Sin emojis.

## 14. Estandarizacion de services

Cada modulo debe poseer:

Frontend:
- service dedicado
- tipos TypeScript
- hooks reutilizables
- validaciones
- manejo uniforme de errores

Backend:
- rutas
- controller
- service
- model
- historial
- permisos

## 15. Seguridad obligatoria

Toda nueva funcionalidad debe contemplar:

- permisos por rol
- validacion backend
- validacion frontend
- auditoria
- soft delete cuando aplique
- proteccion de endpoints criticos
- mensajes seguros
- sanitizacion de inputs
- trazabilidad

## 16. Estandares UX/UI

Toda implementacion debe respetar:

- heuristicas de Nielsen
- consistencia visual
- placeholders
- feedback visible
- prevencion de errores
- accesibilidad basica
- diseno responsive
- minimalismo institucional

## 17. Documentacion tecnica por modulo

Cada modulo debe documentar:

Frontend:
- vistas
- services
- componentes
- hooks
- permisos
- validaciones

Backend:
- endpoints
- payloads
- reglas de negocio
- modelos
- relaciones
- estados
- errores

## 18. Infraestructura y despliegue

Toda nueva implementacion debe mantener compatibilidad con:

- Docker
- Docker Compose
- variables de entorno
- healthchecks
- CI/CD futuro
- proxy reverso
- balanceo
- cloud deployment

## 19. Performance

Toda nueva funcionalidad debe considerar:

- paginacion
- queries optimizadas
- carga diferida
- reutilizacion
- minimizacion de renders
- eficiencia de consultas
