import { Router } from "express";
import {
	checkTools,
	getToolByID,
	archiveTool,
	createTool,
	searchTools,
	updateTool,
	submitCheckInOut,
	generatePrinterFriendlyToolList,
	getAllTools,
	unarchiveTool,
} from "../middleware/tool.js";
import {
	sanitizeReqBody,
	hoistSearchParamsToBody,
	initCachedContent,
} from "../middleware/util.js";
import { listAllSAs } from "../middleware/serviceAssignment.js";
import {
	renderEditTool,
	renderResults,
	renderStatusChangeConfirmationPage,
	renderBatchCreationPage,
	batchCreateTools,
} from "../controllers/tool.js";
import { redirectToDashboard } from "../controllers/index.js";
export const toolRouter = Router();

// search for tools and render the results with the dashboard view
toolRouter.use(
	"/search",
	sanitizeReqBody,
	hoistSearchParamsToBody,
	listAllSAs,
	searchTools,
	generatePrinterFriendlyToolList,
	renderResults,
);

// retrieve current service assignment and render checkInOut prompting user to select the new assignment
toolRouter.post(
	"/checkInOut",
	listAllSAs,
	checkTools,
	renderStatusChangeConfirmationPage,
);

// save the tool's new service assignment to the database.
toolRouter.post("/submitCheckInOut", submitCheckInOut, initCachedContent, renderResults);

// create new tool
toolRouter.post("/submit", sanitizeReqBody, createTool, initCachedContent, redirectToDashboard);
// render batch creation page
toolRouter.get("/batchCreate", renderBatchCreationPage);
// validate and create a batch of submitted tools
toolRouter.post("/batchCreate", sanitizeReqBody, batchCreateTools, initCachedContent, redirectToDashboard);
// update tool
toolRouter.post("/update", sanitizeReqBody, updateTool, initCachedContent, renderResults);

// archive tool
toolRouter.get("/archive/:id", archiveTool, initCachedContent, getAllTools, renderResults);
// archive tool
toolRouter.get("/unarchive/:id", unarchiveTool, initCachedContent, getAllTools, renderResults);

// get tool by id
toolRouter.get("/:id", getToolByID, listAllSAs, renderEditTool);

// src\routes\tool.routes.js
