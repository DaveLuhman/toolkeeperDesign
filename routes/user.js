import { Router as expressRouter } from 'express';
import { isManager } from '../middleware/auth.js';
import { createUser, getUsers, updateUser, verifySelf, resetPassword, disableUser } from '../middleware/user.js';

const router = expressRouter();

router.get('/profile', verifySelf, (_req, res) => { res.render('profile', {layout: 'user.hbs'}) })  // show user their own profile
router.post('/resetPassword', verifySelf, resetPassword, (_req, res) => { res.render('profile', {layout: 'user.hbs'}) }) // update user's own password

router.get('/userManagement', isManager, getUsers, (_req, res) => { res.render('userManagement', {layout: 'user.hbs'}) })
router.post('/userManagement/createUser', isManager, createUser, (_req, res) => { res.render('userManagement', {layout: 'user.hbs'}) })

router.get('/userManagement/:id', isManager, getUsers, (_req, res) => { res.render('editUser', {layout: 'user.hbs'}) }) // verify user is manager and show user to edit
router.post('/userManagement/:id', isManager, updateUser, (_req, res) => { res.render('userManagement', {layout: 'user.hbs'}) })
router.post('/userManagement/resetPW/:id', isManager, resetPassword, (_req, res) => { res.render('userManagement', {layout: 'user.hbs'}) })
router.post('/userManagement/disableUser/:id', isManager, disableUser, (_req, res) => { res.render('userManagement', {layout: 'user.hbs'}) })
router.get('/:id', verifySelf, getUsers, (_req, res) => { res.render('profile', {layout: 'user.hbs'}) })  //show user their own profile
router.post('/:id', verifySelf, updateUser, getUsers, (_req, res) => { res.render('profile', {layout: 'user.hbs'}) }) // update user's own profile

export default router