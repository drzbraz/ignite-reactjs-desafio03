import axios from 'axios'

export const api = axios.create({
  baseURL: 'http://localhost:3333'
})

export const getALlProducts = async () => {
  return await api.get('/products')
}
