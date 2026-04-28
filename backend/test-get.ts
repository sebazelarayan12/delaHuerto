import { CategoriasService } from './src/services/categorias.service.js'
import { prisma } from './src/db.js'

async function run() {
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/empanadas?schema=public'
  process.env.JWT_SECRET = 'secret'
  process.env.ADMIN_USERNAME = 'admin'
  process.env.ADMIN_PASSWORD = 'password'
  process.env.CLOUDINARY_CLOUD_NAME = 'cloud'
  process.env.CLOUDINARY_API_KEY = 'key'
  process.env.CLOUDINARY_API_SECRET = 'secret'
  process.env.ALLOWED_ORIGIN = 'http://localhost:5173'

  try {
    const adminCats = await CategoriasService.getAdminCategories()
    console.log("Admin:", JSON.stringify(adminCats, null, 2))
    
    const publicCats = await CategoriasService.getPublicCategories()
    console.log("Public:", JSON.stringify(publicCats, null, 2))
  } catch (err) {
    console.error("ERROR", err)
  } finally {
    await prisma.$disconnect()
  }
}
run()
