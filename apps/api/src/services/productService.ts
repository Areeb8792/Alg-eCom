import {
  ProductRepository,
  Product,
  Category,
  Collection,
  ProductQueryParams
} from '../repositories/productRepository.js';
import { CustomerUserRepository } from '../repositories/customerUserRepository.js';

export class ProductService {
  private repo = new ProductRepository();
  private userRepo = new CustomerUserRepository();

  async getProducts(params: {
    category?: string;
    collection?: string;
    size?: string;
    color?: string;
    fit?: string;
    minPrice?: number;
    maxPrice?: number;
    inStockOnly?: boolean;
    search?: string;
    sort?: 'newest' | 'price_asc' | 'price_desc' | 'popularity' | 'rating';
    page: number;
    limit: number;
  }): Promise<{ products: Product[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const offset = (params.page - 1) * params.limit;
    const queryParams: ProductQueryParams = {
      category: params.category,
      collection: params.collection,
      size: params.size,
      color: params.color,
      fit: params.fit,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      inStockOnly: params.inStockOnly,
      search: params.search,
      sort: params.sort,
      offset,
      limit: params.limit
    };

    const { products, total } = await this.repo.findAll(queryParams);

    return {
      products,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / params.limit))
      }
    };
  }

  async getProductById(id: string): Promise<Product | null> {
    return await this.repo.findById(id);
  }

  async getCategories(): Promise<Category[]> {
    return await this.repo.getCategories();
  }

  async getCollections(): Promise<Collection[]> {
    return await this.repo.getCollections();
  }

  async getRecommendations(userId?: string): Promise<Product[]> {
    let preferences: {
      favorite_categories?: string[];
      preferred_styles?: string[];
      preferred_fits?: string[];
      preferred_sizes?: string[];
      preferred_colors?: string[];
      price_range_min_cents?: number;
      price_range_max_cents?: number;
    } | undefined;

    if (userId) {
      try {
        const userPrefs = await this.userRepo.getPreferences(userId);
        if (userPrefs) {
          preferences = {
            favorite_categories: userPrefs.favorite_categories,
            preferred_styles: userPrefs.preferred_styles,
            preferred_fits: userPrefs.preferred_fits,
            preferred_sizes: userPrefs.preferred_sizes,
            preferred_colors: userPrefs.preferred_colors,
            price_range_min_cents: userPrefs.price_range_min_cents,
            price_range_max_cents: userPrefs.price_range_max_cents
          };
        }
      } catch {
        // Fall back to general recommendations if preference lookup fails
      }
    }

    return await this.repo.getRecommendations(preferences);
  }
}
