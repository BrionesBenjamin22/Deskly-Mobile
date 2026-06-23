# Guía de Testing del Módulo Payments

## Requisitos Previos

- Backend ejecutándose: `pnpm start:dev`
- Base de datos PostgreSQL configurada
- Migraciones ejecutadas: `pnpm prisma migrate dev`

## Tipos de Tests Disponibles

### 1. Tests Unitarios (Recomendado para CI/CD)

Se encuentran en: `src/modules/payments/application/use-cases/*.spec.ts`

Cubren:
- Lógica de use cases
- Manejo de errores
- Validaciones de negocio

**Ejecutar tests unitarios:**
```bash
cd backend
pnpm test -- payments
```

**Con coverage:**
```bash
cd backend
pnpm test -- payments --coverage
```

**Watch mode (recomendado durante desarrollo):**
```bash
cd backend
pnpm test -- payments --watch
```

### 2. Tests de Controller

Se encuentran en: `src/modules/payments/interfaces/http/payments.controller.spec.ts`

Cubren:
- Validación de endpoints HTTP
- Manejo de errores del controller
- Transformación de DTOs

**Ejecutar:**
```bash
cd backend
pnpm test -- payments.controller.spec
```

### 3. Tests de Integración (E2E)

Se encuentran en: `test/payments-integration.e2e.spec.ts`

Cubren:
- Flujo completo de creación de pagos
- Paginación y filtrado
- Validaciones de entrada
- Casos de error

**Requisito:** Backend corriendo en `http://localhost:3000`

**Ejecutar:**
```bash
cd backend
pnpm test:e2e -- payments-integration
```

## Escenarios de Test

### Creación de Pago
✓ Crear pago con datos válidos
✓ Falla si la reserva no existe
✓ Falla con UUID inválido
✓ Falla con fecha en formato incorrecto
✓ Falla con monto <= 0

### Listado de Pagos
✓ Listar con paginación (9 items default)
✓ Filtrar por reservationId
✓ Validar parámetros de paginación
✓ Calcular totalPages correctamente

### Obtener Detalle
✓ Obtener pago existente
✓ Retornar 404 si no existe
✓ Retornar 400 con UUID inválido

### Eliminar Pago
✓ Eliminar pago existente
✓ Retornar 404 si no existe
✓ Verificar que después de eliminar no se puede recuperar

### Múltiples Pagos por Reserva
✓ Crear múltiples pagos para la misma reserva
✓ Listar todos correctamente
✓ Filtrar por reservationId

## Testing Manual con Postman/cURL

### Paso 1: Crear Escritorio (si no existe)
```bash
curl -X POST http://localhost:3000/desks \
  -H "Content-Type: application/json" \
  -d '{
    "code": "D-TEST-01",
    "name": "Escritorio Test",
    "peopleCapacity": 1,
    "zone": "A"
  }'
```

Guardar el `deskId` retornado.

### Paso 2: Crear Reserva
```bash
curl -X POST http://localhost:3000/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "deskId": "UUID_DEL_DESK",
    "date": "2026-06-25",
    "startTime": "09:00",
    "endTime": "13:00"
  }'
```

Guardar el `reservationId` retornado.

### Paso 3: Crear Pago
```bash
curl -X POST http://localhost:3000/payments \
  -H "Content-Type: application/json" \
  -d '{
    "reservationId": "UUID_DE_LA_RESERVA",
    "date": "2026-06-22",
    "amount": 100.50
  }'
```

Guardar el `paymentId` retornado.

### Paso 4: Listar Pagos
```bash
curl http://localhost:3000/payments?page=1&limit=9
```

### Paso 5: Filtrar por Reserva
```bash
curl "http://localhost:3000/payments?page=1&limit=9&reservationId=UUID_DE_LA_RESERVA"
```

### Paso 6: Obtener Detalle
```bash
curl http://localhost:3000/payments/UUID_DEL_PAGO
```

### Paso 7: Eliminar Pago
```bash
curl -X DELETE http://localhost:3000/payments/UUID_DEL_PAGO
```

Verificar que retorna 204 No Content.

### Paso 8: Intentar Obtener Pago Eliminado
```bash
curl http://localhost:3000/payments/UUID_DEL_PAGO
```

Verificar que retorna 404 Not Found.

## Casos de Error a Probar

### 1. UUID Inválido
```bash
curl -X POST http://localhost:3000/payments \
  -H "Content-Type: application/json" \
  -d '{
    "reservationId": "invalid-uuid",
    "date": "2026-06-22",
    "amount": 100.50
  }'
# Esperado: 400 Bad Request
```

### 2. Reserva No Existe
```bash
curl -X POST http://localhost:3000/payments \
  -H "Content-Type: application/json" \
  -d '{
    "reservationId": "550e8400-e29b-41d4-a716-446655440099",
    "date": "2026-06-22",
    "amount": 100.50
  }'
# Esperado: 404 Not Found
```

### 3. Monto Inválido
```bash
curl -X POST http://localhost:3000/payments \
  -H "Content-Type: application/json" \
  -d '{
    "reservationId": "UUID_DE_LA_RESERVA",
    "date": "2026-06-22",
    "amount": 0
  }'
# Esperado: 400 Bad Request
```

### 4. Fecha Inválida
```bash
curl -X POST http://localhost:3000/payments \
  -H "Content-Type: application/json" \
  -d '{
    "reservationId": "UUID_DE_LA_RESERVA",
    "date": "22-06-2026",
    "amount": 100.50
  }'
# Esperado: 400 Bad Request
```

### 5. Paginación Inválida
```bash
curl "http://localhost:3000/payments?page=0&limit=9"
# Esperado: 400 Bad Request

curl "http://localhost:3000/payments?page=1&limit=100"
# Esperado: 400 Bad Request
```

## Coverage Esperado

```
Statements   : 95%+ (lógica de negocio)
Branches     : 90%+ (manejo de errores)
Functions    : 95%+ (todos los métodos)
Lines        : 95%+ (código ejecutable)
```

## Checklist de Validación

Antes de considerar el módulo como listo para producción:

- [ ] Todos los tests unitarios pasan
- [ ] Coverage >= 90%
- [ ] E2E tests completados sin errores
- [ ] Manejo de errores en todos los casos
- [ ] Validaciones de input funcionan
- [ ] Paginación funciona correctamente
- [ ] Filtrado por reservationId funciona
- [ ] DTOs validan correctamente
- [ ] Swagger/OpenAPI documentación actualizada
- [ ] README.md actualizado

## Debugging

### Ver logs durante tests:
```bash
pnpm test -- payments --verbose
```

### Ejecutar test específico en debug:
```bash
node --inspect-brk ./node_modules/.bin/jest --testPathPattern="create-payment.use-case.spec"
```

### Verificar que el repositorio de Prisma funciona:
```bash
# En psql
SELECT * FROM payments;
```

## Próximos Pasos

Una vez validados todos los tests:
1. Integrar con frontend
2. Crear pantallas de listado y detalle
3. Agregar historial de cambios (si aplica)
4. Configurar permisos por rol
5. Agregar logs de auditoria
