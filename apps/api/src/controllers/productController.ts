import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/productService.js';
import { productQuerySchema } from '../validators/index.js';

export class ProductController {
  private service = new ProductService();

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedQuery = productQuerySchema.parse(req.query);
      const result = await this.service.getProducts({
        category: validatedQuery.category,
        search: validatedQuery.search,
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
}
