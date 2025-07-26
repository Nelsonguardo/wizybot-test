export interface Product {
  name: string;         // Título o nombre del producto
  price?: string;       // Precio
  url?: string;         // URL del producto
  image?: string;       // URL de la imagen
  type?: string;        // Tipo de producto
  discount?: string;    // Descuento
  variants?: string;    // Variantes
  created?: string;     // Fecha de creación
}
