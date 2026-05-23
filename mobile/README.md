# Deskly Mobile

## Objetivo

Aplicacion movil Expo/React Native para Deskly. La primera pantalla implementada es la base visual de consulta de escritorios disponibles, sin conexion al backend.

## Arquitectura inicial

- `src/theme`: tokens visuales compartidos para colores, espaciado y tipografia.
- `src/components/ui`: componentes reutilizables y sin reglas de negocio.
- `src/features/desks`: componentes, pantalla, tipos y datos mock del modulo de escritorios.

## Variables de entorno

El frontend usa variables publicas de Expo para configurar integraciones visibles desde la aplicacion.

Archivo local esperado:

```bash
cp .env.example .env
```

Variables disponibles:

- `EXPO_PUBLIC_API_URL`: URL base del backend. Si no se define, la app usa `http://10.0.2.2:3000` en Android y `http://127.0.0.1:3000` en web/iOS.

En web local, usar `EXPO_PUBLIC_API_URL=http://127.0.0.1:3000` cuando el backend corre en la misma maquina. Esto evita problemas de resolucion IPv6 con `localhost` en Windows.

## Pantalla de escritorios

`DesksScreen` compone:

- titulo principal
- selector horizontal de fechas
- acceso visual a filtros avanzados
- contador de escritorios disponibles
- listado de cards de escritorios
- estado vacio reutilizable
- barra inferior visual

El selector de fechas adapta la cantidad de dias visibles al ancho de pantalla: en mobile muestra menos opciones y en web/tablet muestra mas dias para aprovechar el espacio disponible.

## Configuracion de escritorios

`DeskSettingsScreen` consume el backend para gestionar:

- escritorios
- amenities

El CRUD simple de amenities permite listar, crear, editar y eliminar elementos mediante el contrato `/amenities`.
Los mensajes de exito y error se muestran de forma visible y se ocultan automaticamente luego de 3 segundos.

## Contrato mock

Los tipos de `features/desks/types/desk.types.ts` siguen el contrato actual del backend:

- `Desk.code`, generado automaticamente por el backend y visible solo como dato de lectura
- `Desk.name`
- `Desk.peopleCapacity`
- `Desk.zone` con valores `A`, `B`, `C`
- `Desk.description.description`
- `Desk.amenities[]`
- `Desk.enabled`

El formulario de gestion de escritorios no solicita codigo. En altas y ediciones envia solo datos operativos como nombre, tipo, zona, amenities y estado.

## Pendientes

- reemplazar mocks por un service dedicado cuando se conecte el backend
- agregar hooks reutilizables para consulta y filtros
- conectar navegacion real para `Mis reservas`, `Perfil` y `Salir`
- implementar flujo de reserva en una etapa posterior
