# Testing del Modulo Payments

## Estructura de Tests

Los tests están organizados en diferentes niveles:

### 1. Tests Unitarios de Use Cases

- `create-payment.use-case.spec.ts`: Valida la lógica de creación de pagos
  - Creación exitosa de pago
  - Validación de existencia de reserva
  - Persistencia correcta

- `list-payments.use-case.spec.ts`: Valida la paginación y filtrado
  - Retorno de pagos paginados
  - Cálculo correcto de totalPages
  - Filtrado por reservationId

- `get-payment-by-id.use-case.spec.ts`: Valida obtención de detalle
  - Obtención exitosa de pago
  - Manejo de pago no encontrado

- `delete-payment.use-case.spec.ts`: Valida eliminación de pagos
  - Eliminación exitosa
  - Validación de existencia antes de eliminar

### 2. Tests de Controller

- `payments.controller.spec.ts`: Valida endpoints HTTP
  - POST /payments - crear pago
  - GET /payments - listar pagos
  - GET /payments/:id - obtener detalle
  - DELETE /payments/:id - eliminar pago
  - Manejo de errores en cada endpoint

## Ejecución de Tests

### Ejecutar todos los tests del módulo:
```bash
cd backend
pnpm test -- payments
```

### Ejecutar tests con coverage:
```bash
cd backend
pnpm test -- payments --coverage
```

### Ejecutar tests en watch mode:
```bash
cd backend
pnpm test -- payments --watch
```

### Ejecutar un test específico:
```bash
cd backend
pnpm test -- create-payment.use-case.spec
```

## Escenarios Probados

### CreatePaymentUseCase
✓ Crear pago con datos válidos
✓ Falla si la reserva no existe
✓ Falla si el pago no se persiste correctamente

### ListPaymentsUseCase
✓ Retorna pagos paginados correctamente
✓ Calcula totalPages correctamente (15 items, limit 9 = 2 páginas)
✓ Filtra por reservationId cuando se proporciona

### GetPaymentByIdUseCase
✓ Retorna detalle de pago existente
✓ Lanza PaymentNotFoundError si no existe

### DeletePaymentUseCase
✓ Elimina pago existente
✓ Lanza PaymentNotFoundError si no existe

### PaymentsController
✓ POST /payments crea pago correctamente
✓ POST /payments maneja ReservationNotFoundError
✓ GET /payments retorna listado paginado
✓ GET /payments/:id retorna detalle
✓ GET /payments/:id maneja PaymentNotFoundError
✓ DELETE /payments/:id elimina pago
✓ DELETE /payments/:id maneja PaymentNotFoundError

## Cobertura Esperada

- Use Cases: 100%
- Controller: 100%
- Errores: 100%
- Mapper: 100%
- Repository: Cubierto por tests de integración

## Testing Manual con cURL

### Crear pago
```bash
curl -X POST http://localhost:3000/payments \
  -H "Content-Type: application/json" \
  -d '{
    "reservationId": "550e8400-e29b-41d4-a716-446655440001",
    "date": "2026-06-22",
    "amount": 100.50
  }'
```

### Listar pagos
```bash
curl http://localhost:3000/payments?page=1&limit=9
```

### Listar pagos de una reserva específica
```bash
curl "http://localhost:3000/payments?page=1&limit=9&reservationId=550e8400-e29b-41d4-a716-446655440001"
```

### Obtener detalle de pago
```bash
curl http://localhost:3000/payments/550e8400-e29b-41d4-a716-446655440000
```

### Eliminar pago
```bash
curl -X DELETE http://localhost:3000/payments/550e8400-e29b-41d4-a716-446655440000
```

## Datos de Prueba

Para facilitar las pruebas, se recomienda crear primero una reserva:

```bash
curl -X POST http://localhost:3000/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "deskId": "550e8400-e29b-41d4-a716-446655440001",
    "date": "2026-06-22",
    "startTime": "09:00",
    "endTime": "13:00"
  }'
```

Luego usar el `reservationId` retornado para crear pagos.

## Validaciones Testeadas

### Validaciones de Input (class-validator)
- UUID válido para reservationId
- Fecha en formato YYYY-MM-DD
- Monto > 0
- Paginación válida (page >= 1, limit entre 1 y 50)

### Validaciones de Negocio
- Reserva debe existir
- Pago debe ser persistido correctamente
- Pago debe existir antes de deletar
