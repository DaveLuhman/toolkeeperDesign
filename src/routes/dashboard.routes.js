import { generatePrinterFriendlyToolList, getActiveTools } from '../middleware/tool.js'
import { Router } from 'express'
export const dashboardRouter = Router()
dashboardRouter.get('/', getActiveTools, generatePrinterFriendlyToolList, (_req, res) => {
  res.render('dashboard')
})
