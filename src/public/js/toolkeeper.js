function openInNewTab() {
	// Open new window with specific security features
	const printWindow = window.open('', '_blank',
		'width=800,height=600,menubar=no,toolbar=no,location=no,status=no,noopener,noreferrer'
	);

	if (printWindow) {
		// Set security headers for the new window
		printWindow.document.write('<!DOCTYPE html><html><head>');
		printWindow.document.write('<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'none\';">');
		printWindow.document.write('<title>Printer Friendly View</title></head><body>');

		// Get the content and create a sanitized copy
		const content = document.getElementById("printerFriendlyTools");
		if (content) {
			// Create a deep clone to avoid manipulating the original DOM
			const sanitizedContent = content.cloneNode(true);
			// Remove any script tags from the cloned content
			const scripts = sanitizedContent.getElementsByTagName('script');
			while (scripts[0]) {
				scripts[0].parentNode.removeChild(scripts[0]);
			}

			printWindow.document.body.appendChild(sanitizedContent);
		}

		printWindow.document.write('</body></html>');
		printWindow.document.close();
	}
}
if (document.getElementsByClassName("fa-print").length > 0) {
	console.log("Print button found.");
	document
		.getElementsByClassName("fa-print")[0]
		.addEventListener("click", openInNewTab);
}
function populateDashboard(cachedData) {
	const serviceAssignmentsContainer = document.getElementById(
		"service-assignments-parent",
	);
	if (serviceAssignmentsContainer) {
		// Clear any existing content
		serviceAssignmentsContainer.innerHTML = "";

		// Loop through the cached service assignments and render them
		// biome-ignore lint/complexity/noForEach: <explanation>
		cachedData.serviceAssignments.forEach((assignment) => {
			if (assignment.toolCount > 0 && assignment.active) {
				const tr = document.createElement("tr");
				const td = document.createElement("td");
				const link = document.createElement("a");
				link.href = `/tool/search?searchBy=serviceAssignment&searchTerm=${assignment._id}`;
				link.textContent = `${assignment.toolCount}  | ${assignment.jobNumber} - ${assignment.jobName}`;
				td.appendChild(link);
				tr.appendChild(td);
				serviceAssignmentsContainer.appendChild(tr);
			}
		});
	}
}

document.addEventListener("DOMContentLoaded", async () => {
	const cachedData = JSON.parse(localStorage.getItem("serviceData"));
	const cachedHash = localStorage.getItem("serviceDataHash");

	// sourcery skip: avoid-function-declarations-in-blocks
	async function fetchAndUpdateCache() {
		console.log("Fetching fresh data from server...");
		try {
			const response = await fetch("/dashboard/cache");
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			const data = await response.json();

			// If the hash is different, update the cache
			if (data.hash !== cachedHash) {
				console.log("Cache is stale, updating with new data...");
				localStorage.setItem("serviceData", JSON.stringify(data.data));
				localStorage.setItem("serviceDataHash", data.hash);
				return data.data;
			}
			console.log("Cache is up to date");
			return cachedData;
		} catch (error) {
			console.error("Error fetching cached data:", error);
			return cachedData; // Fall back to cached data if fetch fails
		}
	}

	if (cachedData && cachedHash) {
		console.log("Found cached data, checking if it's still valid...");
		const data = await fetchAndUpdateCache();
		populateDashboard(data);
	} else {
		console.log("No cached data found, fetching from server...");
		const data = await fetchAndUpdateCache();
		if (data) {
			populateDashboard(data);
		}
	}
});

// src\public\js\toolkeeper.js
