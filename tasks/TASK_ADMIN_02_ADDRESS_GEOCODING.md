| Campo | Contenido |
|---|---|
| `ID` | `ADMIN-02` |
| `Modulo` | Mobile y backend, administracion de areas de trabajo |
| `Estado` | `PENDIENTE` |
| `Dependencia` | `ADMIN-01`; seleccion del proveedor de geocodificacion |
| `Implementacion` | `mobile/src/features/admin`, `backend/src/modules/desks`, configuracion de entornos |
| `Validacion` | Tests unitarios y contractuales sin red, build, prueba manual sobre mapa, suite completa y `git diff --check` |

# Geocodificacion de direcciones de areas de trabajo

## Objetivo

Calcular automaticamente latitud y longitud a partir de la direccion y localidad ingresadas al crear o editar un area de trabajo.

## Contexto inspeccionado

El formulario administrativo permite guardar direccion, latitud y longitud manualmente. La geocodificacion se reserva como evolucion para evitar acoplar el CRUD inicial a un proveedor externo.

## Riesgos heredados

- Una calle sin localidad, provincia y pais puede producir resultados ambiguos.
- Los proveedores poseen limites, costos y condiciones diferentes para almacenar resultados.
- Las credenciales nunca deben exponerse en mobile.
- Un resultado automatico incorrecto no debe guardarse sin confirmacion del administrador.

## Alcance

- Definir un puerto de geocodificacion en backend y un adaptador configurable.
- Construir la consulta con direccion, localidad, provincia y pais.
- Incorporar una accion explicita `Buscar ubicacion`; no consultar en cada pulsacion.
- Completar latitud y longitud con el resultado seleccionado.
- Mostrar el punto en el mapa antes de guardar.
- Permitir correccion manual de coordenadas.
- Aplicar timeout, rate limit, errores seguros y variables de entorno sin secretos reales.

## Fuera de alcance

- Exponer tokens o claves del proveedor en el frontend.
- Confirmar o guardar una ubicacion solo por obtener una respuesta del proveedor.
- Depender directamente de un proveedor desde el formulario.
- Realizar geocodificacion masiva.

## Secuencia test-first

1. Definir el contrato del puerto y la politica de seleccion de resultados.
2. Probar direccion completa, resultado vacio, ambiguedad, timeout y rate limit con HTTP simulado.
3. Implementar el adaptador del proveedor elegido y la configuracion por entorno.
4. Probar el service y hook mobile con estados de carga, error y confirmacion.
5. Incorporar busqueda, previsualizacion en mapa y correccion manual.
6. Ejecutar las suites completas y la prueba manual con direcciones representativas.

## Criterios de cierre

- La busqueda utiliza direccion y contexto geografico suficiente.
- Las coordenadas se muestran en el mapa y requieren confirmacion.
- El formulario conserva la edicion manual.
- Los secretos permanecen exclusivamente en backend.
- La integracion puede reemplazarse sin modificar el formulario.
- La documentacion identifica proveedor, limites, variables y evidencia real.

## Evidencia

Pendiente. La implementacion no fue iniciada.

## Mensaje de commit propuesto

Se definira cuando la etapa supere la barrera completa de validacion.
