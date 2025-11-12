// hash.js
const bcrypt = require('bcryptjs');

(async () => {
  // 🔹 Escribe la contraseña en texto plano que quieres convertir a hash
  const password = 'editor123';

  // 🔹 Genera el hash con 10 rondas (nivel de seguridad estándar)
  const hash = await bcrypt.hash(password, 10);

  // 🔹 Muestra el resultado en consola
  console.log('✅ Hash generado para', password, ':');
  console.log(hash);
})();
