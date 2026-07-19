import DashboardService from '../services/dashboardService.js';
import { sendSuccess } from '../utils/apiResponse.js';

class DashboardController {
  /**
   * Fetch aggregate data metrics and analytical figures
   */
  static async getOverview(req, res, next) {
    try {
      const data = await DashboardService.getDashboardData(req.user);
      return sendSuccess(res, 'Dashboard analytics loaded successfully', data);
    } catch (error) {
      next(error);
    }
  }
}

export default DashboardController;
