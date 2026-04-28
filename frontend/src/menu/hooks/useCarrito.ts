import { useState, useEffect } from 'react'
import type { Producto } from './useMenu'

export interface ItemCarrito {
  productoId: number
  categoriaId: number
  nombre: string
  precio: number
  cantidad: number
}

const CART_STORAGE_KEY = 'empanadas_carrito_v2'

export function useCarrito() {
  const [items, setItems] = useState<ItemCarrito[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const agregar = (producto: Producto) => {
    const precio = parseFloat(producto.precio)
    setItems((prev) => {
      const existing = prev.find((i) => i.productoId === producto.id)
      if (existing) return prev.map((i) => i.productoId === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i)
      return [...prev, { productoId: producto.id, categoriaId: producto.categoriaId, nombre: producto.nombre, precio, cantidad: 1 }]
    })
  }

  const incrementar = (productoId: number) => {
    setItems((prev) => prev.map((i) => i.productoId === productoId ? { ...i, cantidad: i.cantidad + 1 } : i))
  }

  const decrementar = (productoId: number) => {
    setItems((prev) => {
      const updated = prev.map((i) => i.productoId === productoId ? { ...i, cantidad: i.cantidad - 1 } : i)
      return updated.filter((i) => i.cantidad > 0)
    })
  }

  const eliminar = (productoId: number) => {
    setItems((prev) => prev.filter((i) => i.productoId !== productoId))
  }

  const vaciar = () => setItems([])

  const subtotal = items.reduce((sum, i) => sum + i.precio * i.cantidad, 0)
  const cantidadTotal = items.reduce((sum, i) => sum + i.cantidad, 0)

  return { items, agregar, incrementar, decrementar, eliminar, vaciar, subtotal, cantidadTotal }
}
