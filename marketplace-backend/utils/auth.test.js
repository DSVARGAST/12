const { buildSafeUser } = require('./auth');

describe('buildSafeUser', () => {
  test('convierte un usuario de base de datos en el payload seguro del token', () => {
    expect(
      buildSafeUser({
        user_id: 7,
        email: 'admin@docedigital.test',
        full_name: 'Admin Doce',
      })
    ).toEqual({
      id: 7,
      name: 'Admin Doce',
      full_name: 'Admin Doce',
      email: 'admin@docedigital.test',
      role_code: 'admin',
      role_name: 'Administrador',
      permissions: {
        canCreate: true,
        canUpdate: true,
        canDelete: true,
        canExport: true,
        canManageTriggers: true,
      },
    });
  });
});
