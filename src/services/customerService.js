
import Api from './api'
import { mapCustomer } from '@/utils/mapper'

export default {
  async all() {
    const res = await Api.get('/api/customers-all')
    return res.data.data.map(mapCustomer)
  },

  async find(uuid) {
    const res = await Api.get(`/api/customers/${uuid}`)
    return mapCustomer(res.data.data)
  },
}
