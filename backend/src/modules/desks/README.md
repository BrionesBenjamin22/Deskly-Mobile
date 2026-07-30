# Modulo Desks

## Funcionalidad

Gestion de escritorios, areas de trabajo, localidades y consulta de disponibilidad para una fecha y franja horaria determinada.

Cada area de trabajo puede almacenar su direccion concreta y un par opcional de coordenadas. La localidad representa solamente la ciudad o localidad generica, por ejemplo Chascomus o La Plata. La direccion no se persiste en `Locality` ni se duplica en los escritorios o reservas.

Las lecturas permanecen publicas para sostener disponibilidad y reservas. Las mutaciones `POST`, `PATCH` y `DELETE` de escritorios, tipos y amenities requieren JWT y rol `ADMIN` o `GESTOR`. Las bajas de escritorios son logicas; los tipos y amenities asociados no pueden eliminarse.

`LocalitiesService` con `LocalitiesController` y `WorkAreasService` con `WorkAreasController` concentran el CRUD de ubicaciones sin separar cada operacion en un caso de uso. Sus mutaciones tambien requieren `ADMIN` o `GESTOR`.

- `POST/PATCH/DELETE /localities`
- `GET /localities/:id`
- `POST/PATCH/DELETE /work-areas`
- `GET /work-areas/:id`

Las eliminaciones son bajas logicas. Una localidad con areas activas y un area con escritorios activos devuelven conflicto hasta que sus relaciones sean resueltas.

Las ubicaciones iniciales de las areas operativas se asignan mediante la migracion `20260717000000_assign_work_area_locations`. La relacion se define por UUID para que el orden de consulta o un cambio del nombre visible no alteren el punto mostrado en el mapa.

## Endpoints

```http
POST /desk-descriptions
GET /desk-descriptions
GET /desk-descriptions/:id
PATCH /desk-descriptions/:id
DELETE /desk-descriptions/:id
POST /amenities
GET /amenities
GET /amenities/:id
PATCH /amenities/:id
DELETE /amenities/:id
POST /desks
GET /desks?page=1&limit=9
GET /desks/:id
PATCH /desks/:id
DELETE /desks/:id
GET /desks/availability?date=YYYY-MM-DD&startTime=HH:mm&endTime=HH:mm&localityId=uuid&areaId=uuid
GET /localities
GET /work-areas?localityId=uuid
GET /work-areas/availability?date=YYYY-MM-DD&startTime=HH:mm&endTime=HH:mm&localityId=uuid
```

## Payloads

Alta:

```json
{
  "name": "Escritorio 1",
  "peopleCapacity": 2,
  "descriptionId": "7a3deca2-0063-4e6c-b1ee-a95666b5efdc",
  "areaId": "11111111-1111-4111-8111-111111111111",
  "zone": "A",
  "amenityIds": ["6a3deca2-0063-4e6c-b1ee-a95666b5efdc"],
  "enabled": true
}
```

Edicion:

```json
{
  "name": "Escritorio actualizado",
  "areaId": "11111111-1111-4111-8111-111111111111",
  "zone": "B",
  "enabled": false
}
```

Descripcion reutilizable:

```json
{
  "name": "Escritorio individual",
  "description": "Escritorio con silla ergonomica",
  "peopleCapacity": 1
}
```

Amenities:

```json
{
  "name": "Monitor"
}
```

Listado:

```json
{
  "desks": [],
  "pagination": {
    "page": 1,
    "limit": 9,
    "total": 0,
    "totalPages": 0
  }
}
```

Disponibilidad:

```json
{
  "desks": [
    {
      "id": "uuid",
      "code": "uuid-generado",
      "name": "Escritorio 1",
      "peopleCapacity": 2,
      "areaId": "11111111-1111-4111-8111-111111111111",
      "area": {
        "id": "11111111-1111-4111-8111-111111111111",
        "name": "Area general",
        "localityId": "00000000-0000-4000-8000-000000000001",
        "active": true,
        "locality": {
          "id": "00000000-0000-4000-8000-000000000001",
          "name": "Localidad principal",
          "active": true
        }
      },
      "zone": "A",
      "amenities": []
    }
  ]
}
```

Areas disponibles:

```json
{
  "areas": [
    {
      "id": "11111111-1111-4111-8111-111111111111",
      "name": "Area general",
      "localityId": "00000000-0000-4000-8000-000000000001",
      "active": true,
      "locality": {
        "id": "00000000-0000-4000-8000-000000000001",
        "name": "Localidad principal",
        "active": true
      },
      "availableDeskCount": 2,
      "totalDeskCount": 3
    }
  ]
}
```

Sin disponibilidad:

```json
{
  "desks": []
}
```

Escritorio ocupado:

```json
{
  "desks": [
    {
      "id": "uuid",
      "code": "uuid-generado",
      "name": "Escritorio 1",
      "peopleCapacity": 2,
      "amenities": [],
      "status": "unavailable",
      "reservedSlots": [
        {
          "startTime": "09:00",
          "endTime": "13:00"
        }
      ]
    }
  ]
}
```

## Reglas de negocio

- La fecha es obligatoria y debe tener formato `YYYY-MM-DD`.
- Los horarios son obligatorios y deben tener formato `HH:mm`.
- El horario de fin debe ser posterior al horario de inicio.
- El codigo del escritorio se genera automaticamente como UUID al crear la entidad.
- El usuario no informa ni edita el codigo desde los formularios.
- La cantidad de personas es propia de cada escritorio mediante `peopleCapacity`.
- La descripcion del escritorio es reutilizable y agrupa informacion descriptiva del tipo de escritorio.
- Cada escritorio pertenece a un area de trabajo mediante `areaId`.
- Cada area de trabajo pertenece a una localidad.
- La direccion pertenece al area de trabajo concreta y puede omitirse.
- Las coordenadas del area son opcionales, pero latitud y longitud deben persistirse juntas.
- La base de datos valida latitud entre -90 y 90 y longitud entre -180 y 180.
- No existe un campo de referencia de ubicacion; la direccion postal y las coordenadas son suficientes para identificar el edificio.
- Las areas y localidades poseen estado `active`.
- La disponibilidad de un area se calcula a partir de sus escritorios disponibles.
- Las areas sin escritorios disponibles no se devuelven en `/work-areas/availability`.
- La disponibilidad agregada por area se resuelve en PostgreSQL con una unica
  consulta. Solo se cuentan como ocupadas las reservas `PENDING_PAYMENT`,
  `RESERVED` y `ACTIVE` que se superponen con la franja solicitada; los limites
  exactos se consideran adyacentes y no superpuestos.
- La reserva se sigue realizando sobre un escritorio concreto.
- No se puede reservar un escritorio si su area o localidad asociada esta inactiva.
- La zona del escritorio debe ser `A`, `B` o `C`.
- Los amenities representan activos asociados al escritorio.
- El borrado de escritorios es logico mediante `deleted_at`.
- Los escritorios eliminados no aparecen en listados, detalle ni disponibilidad.
- Solo se devuelven escritorios habilitados.
- Las reservas `RESERVED` y `ACTIVE` superpuestas marcan el escritorio como `unavailable` e informan la franja ocupada.
- Las reservas `CANCELLED` no bloquean disponibilidad.
- Los listados usan paginacion con 9 items por defecto.

## Validaciones de entrada

Las validaciones se aplican en DTOs HTTP y se mantienen tambien como reglas de dominio cuando corresponde.

Escritorios:

- `name`: texto opcional, maximo 120 caracteres.
- `peopleCapacity`: entero opcional, minimo 1.
- `descriptionId`: UUID v4 opcional.
- `areaId`: UUID v4 opcional. Si no se informa, se usa el area general creada por migracion.
- `zone`: valor opcional restringido a `A`, `B` o `C`.
- `amenityIds`: lista opcional, debe enviarse como array de UUID v4 y sin repetidos.
- `enabled`: booleano opcional.

Descripciones reutilizables:

- `name`: texto obligatorio, maximo 120 caracteres.
- `description`: texto opcional, maximo 255 caracteres.
- `peopleCapacity`: entero obligatorio, minimo 1.

Amenities:

- `name`: texto obligatorio, maximo 120 caracteres.
- `name`: puede contener letras, numeros, espacios y apostrofe para pulgadas, pero debe incluir al menos una letra.

Disponibilidad:

- `date`: obligatoria con formato `YYYY-MM-DD` y fecha real.
- `startTime`: obligatorio con formato `HH:mm`.
- `endTime`: obligatorio con formato `HH:mm`.
- `endTime` debe ser posterior a `startTime`.
- `zone`: opcional restringida a `A`, `B` o `C`.
- `areaId`: opcional, UUID v4.
- `localityId`: opcional, UUID v4.

El frontend debe mostrar los errores previsibles junto al campo correspondiente y evitar la peticion cuando el formulario es invalido. El backend conserva las mismas reglas para proteger el contrato ante integraciones externas.

## Arquitectura

- `domain`: entidad `Desk`, propiedades de `WorkArea` y `Locality`, catalogo de descripciones y amenities, value objects `ReservationDate` y `TimeSlot`, errores y puertos.
- `application`: casos de uso CRUD, catalogo, `GetAvailableDesksUseCase`, `ListLocalitiesUseCase`, `ListWorkAreasUseCase` y `GetAvailableWorkAreasUseCase`.
- `infrastructure`: adapters `PrismaDeskRepository` y `PrismaDeskCatalogRepository`.
- `interfaces`: controllers HTTP `DesksController`, `DeskCatalogController`, `DeskAvailabilityController` y `WorkAreasController`.

## Persistencia

Tablas:

- `desks`
- `localities`
- `work_areas`
- `desk_descriptions`
- `amenities`
- `desk_amenities`
- `reservations`

Indices relevantes:

- `desks.enabled, deleted_at`
- `desks.description_id`
- `desks.area_id`
- `desks.zone`
- `localities.active`
- `work_areas.active`
- `work_areas.locality_id, active`
- `desk_amenities.amenity_id`
- `reservations.desk_id, date, status, start_time, end_time`

## Errores

- `400`: datos invalidos, fecha invalida o rango horario invalido.
- `404`: escritorio o item de catalogo no encontrado.
- `409`: item de catalogo en uso o conflicto de negocio.

## Validacion

```bash
pnpm prisma:generate
pnpm build
pnpm test
```
