import * as fs from 'fs';
import * as csv from 'csv-parser';
import { Product } from '../interfaces/product.interface';

export async function searchProductsCSV(query: string): Promise<Product[]> {
  const results: Product[] = [];

  return new Promise((resolve) => {
    fs.createReadStream('products_simple.csv') //
      .pipe(csv())
      .on('data', (data) => {
        // buscamos coincidencia en el nombre
        if (data.name && data.name.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            name: data.name,          // Título
            price: data.price,        // Precio
            url: data.url,            // Enlace
            image: data.imageUrl      // Imagen
            // type, discount, variants, created quedan sin llenar
          });
        }
      })
      .on('end', () => {
        resolve(results.slice(0, 2)); // devolvemos máximo 2 resultados
      });
  });
}
