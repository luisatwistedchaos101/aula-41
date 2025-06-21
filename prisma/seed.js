const  { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.usuario.create({
    data: {
      nome: "admin",
      email: "admin@prismatreinamentos.com",
      senha: "123456",
      cpf: "12345678910",
      role: "admin"
    }
  });
}

main().finally(() => prisma.$disconnect());
