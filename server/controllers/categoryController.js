import Category from '../models/Category.js';
import { sendSuccess } from '../utils/apiResponse.js';

class CategoryController {
  /**
   * Get all categories
   */
  static async getAll(req, res, next) {
    try {
      const categories = await Category.findAll();
      return sendSuccess(res, 'Categories retrieved successfully', categories);
    } catch (error) {
      next(error);
    }
  }
}

export default CategoryController;
