import { createContext, ReactNode, useContext, useState } from 'react'
import { toast } from 'react-toastify'
import { api } from '../services/api'
import { Product, Stock } from '../types'

interface CartProviderProps {
  children: ReactNode
}

interface UpdateProductAmount {
  productId: number
  amount: number
}

interface CartContextData {
  cart: Product[]
  addProduct: (productId: number) => Promise<void>
  removeProduct: (productId: number) => void
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void
}

const CartContext = createContext<CartContextData>({} as CartContextData)

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@Rocketshoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart)
    }

    return []
  })

  const addProduct = async (productId: number) => {
    try {
      const responseAmount = await api.get(`/stock/${productId}`)
      const productAmount = responseAmount.data

      const responseProduct = await api.get(`/products/${productId}`)
      const product = responseProduct.data

      const productFound = cart.find((product: Product) => product.id === productId)

      if (!productFound) {
        product.amount = 1
        setCart([...cart, product])
        localStorage.setItem('@Rocketshoes:cart', JSON.stringify(cart))
      } else {
        if (productFound.amount + 1 > productAmount.amount) {
          toast.error('Quantidade solicitada fora de estoque')
          return
        }
        productFound.amount = productFound.amount + 1
        const withoutProductId = cart.filter((product: Product) => product.id !== productFound.id)
        const newArray = withoutProductId ? [...withoutProductId, productFound] : [productFound]
        setCart(newArray)
        localStorage.setItem('@Rocketshoes:cart', JSON.stringify(newArray))
      }
    } catch {
      toast.error('Erro na adição do produto')
    }
  }

  const removeProduct = (productId: number) => {
    try {
      const productFound = cart.find((product: Product) => product.id === productId)

      if (productFound) {
        const withoutProductId = cart.filter((product: Product) => product.id !== productFound.id)
        const newArray = withoutProductId ? withoutProductId : []
        setCart(newArray)
        localStorage.setItem('@Rocketshoes:cart', JSON.stringify(newArray))
      }
    } catch {
      toast.error('Erro na remoção do produto')
    }
  }

  const updateProductAmount = async ({ productId, amount }: UpdateProductAmount) => {
    try {
      const productFound = cart.find((product: Product) => product.id === productId)
      const responseAmount = await api.get(`/stock/${productId}`)
      const productAmount = responseAmount.data

      if (productFound) {
        if (productFound.amount > productAmount.amount) {
          toast.error('Quantidade solicitada fora de estoque')
          return
        }
        productFound.amount = amount
        const withoutProductId = cart.filter((product: Product) => product.id !== productFound.id)
        const newArray = withoutProductId ? [...withoutProductId, productFound] : [productFound]
        setCart(newArray)
        localStorage.setItem('@Rocketshoes:cart', JSON.stringify(newArray))
      }
    } catch {
      toast.error('Erro na atualização do produto')
    }
  }

  return (
    <CartContext.Provider value={{ cart, addProduct, removeProduct, updateProductAmount }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextData {
  const context = useContext(CartContext)

  return context
}
