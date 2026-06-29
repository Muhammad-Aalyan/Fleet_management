import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3003/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fleet_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('fleet_token')
      localStorage.removeItem('fleet_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
