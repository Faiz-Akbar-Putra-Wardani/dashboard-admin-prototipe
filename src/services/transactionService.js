
import Api from './api'

export default {
  async create(payload) {
    const res = await Api.post('/api/transactions', payload)
    return res.data.data
  },

  async find(uuid) {
    const res = await Api.get(`/api/transactions/${uuid}`)
    return res.data.data
  },

  async getInvoice() {
    const res = await Api.get('/api/transactions/invoice/new')
    return res.data.data
  },

  async getByInvoice(invoice) {
    const res = await Api.get(`/api/transactions/invoice/${invoice}`)
    return res.data.data
  },

  async updateStatus(uuid, status) {
    const res = await Api.patch(`/api/transactions/${uuid}/status`, {
      status,
    })
    return res.data.data
  },
}
