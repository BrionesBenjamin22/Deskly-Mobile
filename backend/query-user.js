require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error']
});

(async () => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'ger@correo.com' },
      include: { member: true }
    });

    if (user) {
      console.log('=== USUARIO ENCONTRADO ===');
      console.log('ID:', user.id);
      console.log('Email:', user.email);
      console.log('Username:', user.username);
      console.log('Rol:', user.role);
      console.log('Activo:', user.active);
      console.log('Creado:', user.createdAt);
      console.log('Miembro:', user.member ? `Sí (${user.member.fullName})` : 'No');
    } else {
      console.log('Usuario ger@correo.com NO ENCONTRADO');
      console.log('\n=== LISTADO DE TODOS LOS USUARIOS ===');
      const allUsers = await prisma.user.findMany({
        select: { id: true, email: true, username: true, role: true, active: true }
      });
      allUsers.forEach(u => {
        console.log(`${u.email} (${u.username}) - Rol: ${u.role} - Activo: ${u.active}`);
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();
