import { seedDatabase } from './seed'

seedDatabase().then(() => {
  console.log('Done')
  process.exit(0)
}).catch(console.error)