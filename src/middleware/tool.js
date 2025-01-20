import { Tool, ServiceAssignment } from "../models/index.models.js";
import { deduplicateArray, mutateToArray } from "./util.js";
import { returnUniqueIdentifier } from "../helpers/index.js";
import sortArray from "sort-array";
import { findServiceAssignmentByJobNumber } from "./serviceAssignment.js";

/**
 * @name getAllTools
 * @returns {array}
 * @description This function will return all tools in the database along with pagination data
 */
const getAllTools = async (req, res, next) => {
	const { sortField, sortOrder } = req.user.preferences;
	const tenantId = req.user.tenant.valueOf();
	try {
		const tools = await Tool.find({ tenant: tenantId }).sort({
			[sortField]: sortOrder || 1,
		});

		res.locals.tools = tools;
		return next();
	} catch (err) {
		req.logger.error({
			message: "Failed to fetch tools",
			metadata: {
				tenantId,
				userId: req.user._id,
				sortField,
				sortOrder,
			},
			error: err.message,
		});
		return next(err);
	}
};

/**
 * Middleware to get all active tools in the database for the current tenant.
 */
const getActiveTools = async (req, res, next) => {
	const { sortField, sortOrder } = req.user.preferences;
	const tenantId = req.user.tenant.valueOf();

	try {
		const tools = await Tool.find()
			.where("archived")
			.equals(false)
			.where("tenant")
			.equals(tenantId)
			.sort({ [sortField]: sortOrder || 1 });

		res.locals.tools = tools.filter((tool) => tool.serviceAssignment?.active);
		console.log(
			`Count of active tools for tenant ${tenantId}: ${res.locals.tools.length}`,
		);
		return next();
	} catch (err) {
		req.logger.error({
			message: "Failed to fetch active tools",
			metadata: {
				tenantId,
				userId: req.user._id,
				sortField,
				sortOrder,
			},
			error: err.message,
		});
		return next(err);
	}
};

/**
 * Middleware to get a tool by its ID and return it in the response.
 */
const getToolByID = async (req, res, next) => {
	const { id } = req.params;
	const tenantId = req.user.tenant.valueOf();

	try {
		req.logger.info(`[MW] searching for tool by ID: ${id}`);
		const tool = await Tool.findOne({ _id: id, tenant: tenantId });

		if (!tool) {
			throw new Error(`Tool with ID ${id} not found for tenant ${tenantId}`);
		}

		res.locals.tools = [tool];
		res.locals.toolHistory = sortArray(tool.history, {
			by: "updatedAt",
			order: "desc",
		});
		return next();
	} catch (err) {
		req.logger.error({
			message: "Failed to fetch tool by ID",
			metadata: {
				tenantId,
				userId: req.user._id,
				toolId: id,
			},
			error: err.message,
		});
		return next(err);
	}
};
const getCheckedInTools = async (tenant) => {
	try {
		return await Tool.find()
			.where("serviceAssignment.type")
			.equals("Stockroom")
			.where("tenant")
			.equals(tenant)
			.where("archived")
			.equals(false);
	} catch (err) {
		req.logger.error({
			message: "Failed to fetch checked-in tools",
			metadata: { tenantId: tenant },
			error: err.message,
		});
	}
};
const getCheckedOutTools = async (tenant) => {
	try {
		return await Tool.find()
			.where("serviceAssignment.type")
			.ne("stockroom")
			.where("tenant")
			.equals(tenant)
			.where("archived")
			.equals(false);
	} catch (err) {
		req.logger.error({
			message: "Failed to fetch checked-out tools",
			metadata: { tenantId: tenant },
			error: err.message,
		});
	}
};
/**
 * Middleware to search tools based on user input.
 */
const searchTools = async (req, res, next) => {
	const { sortField, sortOrder } = req.user.preferences;
	const { searchBy, searchTerm } = req.body;

	try {
		if (!searchBy || searchBy === "Search By") {
			res.locals.message = "You must specify search parameters";
			return next();
		}

		res.locals.searchBy = searchBy;
		res.locals.searchTerm = searchTerm;

		switch (searchBy) {
			case "serviceAssignment":
				res.locals.tools = await Tool.find({
					serviceAssignment: searchTerm,
					tenant: req.user.tenant.valueOf(),
					archived: false
				}).sort({ [sortField]: sortOrder || 1 });
				break;

			case "category":
				res.locals.tools = await Tool.find({
					category: searchTerm,
					tenant: req.user.tenant.valueOf(),
					archived: false
				}).sort({ [sortField]: sortOrder || 1 });
				break;

			case "status":
				if (searchTerm === "Checked In") {
					res.locals.tools = await getCheckedInTools(req.user.tenant.valueOf());
				} else {
					res.locals.tools = await getCheckedOutTools(
						req.user.tenant.valueOf(),
					);
				}
				break;

			default:
				res.locals.tools = await Tool.find({
					[searchBy]: searchTerm,
					tenant: req.user.tenant.valueOf(),
				}).sort({ [sortField]: sortOrder || 1 });
				break;
		}

		res.locals.totalFound = res.locals.tools.length;
		return next();
	} catch (err) {
		req.logger.error({
			message: "Search tools failed",
			metadata: {
				tenantId: req.user.tenant.valueOf(),
				searchBy,
				searchTerm,
			},
			error: err.message,
		});

		return next(err);
	}
};

/**
 * Middleware to create a new tool for the current tenant.
 */
const createTool = async (req, res, next) => {
	try {
		const {
			serialNumber,
			modelNumber,
			barcode,
			description,
			toolID,
			serviceAssignment,
			category,
			manufacturer,
			width,
			height,
			length,
			weight,
		} = req.body;

		const tenant = req.user.tenant.valueOf();

		if (!(serialNumber || toolID) || !barcode) {
			throw new Error("Missing required fields");
		}

		// Build query conditions for duplicate checking
		const queryConditions = [];
		if (serialNumber) {
			queryConditions.push({ serialNumber: { $eq: serialNumber }, tenant: { $eq: tenant } });
		}
		if (barcode) {
			queryConditions.push({ barcode: { $eq: barcode }, tenant: { $eq: tenant } });
		}
		if (toolID) {
			queryConditions.push({ toolID: { $eq: toolID }, tenant: { $eq: tenant } });
		}

		const existingTools = await Tool.find({ $or: queryConditions });

		if (existingTools.length > 0) {
			const errorList = existingTools.map((tool) => {
				if (tool.serialNumber === serialNumber) {
					return { field: "Serial Number", value: serialNumber, tool };
				}
				if (tool.barcode === barcode) {
					return { field: "Barcode", value: barcode, tool };
				}
				return { field: "Tool ID", value: toolID, tool };
			});

			const error = new Error("Duplicate Tool(s) Found");
			error.errorList = errorList.map((err) => ({
				cause: err.field,
				duplicateValue: err.value,
				existingTool: err.tool._id,
			}));
			throw error;
		}

		const newTool = await Tool.create({
			serialNumber,
			modelNumber,
			barcode,
			description,
			toolID,
			serviceAssignment,
			category,
			manufacturer,
			size: {
				height,
				width,
				length,
				weight,
			},
			updatedBy: req.user._id,
			createdBy: req.user._id,
			tenant,
		});

		if (!newTool) {
			throw new Error("Could not create tool");
		}

		newTool.history.push({
			updatedBy: req.user._id,
			updatedAt: newTool.createdAt,
			serviceAssignment,
			status: "Created",
			changeDescription: "Tool created",
		});

		await newTool.save();

		res.locals.message = "Successfully made a new tool";
		res.locals.tools = [newTool];
		res.locals.pagination = { pageCount: 1 };
		res.status(201);
		return next();
	} catch (error) {
		req.logger.error({
			message: "Failed to create tool",
			metadata: {
				tenantId: req.user.tenant.valueOf(),
				userId: req.user._id,
				toolDetails: req.body,
			},
			error: error.message,
		});

		res.locals.message = error.message;
		if (error.errorList) {
			res.locals.errorList = error.errorList;
		}
		return res.render("results");
	}
};

/**
 * Middleware to update a single tool by its ID.
 */
const updateTool = async (req, res, next) => {
	try {
		const {
			id,
			modelNumber,
			description,
			serviceAssignment,
			category,
			manufacturer,
			width,
			height,
			length,
			weight,
		} = req.body;

		if (!id) {
			throw new Error("Missing required fields: id");
		}

		const updatedTool = await Tool.findByIdAndUpdate(
			id,
			{
				modelNumber,
				description,
				serviceAssignment,
				category,
				manufacturer,
				size: {
					width,
					height,
					length,
					weight,
				},
				$inc: { __v: 1 },
				updatedAt: Date.now(),
			},
			{ new: true },
		);

		if (!updatedTool) {
			throw new Error("Tool not found or could not be updated");
		}
		const { jobNumber } = await ServiceAssignment.findById(serviceAssignment);
		updatedTool.history.push({
			updatedBy: req.user._id,
			serviceAssignment,
			status: updatedTool.status,
			changeDescription: `Service assignment updated to ${jobNumber}`,
		});

		await updatedTool.save();

		res.locals.tools = [updatedTool];
		res.status(200);
		next();
	} catch (error) {
		req.logger.error({
			message: "Failed to update tool",
			metadata: {
				toolId: req.body.id,
				userId: req.user._id,
				toolDetails: req.body,
			},
			error: error.message,
		});

		res.status(500).json({ message: error.message });
	}
};

/**
 * Middleware to archive a tool by its ID.
 */
const archiveTool = async (req, res, next) => {
	try {
		const { id } = req.params;

		const archivedTool = await Tool.findByIdAndUpdate(
			id,
			{ archived: true },
			{ new: true },
		);

		if (!archivedTool) {
			throw new Error(`Tool with ID ${id} not found`);
		}

		archivedTool.history.push({
			updatedBy: req.user._id,
			updatedAt: Date.now(),
			status: "Archived",
			changeDescription: "Tool archived",
		});

		await archivedTool.save();

		res.locals.message = `Successfully Archived Tool ${archivedTool.toolID}`;
		res.locals.tools = mutateToArray(archivedTool);
		res.status(201);
		next();
	} catch (error) {
		req.logger.error({
			message: "Failed to archive tool",
			metadata: {
				toolId: req.params.id,
				userId: req.user._id,
			},
			error: error.message,
		});
		res.status(500).json({ message: error.message });
	}
};

/**
 * Middleware to unarchive a tool by its ID.
 */
const unarchiveTool = async (req, res, next) => {
	try {
		const { id } = req.params;

		const unarchivedTool = await Tool.findByIdAndUpdate(
			id,
			{ archived: false },
			{ new: true },
		);

		if (!unarchivedTool) {
			throw new Error(`Tool with ID ${id} not found`);
		}

		unarchivedTool.history.push({
			updatedBy: req.user._id,
			updatedAt: Date.now(),
			status: "Unarchived",
			changeDescription: "Tool unarchived",
		});

		await unarchivedTool.save();

		res.locals.message = `Successfully Restored Tool ${returnUniqueIdentifier(
			unarchivedTool,
		)}`;
		res.locals.tools = mutateToArray(unarchivedTool);
		res.status(201);
		next();
	} catch (error) {
		req.logger.error({
			message: "Failed to unarchive tool",
			metadata: {
				toolId: req.params.id,
				userId: req.user._id,
			},
			error: error.message,
		});
		res.status(500).json({ message: error.message });
	}
};

/**
 * Middleware to check tools for service assignment changes.
 */
const checkTools = async (req, res, next) => {
	try {
		if (!req.body.searchTerms) {
			res.locals.message = "No Tools Submitted For Status Change";
			res.status(400).redirect("back");
			return next();
		}

		const destinationServiceAssignment =
			req.body.serviceAssignmentInput === ""
				? req.body.serviceAssignmentSelector
				: await findServiceAssignmentByJobNumber(
						req.body.serviceAssignmentInput,
					);

		if (!destinationServiceAssignment) {
			res.locals.message =
				"No Service Assignment Found. Please select one from the dropdown";
			res.locals.displaySelector = true;
		}

		res.locals.destinationServiceAssignment = destinationServiceAssignment;

		const search = deduplicateArray(req.body.searchTerms.split(/[\r?\n,]+/));
		const toolsToBeChanged = await lookupToolWrapper(
			search,
			req.user.tenant.valueOf(),
		);

		if (toolsToBeChanged.length === 0) {
			res.locals.message = "No Tools Found Matching ";
		}

		res.locals.tools = toolsToBeChanged;
		next();
	} catch (error) {
		req.logger.error({
			message: "Failed to check tools",
			metadata: {
				tenantId: req.user.tenantId.valueOf(),
				searchTerms: req.body.searchTerms,
			},
			error: error.message,
		});
		res.status(500).json({ message: error.message });
	}
};
/**
 *
 * @param {string} searchTerm search target
 * @param {string} searchField optional, key to search - if not provided, will search all fields
 * @returns {object}
 */
const lookupTool = async (searchTerm, tenant) => {
	const capitalizedSearchTerm = searchTerm.toUpperCase();
	let result = await Tool.findOne({
		serialNumber: { $eq: capitalizedSearchTerm },
		tenant: { $eq: tenant },
	});
	if (!result) {
		result = await Tool.findOne({
			barcode: { $eq: capitalizedSearchTerm },
			tenant: { $eq: tenant },
		});
	}
	if (!result) {
		result = await Tool.findOne({
			toolID: { $eq: capitalizedSearchTerm },
			tenant: { $eq: tenant },
		});
	}
	if (!result) {
		result = {};
	}
	return result;
};
/**
 * @name lookupToolWrapper
 * @desc iterator for looking up multiple search terms for checkTools
 * @param {*} searchTerms
 * @return {*} array of tools, with dummy objects if nothing is found
 */
const lookupToolWrapper = async (searchTerms, tenantId) => {
	const tools = [];
	for (let i = 0; i < searchTerms.length; i++) {
		const result = await lookupTool(searchTerms[i], tenantId);
		if (result?.serialNumber === undefined) {
			tools.push({
				serialNumber: searchTerms[i],
			});
		} else {
			tools.push(result);
		}
	}
	return tools;
};
/**
 * Middleware to submit check-in/out requests for tools.
 */
const submitCheckInOut = async (req, res, next) => {
	try {
		const id = mutateToArray(req.body.id);
		const { destinationServiceAssignment } = req.body;
		const newTools = [];

		for (let i = 0; i < id.length; i++) {
			if (id[i] === "toolNotFound") {
				break;
			}
			const updatedTool = await Tool.findByIdAndUpdate(
				id[i],
				{
					serviceAssignment: destinationServiceAssignment,
					$inc: { __v: 1 },
					updatedAt: Date.now(),
				},
				{ new: true },
			);

			updatedTool.history.push({
				updatedBy: req.user._id,
				updatedAt: Date.now(),
				serviceAssignment: destinationServiceAssignment,
				changeDescription: "Tool check-in/out updated",
			});

			await updatedTool.save();
			newTools.push(updatedTool);
		}

		res.locals.tools = newTools;
		res.locals.message = `${newTools.length} tool(s) have been updated`;
		next();
	} catch (error) {
		req.logger.error({
			message: "Failed to submit check-in/out",
			metadata: {
				toolIds: req.body.id,
				userId: req.user._id,
			},
			error: error.message,
		});
		res.status(500).json({ message: error.message });
	}
};
export const getRecentlyUpdatedTools = async (req, res, next) => {
	try {
		const tools = await Tool.find({ tenant: { $eq: req.user.tenant } })
			.sort({ updatedAt: -1 })
			.limit(50);

		req.logger.info({
			message: "Fetched recently updated tools",
			metadata: { tenant: req.user.tenant, toolCount: tools.length },
		});

		res.locals.tools = tools;
		return next();
	} catch (error) {
		req.logger.error({
			message: "Failed to fetch recently updated tools",
			metadata: { tenant: req.user.tenant },
			error: error.message,
		});
		return [];
	}
};

/**
 * Generates a printer-friendly tool list based on the provided tools.
 */
const generatePrinterFriendlyToolList = (req, res, next) => {
	try {
		if (!res.locals.tools || res.locals.tools.length === 0) {
			res.locals.message = "There are no tools to make into a list";
			req.logger.info({
				message: "No tools available for printer-friendly list",
				metadata: { tenantId: req.user.tenant.valueOf() },
			});
			return next();
		}

		const { tools } = res.locals;
		const printerFriendlyToolArray = tools.map((tool) => {
			return tool;
		});

		if (printerFriendlyToolArray.length === 0) {
			throw new Error("There was a problem creating the printer-friendly data");
		}

		res.locals.printerFriendlyTools = printerFriendlyToolArray || [];
		req.logger.info({
			message: "Printer-friendly tool list generated",
			metadata: {
				tenantId: req.user.tenant.valueOf(),
				toolCount: printerFriendlyToolArray.length,
			},
		});

		return next();
	} catch (err) {
		req.logger.error({
			message: "Failed to generate printer-friendly tool list",
			metadata: { tenantId: req.user.tenant.valueOf() },
			error: err.message,
		});

		res.locals.message = err.message;
		res.locals.printerFriendlyTools = [];
		return next();
	}
};

export {
	getAllTools,
	getActiveTools,
	getToolByID,
	searchTools,
	createTool,
	updateTool,
	archiveTool,
	unarchiveTool,
	checkTools,
	submitCheckInOut,
	generatePrinterFriendlyToolList,
};

// src\middleware\tool.js
