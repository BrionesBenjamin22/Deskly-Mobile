# Deskly

Aplicación mobile para la gestión operativa de centros de coworking. El repositorio contiene una API REST en NestJS y una aplicación Expo/React Native, con PostgreSQL y Prisma como capa de persistencia.

## Estado actual del desarrollo

El proyecto se encuentra en una fase de **MVP funcional avanzado e integración de módulos**. Los flujos principales de autenticación, usuarios, escritorios, reservas, pagos y penalizaciones ya tienen implementación backend y consumo mobile. La infraestructura local con Docker Compose también está preparada.

El último bloque desarrollado incorpora la jerarquía **localidad → área de trabajo → escritorio**:

- persistencia, migración y contratos backend para localidades y áreas;
- consultas de localidades, áreas y disponibilidad por fecha y horario;
- filtros de escritorios por localidad y área;
- validación del estado activo del área y la localidad antes de reservar;
- pantalla mobile de áreas agrupadas por localidad;
- navegación desde un área disponible hacia sus escritorios;
- asignación del área al crear o editar un escritorio.

La base funcional está construida, pero el producto aún no está en fase de cierre o producción. El siguiente tramo debe completar la validación integral por roles, los historiales y la auditoría visibles, la persistencia segura de sesión, la cobertura e2e y la preparación de CI/CD.

## Módulos implementados

| Módulo | Backend | Mobile | Estado |
|---|---|---|---|
| Autenticación y perfil | Implementado | Implementado | Funcional; sesión en memoria |
| Gestión de usuarios | Implementado | Implementado | Funcional para `ADMIN` |
| Escritorios y catálogos | Implementado | Implementado | Funcional |
| Localidades y áreas | Implementado | Implementado | Último bloque integrado |
| Reservas | Implementado | Implementado | Funcional según rol |
| Pagos | Implementado | Implementado | Flujo base disponible |
| Penalizaciones | Implementado | Implementado | Flujo base disponible |
| Historial y auditoría visible | Parcial | Pendiente de completar | Cierre transversal pendiente |

## Tecnologías

- Backend: NestJS 11 y TypeScript
- Mobile: React Native 0.81 y Expo 54
- Base de datos: PostgreSQL
- ORM: Prisma 7
- Autenticación: JWT y Passport
- Documentación API: Swagger
- Pruebas backend: Jest y Supertest
- Infraestructura: Docker y Docker Compose
- Package manager principal: pnpm

## Arquitectura

El backend utiliza una arquitectura hexagonal, también conocida como ports and adapters.

La regla principal es que el dominio y los casos de uso no dependen de frameworks, base de datos ni transporte HTTP. El mobile se organiza por features con pantallas, componentes, hooks, services, tipos y validaciones. Su navegación actual es state-based y se coordina desde `mobile/App.tsx`.

Capas esperadas:

- `domain`: reglas de negocio, modelos de dominio, contratos y errores propios del negocio.
- `application`: casos de uso, DTOs internos y puertos que necesita la aplicacion.
- `infrastructure`: adaptadores tecnicos como Prisma, persistencia, configuracion, integraciones externas y servicios concretos.
- `interfaces`: entrada y salida hacia usuarios o sistemas externos, por ejemplo controladores HTTP.
- `common`: utilidades transversales acotadas.
- `config`: carga y validacion de variables de entorno.

## Estructura

```text
Deskly-Mobile/
  backend/
  mobile/
  docs/
```

## Backend

```bash
cd backend
pnpm install
cp .env.example .env
pnpm prisma:generate
pnpm start:dev
```

El backend requiere `DATABASE_URL` y `JWT_SECRET`. Incluye módulos de autenticación, usuarios, escritorios, localidades, áreas de trabajo, reservas, pagos y penalizaciones, manteniendo dominio, casos de uso, repositorios y controladores separados por responsabilidad.

## Mobile

```bash
cd mobile
pnpm install
pnpm start
```

## Desarrollo con Docker Compose

Copiar `.env.example` como `.env` en la raiz y definir una contrasena local. El
backend sigue leyendo su configuracion de `backend/.env`, pero Compose reemplaza
`DATABASE_URL` para conectarlo a PostgreSQL por la red interna.

```bash
docker compose -f docker-compose.dev.yml up --build
```

El backend queda publicado solo en `127.0.0.1:3000`. Metro/Expo publica los puertos
de desarrollo necesarios para conexiones externas. PostgreSQL no expone puertos al
host y conserva sus datos en el volumen `postgres-data`.

Antes de iniciar el backend, el servicio one-shot `migration` ejecuta
`prisma migrate deploy`. La API solo arranca cuando todas las migraciones versionadas
terminan correctamente; el contenedor no usa `db push` ni genera migraciones nuevas.

Los contenedores de aplicacion eliminan capacidades Linux, impiden escalamiento de
privilegios y usan filesystem de solo lectura con directorios temporales acotados.
Para Expo Go en un dispositivo fisico, configurar `EXPO_PUBLIC_API_URL` con la IP
LAN del equipo antes de construir e iniciar el servicio mobile.

## Convenciones de desarrollo

- Cada entidad nueva debe respetar arquitectura hexagonal.
- Los servicios de infraestructura no deben filtrarse hacia el dominio.
- Los cambios backend que agreguen endpoints deben documentar contratos, payloads y errores.
- Las pantallas home deben paginar con 9 items.
- Los historiales de cambios deben paginar con 3 items cuando exista endpoint.
- Los formularios de edicion deben enviar solo diferencias reales.
- Las validaciones previsibles deben resolverse en frontend con mensajes por campo antes de ejecutar la peticion.
- El backend debe conservar validaciones de tipo y reglas de negocio como barrera de contrato.
- Los mensajes de exito deben ser visibles, concretos y seguir el estilo institucional del sistema.
- La accion de salir no debe mostrarse como boton directo en la barra inferior.
- No ejecutar commits automaticamente; al finalizar un modulo se debe proponer el mensaje de commit.

## Próximos pasos

1. Ejecutar una prueba integral del bloque de localidades, áreas, escritorios y reservas en backend y mobile.
2. Completar endpoints y vistas de historial/auditoría para las entidades que aún no los exponen.
3. Incorporar persistencia segura y restauración controlada de sesión en mobile.
4. Ampliar pruebas e2e de permisos, estados de reserva, penalizaciones y pagos.
5. Mantener sincronizados los contratos, payloads y errores de la documentación modular.
6. Preparar CI/CD, healthchecks de despliegue y configuración por ambiente.
