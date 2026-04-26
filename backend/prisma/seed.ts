import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.producto.deleteMany()
  await prisma.categoria.deleteMany()

  const fritas = await prisma.categoria.create({
    data: { nombre: 'Empanadas Fritas', orden: 1 },
  })
  const horno = await prisma.categoria.create({
    data: { nombre: 'Empanadas al Horno', orden: 2 },
  })
  const tartas = await prisma.categoria.create({
    data: { nombre: 'Tartas', orden: 3 },
  })

  await prisma.producto.createMany({
    data: [
      {
        categoriaId: fritas.id,
        nombre: 'Carne cortada a cuchillo',
        descripcion: 'Relleno de carne vacuna, aceitunas, huevo y especias de la abuela',
        precio: 5500,
        orden: 1,
      },
      {
        categoriaId: fritas.id,
        nombre: 'Pollo y verdura',
        descripcion: 'Pechuga de pollo desmenuzada con morrón, cebolla y pimentón ahumado',
        precio: 5200,
        orden: 2,
      },
      {
        categoriaId: fritas.id,
        nombre: 'Jamón y queso',
        descripcion: 'Clásico infalible con jamón cocido y queso cremoso fundido',
        precio: 4800,
        orden: 3,
      },
      {
        categoriaId: horno.id,
        nombre: 'Carne con papa',
        descripcion: 'Carne picada, papa en cubos y mucho sabor casero',
        precio: 5200,
        orden: 1,
      },
      {
        categoriaId: horno.id,
        nombre: 'Caprese',
        descripcion: 'Tomate fresco, mozzarella y albahaca, al estilo de siempre',
        precio: 4800,
        orden: 2,
      },
      {
        categoriaId: horno.id,
        nombre: 'Roquefort y nuez',
        descripcion: 'Una combinación audaz para los que buscan algo distinto',
        precio: 5800,
        orden: 3,
      },
      {
        categoriaId: tartas.id,
        nombre: 'Tarta de verdura',
        descripcion: 'Espinaca, acelga, ricota y especias en masa casera crocante',
        precio: 3500,
        orden: 1,
      },
      {
        categoriaId: tartas.id,
        nombre: 'Tarta de jamón y queso',
        descripcion: 'Jamón cocido, queso cremoso y huevo, el clásico de siempre',
        precio: 3200,
        orden: 2,
      },
      {
        categoriaId: tartas.id,
        nombre: 'Tarta de pollo',
        descripcion: 'Pechuga desmenuzada, morrones asados y crema suave',
        precio: 3800,
        orden: 3,
      },
    ],
  })

  console.log('✅ Seed completado')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
