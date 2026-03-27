function buildSafeUser(user) {
  return {
    id: user.user_id,
    name: user.full_name,
    full_name: user.full_name,
    email: user.email,
    role_code: "admin",
    role_name: "Administrador",
    permissions: {
      canCreate: true,
      canUpdate: true,
      canDelete: true,
      canExport: true,
      canManageTriggers: true,
    },
  };
}

module.exports = {
  buildSafeUser,
};
