
import Api from './api'
import { mapProduct } from '@/utils/mapper'

export default {
  async all() {
    const res = await Api.get('/api/products-all')
    return res.data.data.map(mapProduct)
  },

  async find(uuid) {
    const res = await Api.get(`/api/products/${uuid}`)
    return mapProduct(res.data.data)
  },
}
