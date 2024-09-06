/* eslint-disable eqeqeq */ // for the material name search
import { Material } from '../models/index.models.js'

/**
 * Retrieves all materials.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
const getMaterials = async (req, res, next) => {
  try {
    const materials = await Material.find({tenant: { $eq: req.user.tenant.valueOf() }})
    res.locals.materials = materials
    return next()
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
/**
 * Retrieves a material by ID.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
const getMaterialByID = async (req, res, next) => {
  const { id } = req.params
  try {
    const material = await Material.findById({ $eq: id })
    res.locals.materials = [material]
    return next()
  } catch (error) {
    res.status(500).json({ message: error.message })
    next()
  }
}

/**
 * Creates a new material.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
const createMaterial = async (req, res, next) => {
  const material = req.body
  material.tenant = req.user.tenant.valueOf()
  const newMaterial = new Material(material)
  try {
    await newMaterial.save()
    return next()
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

/**
 * Deletes a material.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
const deleteMaterial = async (req, res, next) => {
  const { id } = req.params
  try {
    await Material.findByIdAndRemove({ $eq: id })
    return next()
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

/**
 * Updates a material.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
const updateMaterial = async (req, res, next) => {
  const { id, name, description } = req.body
  try {
    const updatedMaterial = await Material.findByIdAndUpdate(
      { $eq: id },
      { name, description },
      { new: true }
    )
    res.locals.updatedMaterial = updatedMaterial
    return next()
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
/**
 * Retrieves a list of material names.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
const listMaterialNames = async (_eq, res, next) => {
  res.locals.materials = await Material.find({tenant: { $eq: req.user.tenant.valueOf() }}, { name: 1, id: 1 })
  return next()
}

// write a handlebars helper to lookup the material name based on the id
// https://stackoverflow.com/questions/28223460/handlebars-js-lookup-value-in-array-of-objects
const getMaterialName = (materials, id) => {
  try {
    const material = materials.filter((item) => {
      return item._id === id
    })
    return material[0].name
  } catch (error) {
    return 'Reference Error'
  }
}

export {
  getMaterials,
  getMaterialByID,
  createMaterial,
  deleteMaterial,
  updateMaterial,
  listMaterialNames,
  getMaterialName
}
