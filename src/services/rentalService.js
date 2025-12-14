// services/rentalService.js
import Api from './api'

export default {
  async getInvoice() {
    const res = await Api.get('/api/rentals/invoice/new')
    return res.data.data
  },
  async create(payload) {
    const res = await Api.post('/api/rentals', payload)
    return res.data.data
  },

  async find(uuid) {
    const res = await Api.get(`/api/rentals/${uuid}`)
    return res.data.data
  },
  async getByInvoice(invoice) {
    const res = await Api.get(`/api/rentals/invoice/${invoice}`)
    return res.data.data
  },
  async update(uuid, payload) {
    const res = await Api.put(`/api/rentals/${uuid}`, payload)
    return res.data.data
  },

  async updateStatus(uuid, status) {
    const res = await Api.patch(`/api/rentals/${uuid}/status`, { status })
    return res.data.data
  },
  async delete(uuid) {
    return Api.delete(`/api/rentals/${uuid}`)
  },
}
