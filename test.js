import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import fs from "fs";
import path from "path";
// const fs = require('fs');
// const unique = require('./index.js');
import { unique } from "./index.js";
// import {uploadToDrive} from "./driveUpload.js";
import sendEmail from "./notify.js";
import {postToBasecamp, getsgid, checkAndUpdateExpiresIn} from "./basecamp.js";
import { startServer } from './startserver.js';


const checkUnique = async () => {
  // In a real scenario, you might need to use some synchronization mechanism to ensure unique is ready
  // console.log('Unique count:', unique);
};

// Invoke the function to check the value
checkUnique();

// The JSON data

const data = unique;
if (data === "Error Processing data") {
  sendEmail(1);

} else {
  // Extracting the results

  const results = data.data.actor.account.nrql.results;

  // Converting beginTimeSeconds to date strings and extracting values
  const labels = results.map((item) =>
    new Date(item.beginTimeSeconds * 1000).toLocaleString()
  );
  const values = results.map((item) => item.value);

  // Set up chart configuration
  const width = 1500; // Width of the graph
  const height = 600; // Height of the graph

  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

  const configuration = {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Concurrency per 15 mins",
          data: values,
          borderColor: "rgba(75, 192, 192, 1)",
          tension: 0.1,
        },
      ],
    },
    options: {
      scales: {
        x: {
          title: {
            display: true,
            text: "Time",
          },
        },
        y: {
          title: {
            display: true,
            text: "Value",
          },
        },
      },
    },
  };

  // Render chart and save it as an image
  (async () => {
    try {
      const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
      const chartPath = path.join("", "chart.png");
      fs.writeFileSync(chartPath, imageBuffer);
      console.log("Chart saved as chart.png");

      // Call the drive upload function
      // await uploadToDrive("Upload message", { chart: "chart.png" });
      // console.log("Chart uploaded to Google Drive");
      
      await getsgid();
      await checkAndUpdateExpiresIn();
      await sendEmail(0);
      await postToBasecamp();

    } catch (error) {
      console.error("Error generating chart:", error);
    }
  })();
}
