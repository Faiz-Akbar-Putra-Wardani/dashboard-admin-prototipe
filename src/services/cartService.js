// services/cartService.js
import Api from './api'
import { mapCart } from '@/utils/mapper'

export default {
  async all() {
    const res = await Api.get('/api/carts')
    return res.data.data.map(mapCart)
  },

  async add(payload) {
    const res = await Api.post('/api/carts', payload)
    return mapCart(res.data.data)
  },

  async update(id, payload) {
    const res = await Api.put(`/api/carts/${id}`, payload)
    return mapCart(res.data.data)
  },

  async delete(id) {
    return Api.delete(`/api/carts/${id}`)
  },
}
