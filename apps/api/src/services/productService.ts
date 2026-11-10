import { ProductRepository, Product } from '../repositories/productRepository.js';

export class ProductService {
  private repo = new ProductRepository();

  async getProducts(params: {
    category?: string;
    search?: string;
    page: number;
    limit: number;
  }): Promise<{ products: Product[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const offset = (params.page - 1) * params.limit;
    const { products, total } = await this.repo.findAll({
      category: params.category,
      search: params.search,
      offset,
      limit: params.limit
    });

    return {
      products,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit)
      }
    };
  }

  async getProductById(id: string): Promise<Product | null> {
    return await this.repo.findById(id);
  }
}
