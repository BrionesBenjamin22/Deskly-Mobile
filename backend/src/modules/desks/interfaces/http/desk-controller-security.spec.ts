import { GUARDS_METADATA } from '@nestjs/common/constants';

import { ROLES_KEY } from '../../../auth/interfaces/http/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../auth/interfaces/http/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/interfaces/http/guards/roles.guard';
import { DeskCatalogController } from './desk-catalog.controller';
import { DesksController } from './desks.controller';
import { LocalitiesController } from './localities.controller';
import { WorkAreasController } from './work-areas.controller';

function expectProtected(
  prototype: Record<string, (...args: never[]) => unknown>,
  methodName: string,
  roles = ['ADMIN', 'GESTOR'],
) {
  const handler = prototype[methodName];

  expect(Reflect.getMetadata(ROLES_KEY, handler) as unknown).toEqual(roles);
  expect(Reflect.getMetadata(GUARDS_METADATA, handler) as unknown).toEqual([
    JwtAuthGuard,
    RolesGuard,
  ]);
}

describe('Desk administration endpoint security', () => {
  const deskController = DesksController.prototype as unknown as Record<
    string,
    (...args: never[]) => unknown
  >;
  const catalogController =
    DeskCatalogController.prototype as unknown as Record<
      string,
      (...args: never[]) => unknown
    >;
  const localitiesController =
    LocalitiesController.prototype as unknown as Record<
      string,
      (...args: never[]) => unknown
    >;
  const workAreasController =
    WorkAreasController.prototype as unknown as Record<
      string,
      (...args: never[]) => unknown
    >;

  it.each(['create', 'update', 'delete'])(
    'protege DesksController.%s',
    (methodName) => {
      expectProtected(deskController, methodName);
    },
  );

  it.each([
    'createDescription',
    'updateDescription',
    'deleteDescription',
    'createAmenity',
    'updateAmenity',
    'deleteAmenity',
  ])('protege DeskCatalogController.%s', (methodName) => {
    expectProtected(catalogController, methodName);
  });

  it.each(['create', 'update', 'remove'])(
    'protege LocalitiesController.%s',
    (methodName) => expectProtected(localitiesController, methodName),
  );

  it.each(['create', 'update', 'remove'])(
    'protege WorkAreasController.%s',
    (methodName) => expectProtected(workAreasController, methodName),
  );
});
