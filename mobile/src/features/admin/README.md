# Panel de administracion

## Alcance

El panel es la pantalla inicial del rol `ADMIN` y centraliza la gestion de escritorios, tipos de escritorio, amenities, localidades y areas de trabajo.

La barra inferior mantiene accesos separados al panel, Gestion de usuarios y Cuenta. Areas de trabajo, reservas y pagos no se exponen al administrador.

## Estructura

- `AdminCatalogScreen`: seleccion de categoria, formulario de alta o edicion y listado de hasta 9 instancias.
- `useAdminCatalog`: carga coordinada y mutaciones con feedback uniforme.
- `desks.service`: contratos HTTP reutilizados por el panel.

Los formularios de edicion envian solamente los campos modificados. Si no existen diferencias, no se llama al backend.

La edición de escritorios muestra los amenities disponibles como opciones seleccionables. Los amenities asociados aparecen marcados y pueden agregarse o quitarse; el formulario solo envía `amenityIds` cuando cambia la relación.

## Seguridad y eliminacion

Las mutaciones envian el JWT del administrador. El backend permite altas, ediciones y bajas de estos catalogos solamente a `ADMIN` y `GESTOR`.

El service combina `Content-Type: application/json` y `Authorization: Bearer` sin reemplazar encabezados. Esto garantiza que Nest pueda interpretar los payloads autenticados.

Toda eliminacion abre un `ConfirmModal`. La peticion se ejecuta unicamente despues de la confirmacion explicita. Los tipos y amenities asociados a escritorios conservan la validacion de conflicto del backend.

Las areas permiten editar su localidad, descripcion, direccion y coordenadas. Una localidad no puede eliminarse mientras conserve areas activas y un area no puede eliminarse mientras tenga escritorios activos.

## Estados

La pantalla contempla carga, listado vacio y feedback uniforme. Toda alta, edicion o eliminacion muestra un `StatusModal` de exito o error al finalizar. Los errores de carga inicial tambien se presentan visualmente y pueden cerrarse para reintentar la operacion.
Cada categoria muestra un maximo de 9 instancias por pagina.
