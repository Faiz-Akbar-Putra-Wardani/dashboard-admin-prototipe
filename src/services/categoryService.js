// services/categoryService.js
import Api from './api'
import { mapCategory } from '@/utils/mapper'

export default {
  async all() {
    const res = await Api.get('/api/categories-all')
    return ['Semua', ...res.data.data.map(mapCategory)]
  },
}
