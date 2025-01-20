import { renderDashboard } from '../controllers/tool.js'
import { generatePrinterFriendlyToolList, getRecentlyUpdatedTools } from '../middleware/tool.js'
import {initCachedContent} from '../middleware/util.js'
import { hoistOnboarding, dashboardOnboardingComplete, skipStep } from '../middleware/onboarding.js'
import { Router } from 'express'

export const dashboardRouter = Router()

// @desc    Show dashboard
// @route   GET /dashboard
dashboardRouter.get(
  '/',
  initCachedContent,
  getRecentlyUpdatedTools,
  generatePrinterFriendlyToolList,
  hoistOnboarding,
  renderDashboard
)

// @desc    Get cached data
// @route   GET /dashboard/cache
dashboardRouter.get("/cache", initCachedContent, (req, res) => {
    res.json(res.locals.cachedContent);
});

dashboardRouter.get('/skip-step/:step', skipStep, renderDashboard)
dashboardRouter.post('/onboarding-complete', dashboardOnboardingComplete)
// src\routes\dashboard.routes.js
