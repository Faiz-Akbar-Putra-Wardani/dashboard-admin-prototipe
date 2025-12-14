// services/api.js
import axios from 'axios'
import Cookies from 'js-cookie'

const Api = axios.create({
  baseURL: import.meta.env.VITE_APP_BASEURL 
})

// REQUEST INTERCEPTOR - Auto attach token
Api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token')
    
    if (token) {
      config.headers.Authorization = token
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// RESPONSE INTERCEPTOR - Handle 401
Api.interceptors.response.use(
  function (response) {
    return response
  },
  (error) => {
    if (401 === error.response?.status) {
      Cookies.remove('token')
      Cookies.remove('user')
      Cookies.remove('permissions')
      window.location = '/'
    } else {
      return Promise.reject(error)
    }
  }
)

export default Api
