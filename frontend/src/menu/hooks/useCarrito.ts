import { useState, useEffect } from 'react'
import type { Producto } from './useMenu'

export type Modalidad = 'cocinada' | 'congelada'

export interface ItemCarrito {
  productoId: number
  categoriaId: number
  nombre: string
  precio: number
  cantidad: number
  modalidad: Modalidad
}

const CART_STORAGE_KEY = 'empanadas_carrito_v3'

function esMismoItem(item: ItemCarrito, productoId: number, modalidad: Modalidad): boolean {
  return item.productoId === productoId && item.modalidad === modalidad
}

function precioPorModalidad(producto: Producto, modalidad: Modalidad): number {
  const raw = modalidad === 'congelada' ? producto.precioCongelada : producto.precio
  return raw !== null ? parseFloat(raw) : 0
}

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

  const agregar = (producto: Producto, modalidad: Modalidad) => {
    const precio = precioPorModalidad(producto, modalidad)
    setItems((prev) => {
      const existing = prev.find((i) => esMismoItem(i, producto.id, modalidad))
      if (existing) return prev.map((i) => esMismoItem(i, producto.id, modalidad) ? { ...i, cantidad: i.cantidad + 1 } : i)
      return [...prev, { productoId: producto.id, categoriaId: producto.categoriaId, nombre: producto.nombre, precio, cantidad: 1, modalidad }]
    })
  }

  const incrementar = (productoId: number, modalidad: Modalidad) => {
    setItems((prev) => prev.map((i) => esMismoItem(i, productoId, modalidad) ? { ...i, cantidad: i.cantidad + 1 } : i))
  }

  const decrementar = (productoId: number, modalidad: Modalidad) => {
    setItems((prev) => {
      const updated = prev.map((i) => esMismoItem(i, productoId, modalidad) ? { ...i, cantidad: i.cantidad - 1 } : i)
      return updated.filter((i) => i.cantidad > 0)
    })
  }

  const eliminar = (productoId: number, modalidad: Modalidad) => {
    setItems((prev) => prev.filter((i) => !esMismoItem(i, productoId, modalidad)))
  }

  const vaciar = () => setItems([])

  const subtotal = items.reduce((sum, i) => sum + i.precio * i.cantidad, 0)
  const cantidadTotal = items.reduce((sum, i) => sum + i.cantidad, 0)

  return { items, agregar, incrementar, decrementar, eliminar, vaciar, subtotal, cantidadTotal }
}
