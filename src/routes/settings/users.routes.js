import { Router } from 'express'
import {
  getUsers,
  updateUser,
  resetPassword,
  disableUser,
  getUserByID,
  deleteUser,
  createUserInTenant
} from '../../middleware/user.js'
import { sanitizeReqBody } from '../../middleware/util.js'
import { renderSettingsEditUser, renderSettingsUsers } from '../../controllers/settings/user.js'
import { hoistOnboarding, usersOnboardingComplete } from '../../middleware/onboarding.js'
export const userSettingsRouter = Router()

// @desc get all users and render settings page
// @endpoint GET /settings/users
userSettingsRouter.get('/', hoistOnboarding, getUsers, renderSettingsUsers)

// @desc reset another user's password
// @endpoint POST /settings/users/resetPW/:id
userSettingsRouter.post('/resetPW/:id', resetPassword, renderSettingsUsers)

// @desc disable user
// @endpoint POST /settings/users/disableUser/:id
userSettingsRouter.post('/disableUser/:id', disableUser, getUsers, renderSettingsUsers)

// @desc delete user
// @endpoint GET /settings/users/:id/delete
userSettingsRouter.get("/:id/delete", deleteUser, getUsers, renderSettingsUsers);

// @desc create new user
// @endpoint POST /settings/users/create
userSettingsRouter.post('/create', sanitizeReqBody, createUserInTenant, getUsers, renderSettingsUsers)
// @route * /settings/users/onboarding-complete
// @endpoint POST /settings/users/onboarding-complete
userSettingsRouter.post('/onboarding-complete', usersOnboardingComplete)

// @desc get user by ID and render edit page
// @endpoint GET /settings/users/:id
userSettingsRouter.get('/:id', getUserByID, renderSettingsEditUser)

// @desc update user and redirect to settings page
// @endpoint POST /settings/users/:id
userSettingsRouter.post('/:id', sanitizeReqBody, updateUser, getUsers, renderSettingsUsers)

// src\routes\settings\users.routes.js
