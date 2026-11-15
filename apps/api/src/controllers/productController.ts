import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/productService.js';
import { productQuerySchema } from '../validators/index.js';

export class ProductController {
  private service = new ProductService();

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedQuery = productQuerySchema.parse(req.query);
      const search = validatedQuery.search || validatedQuery.q;

      const result = await this.service.getProducts({
        category: validatedQuery.category,
        collection: validatedQuery.collection,
        size: validatedQuery.size,
        color: validatedQuery.color,
        fit: validatedQuery.fit,
        minPrice: validatedQuery.minPrice,
        maxPrice: validatedQuery.maxPrice,
        inStockOnly: validatedQuery.inStockOnly,
        search,
        sort: validatedQuery.sort,
        page: validatedQuery.page,
        limit: validatedQuery.limit
      });

      res.status(200).json({
        data: result.products,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const product = await this.service.getProductById(id);

      if (!product) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: `Product with ID "${id}" was not found.`
          }
        });
        return;
      }

      res.status(200).json({
        data: product
      });
    } catch (error) {
      next(error);
    }
  };

  getCategories = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categories = await this.service.getCategories();
      res.status(200).json({
        data: categories
      });
    } catch (error) {
      next(error);
    }
  };

  getCollections = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const collections = await this.service.getCollections();
      res.status(200).json({
        data: collections
      });
    } catch (error) {
      next(error);
    }
  };

  getRecommendations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.customerUser?.userId;
      const recommendations = await this.service.getRecommendations(userId);
      res.status(200).json({
        data: recommendations
      });
    } catch (error) {
      next(error);
    }
  };
}
