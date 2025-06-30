import axios from "axios";
import fs from "fs";
import { parse } from "csv-parse";
import moment from "moment";
import { log } from "console";
import { query } from "express";
import dotenv from "dotenv";
import sendEmail from "./notify.js";

dotenv.config(); // Load environment variables from .env

const API_KEY = process.env.API_KEY; // Use API_KEY from .env
const ACCOUNT_ID = process.env.ACCOUNT_ID; // Use ACCOUNT_ID from .env

const reportDate = process.argv[2]
  ? moment(process.argv[2], "YYYY-MM-DD")
  : moment(); // Use the provided date or default to today
const today = reportDate.format("YYYY-MM-DD 10:00:00+0530");
const yesterday = reportDate
  .clone()
  .subtract(1, "day")
  .format("YYYY-MM-DD 10:00:00+0530");
const daybfryesterday = reportDate
  .clone()
  .subtract(2, "day")
  .format("YYYY-MM-DD 10:00:00+0530");

  const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

console.log("System Timezone:", systemTimezone);
console.log("Moment Timezone Offset:", reportDate.format("Z"));
console.log("Today:", today);

let var_percentile = "";
let old_percentile = "";
let ct1 = "";
let ct2 = "";

const QUERIES = {
  average_duration: `
    {
      actor {
        account(id: ${ACCOUNT_ID}) {
          nrql(query: "Select average(duration) from BrowserInteraction WHERE appName = 'c1-prod1' and duration < 300 SINCE '${yesterday}' UNTIL '${today}'") {
            results
          }
        }
      }
    }
  `,
  old_average_duration: `
    {
      actor {
        account(id: ${ACCOUNT_ID}) {
          nrql(query: "Select average(duration) from BrowserInteraction WHERE appName = 'c1-prod1' and duration < 300 SINCE '${daybfryesterday}' UNTIL '${yesterday}'") {
            results
          }
        }
      }
    }
  `,
  firstContentfulPaint: `
    {
      actor {
        account(id: ${ACCOUNT_ID}) {
          nrql(query: "Select average(firstContentfulPaint) from PageView WHERE appName = 'c1-prod1' AND firstContentfulPaint IS NOT NULL SINCE '${yesterday}' UNTIL '${today}'") {
            results
          }
        }
      }
    }
  `,
  largestContentfulPaint: `
    {
      actor {
        account(id: ${ACCOUNT_ID}) {
          nrql(query: "Select average(largestContentfulPaint) from PageViewTiming WHERE appName = 'c1-prod1' AND largestContentfulPaint IS NOT NULL SINCE '${yesterday}' UNTIL '${today}'") {
            results
          }
        }
      }
    }
  `,
  apdex: `
    {
      actor {
        account(id: ${ACCOUNT_ID}) {
          nrql(query: "SELECT apdex(duration,t: 3.5) AS '' FROM BrowserInteraction WHERE appName = 'c1-prod1' SINCE '${yesterday}' UNTIL '${today}'") {
            results
          }
        }
      }
    }
  `,
  old_apdex: `
    {
      actor {
        account(id: ${ACCOUNT_ID}) {
          nrql(query: "SELECT apdex(duration,t: 3.5) AS '' FROM BrowserInteraction WHERE appName = 'c1-prod1' SINCE '${daybfryesterday}' UNTIL '${yesterday}'") {
            results
          }
        }
      }
    }
  `,
  uniqueCount: `
  { 
  actor { 
      account(id: 2758876) { 
        nrql(query: "SELECT uniqueCount(session) AS 'value' from PageView where appName = 'c1-prod1'  TIMESERIES 15 minutes SINCE '${yesterday}' UNTIL '${today}' ") { results metadata { facets timeWindow { end begin } } } 
        }
      }
    }
  `,
  classmem: `{
      actor {
        account(id: ${ACCOUNT_ID}) {
          nrql(query: "SELECT max(aws.elasticache.DatabaseMemoryUsagePercentage.byRedisNode)  AS 'Memory Used Percentage' FROM Metric WHERE entity.name LIKE 'prod1-s-analyticclassrecord-001-0001' SINCE '${yesterday}' UNTIL '${today}'") {
            results
          }
        }
      }
    }
      `,
  memory: `
        {
      actor {
        account(id: ${ACCOUNT_ID}) {
          nrql(query: "SELECT max(aws.elasticache.DatabaseMemoryUsagePercentage.byRedisNode)  AS 'Memory Used Percentage' FROM Metric WHERE entity.name LIKE 'dlr1sk67vwm1v06l-001-0001' SINCE '${yesterday}' UNTIL '${today}' ") {
            results
          }
        }
      }
    }
      `,
  xapicountperday: `
    {
      actor {
        account(id: ${ACCOUNT_ID}) {
          nrql(query: "SELECT count(*) AS 'Backend Transaction Count' from Transaction where appName = 'c1-prod1' and request.uri like '%/xapi-statements/%' SINCE '${yesterday}' UNTIL '${today}'") {
            results
          }
        }
      }
    }
  `,
  xapicountperhour: `
    {
      actor {
        account(id: ${ACCOUNT_ID}) {
          nrql(query: "SELECT count(*) AS 'Value' from Transaction where appName = 'c1-prod1' and request.uri like '%/xapi-statements/%' TIMESERIES 1 hour SINCE '${yesterday}' UNTIL '${today}'") {
            results
          }
        }
      }
    }
  `,
  totalaction: `
    {
      actor {
        account(id: ${ACCOUNT_ID}) {
          nrql(query: "SELECT count(*) AS 'Total Actions' FROM BrowserInteraction where appName = 'c1-prod1' SINCE '${yesterday}' UNTIL '${today}'") {
            results
          }
        }
      }
    }
  `,
  top2countries: `
    {
      actor {
        account(id: ${ACCOUNT_ID}) {
          nrql(query: "SELECT count(*) as 'Page Hits', apdex(duration, t: 3.5) as 'Apdex' FROM BrowserInteraction FACET countryCode where appName = 'c1-prod1' and duration < 300 SINCE '${yesterday}' UNTIL '${today}' ORDER BY 'Page Hits' DESC limit 2") {
            results
          }
        }
      }
    }
  `,
  // old_top2countries: `
  //   {
  //     actor {
  //       account(id: ${ACCOUNT_ID}) {
  //         nrql(query: "SELECT count(*) as 'Page Hits', apdex(duration, t: 3.5) as 'Apdex' FROM BrowserInteraction FACET countryCode where appName = 'c1-prod1' and duration < 300 SINCE '${daybfryesterday}' UNTIL '${yesterday}' ORDER BY 'Page Hits' DESC limit 2") {
  //           results
  //         }
  //       }
  //     }
  //   }
  // `,
  old_ct1: `
    {
      actor {
        account(id: ${ACCOUNT_ID}) {
          nrql(query: "SELECT count(*) as 'Page Hits', apdex(duration, t: 3.5) as 'Apdex' FROM BrowserInteraction where countryCode = '${ct1}' and appName = 'c1-prod1' and duration < 300 SINCE '${yesterday}' UNTIL '${today}'") {
            results
          }
        }
      }
    }
  `,
  old_ct2: `
    {
      actor {
        account(id: ${ACCOUNT_ID}) {
          nrql(query: "SELECT count(*) as 'Page Hits', apdex(duration, t: 3.5) as 'Apdex' FROM BrowserInteraction where countryCode = '${ct2}' and appName = 'c1-prod1' and duration < 300 SINCE '${yesterday}' UNTIL '${today}'") {
            results
          }
        }
      }
    }
  `,
  incidents: `
    {
      actor {
        account(id: ${ACCOUNT_ID}) {
          nrql(query: "SELECT policyName,priority,conditionName, title, openTime, closeTime FROM NrAiIncident WHERE policyName IN ('C1 Prod Synthetic Failure Alerts','C1|PROD1|SyntheticFailure') and event = 'close' LIMIT MAX SINCE '${yesterday}' UNTIL '${today}'") {
            results
          }
        }
      }
    }
  `,
  percentile: `
    {
      actor {
        account(id: ${ACCOUNT_ID}) {
          nrql(query: "SELECT percentile(duration, 99.9) FROM BrowserInteraction WHERE appName = 'c1-prod1' SINCE '${yesterday}' UNTIL '${today}'") {
            results
          }
        }
      }
    }
  `,
  old_percentile: `
    {
      actor {
        account(id: ${ACCOUNT_ID}) {
          nrql(query: "SELECT percentile(duration, 99.9) FROM BrowserInteraction WHERE appName = 'c1-prod1' SINCE '${daybfryesterday}' UNTIL '${yesterday}'") {
            results
          }
        }
      }
    }
  `,
  new_reg: `
    {
      actor {
        account(id: ${ACCOUNT_ID}) {
          nrql(query: "SELECT count(*) AS 'New Registrations' from BrowserInteraction Where targetUrl Like 'https://www.cambridgeone.org/regoptions' and appName = 'c1-prod1' SINCE '${yesterday}' UNTIL '${today}' LIMIT MAX") {
            results
          }
        }
      }
    }
  `,
  nnp_user: `
    {
      actor {
        account(id: ${ACCOUNT_ID}) {
          nrql(query: "SELECT average(duration) AS 'AVG for 99 Percentile' FROM BrowserInteraction WHERE appName = 'c1-prod1' AND duration < ${var_percentile} SINCE '${yesterday}' UNTIL '${today}'") {
            results
          }
        }
      }
    }
  `,
  old_nnp_user: `
    {
      actor {
        account(id: ${ACCOUNT_ID}) {
          nrql(query: "SELECT average(duration) AS 'AVG for 99 Percentile' FROM BrowserInteraction WHERE appName = 'c1-prod1' AND duration < ${var_percentile} SINCE '${daybfryesterday}' UNTIL '${yesterday}'") {
            results
          }
        }
      }
    }
  `,
  incident2: `
    {
      actor {
        account(id: ${ACCOUNT_ID}) {
          nrql(query: "SELECT count(*) FROM NrAiIncident WHERE event = 'open' and policyName IN ('C1 Prod Alerts','C1|PROD1|Alerts', 'C1|PROD1|Alerts (Internal)', 'Compro Internal | Support Team') FACET policyName, event, priority , conditionName, title  since '${yesterday}' UNTIL '${today}' LIMIT MAX") {
            results
          }
        }
      }
    }
  `,
  anomalies: `
    {
      actor {
        account(id: ${ACCOUNT_ID}) {
          nrql(query: "SELECT count(*) FROM NrAiAnomaly where event = 'open' AND entityName = 'c1-prod1' facet signalType SINCE '${yesterday}' UNTIL '${today}'") {
            results
          }
        }
      }
    }
  `,
};

let unique = "";


const delay = (delaytime) => {
  return new Promise((resolve) => setTimeout(resolve, delaytime));
};

async function sendrequest(queryObject, retries) {
  for (let i = 0; i < retries; i++) {
    console.log('Attempt: ' + (i + 1));
    if(i>0) 
      await delay(5000);
    
    try {
      const response = await axios.post(
        "https://api.eu.newrelic.com/graphql",
        { query: queryObject },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "API-Key": API_KEY,
          },
        }
      );

      // Check if response contains expected data
      if (response.data.data.actor.account.nrql != null) {
        console.log("Successful response received.");
        return response;
      } else {
        
        console.log("Response does not contain expected data.");
      }
      
    } catch (error) {
      console.log(`Request failed on attempt ${i + 1}: ${error.message}`);
    }
  }

  console.log("All retries exhausted.");
  return null;
}


const fetchDataForQueryId = async (queryId) => {
  if (!QUERIES[queryId]) {
    throw new Error(`Invalid query ID: ${queryId}`);
  }

    // const response = await axios.post(
    //   "https://api.eu.newrelic.com/graphql",
    //   { query: QUERIES[queryId] },
    //   {
    //     headers: {
    //       "Content-Type": "application/json",
    //       "API-Key": API_KEY,
    //     },
    //   }
    // );


    const response = await sendrequest(QUERIES[queryId], 3); 
    // Store the response data
    //error handling

    if (response == null) {
      //send failure mail
      // await sendEmail(1);
      throw new Error("Error in getting data");
    } else {
      // await delay(50000);
    }

    const resultData = response.data.data.actor.account.nrql.results[0];
    if (queryId === "apdex" || queryId == "old_apdex") {
      return resultData.score;
    } else if (queryId === "uniqueCount") {
      const results = response.data.data.actor.account.nrql.results;
      const maxItem = results.reduce(
        (max, item) => (item.value > max.value ? item : max),
        results[0]
      );
      const maxValue = maxItem.value;
      const maxTime = new Date(
        maxItem.beginTimeSeconds * 1000
      ).toLocaleString();

      const maxx = response.data;
      maxx.maxTime = maxTime;
      maxx.maxValue = maxValue;
      return maxx;
    } else if (queryId == "xapicountperhour") {
      let x = response.data.data.actor.account.nrql.results;
      let max = -10000000000;
      for (const v of x) {
        max = Math.max(v.Value, max);
      }

      return max;
    } else if (queryId == "top2countries" || queryId == "old_top2countries") {
      let data = response.data.data.actor.account.nrql.results;
      return data;
    } else if (queryId == "incidents") {
      const x = response.data.data.actor.account.nrql.results;
      var op = "";
      if (x.length === 0) {
        op += ``;
        return op;
      } else {
        x.forEach((element) => {
          const closeTime = new Date(element.timestamp);
          const openTime = new Date(element.openTime);
          const title = element.title;
          const conditionName = element.conditionName;
          const formattedOpenTime =
            openTime
              .toLocaleString("en-GB", { timeZoneName: "short" })
              .split(" ")[0] +
            " " +
            openTime.toLocaleTimeString("en-GB");
          const formattedCloseTime =
            closeTime
              .toLocaleString("en-GB", { timeZoneName: "short" })
              .split(" ")[0] +
            " " +
            closeTime.toLocaleTimeString("en-GB");
          op += ` ${conditionName} \n ${title}\n This incident was open on: ${formattedOpenTime} and was closed on: ${formattedCloseTime}\n\n`;
        });
      }
      return op;
    } else if (queryId == "incident2") {
      const x = response.data.data.actor.account.nrql.results;
      var op = "";
      if (x.length === 0) {
        op += "No Incidents were reported during this time frame.";
      } else {
        x.forEach((item) => {
          const count = item.count;
          const conditionName = item.facet[3];
          const title = item.facet[4];
          op += `${conditionName} \n  ${title} : ${count} occurrences \n\n`;
        });
      }
      return op;
    } else if (queryId == "new_reg") {
      let key = Object.keys(resultData)[0];
      let newRegistrations = resultData[key];
      return newRegistrations;
    } else if (queryId == "percentile" || queryId == "old_percentile") {
      const outerKey = Object.keys(resultData)[0]; // 'percentile.duration'
      // Get the inner key
      const innerKey = Object.keys(resultData[outerKey])[0]; // '99.9'
      // Extract the value using the keys
      const value = resultData[outerKey][innerKey]; // 432
      return value; // Outputs: 432
    } else if (queryId == "nnp_user") {
      return resultData[Object.keys(resultData)[0]];
    } else if (queryId == "old_nnp_user") {
      return resultData[Object.keys(resultData)[0]];
    } else if (queryId == "anomalies") {
      var op = "";
      let x = response.data.data.actor.account.nrql.results;
      if (x.length === 0) {
        op += "No Anomalies were detected during this time frame.";
      }
      return op;
    } else if(queryId == "old_ct1" || queryId == "old_ct2"){
      return resultData.score;
      
    } else {
      return Object.values(resultData)[0];
    }
};

const readCsvAndFetchData = async () => {
  const csvContent = fs.readFileSync("input.csv", "utf8");

  // Parse CSV content asynchronously
  const records = await new Promise((resolve, reject) => {
    parse(
      csvContent,
      { columns: true, skip_empty_lines: true },
      (err, data) => {
        if (err) {
          return reject(err);
        }
        resolve(data);
      }
    );
  });

  let apdexScore = "";
  let old_apdexScore = "";
  let averageDuration = "";
  let old_averageDuration = "";
  let largestContentfulPaint = "";
  let firstContentfulPaint = "";

  let classmem = "";
  let xapicountperday = "";
  let xapicountperhour = "";
  let memory = "";
  let totalaction = "";

  let apdexct1 = "";
  let apdexct2 = "";
  let old_ct1 = "";
  let old_ct2 = "";
  let old_apdexct1 = "";
  let old_apdexct2 = "";
  let incidents = "";
  let maxTime = "";
  let maxValue = "";
  let new_reg = "";
  let nnp_user = "";
  let old_nnp_user = "";
  let incident2 = "";
  let anomalies = "";
  for (const row of records) {
    const queryId = row.queryId;
    console.log(`${queryId} query processing!!`);
    try {
      const data = await fetchDataForQueryId(queryId);
      if (queryId === "apdex") {
        apdexScore = data;
      } else if (queryId === "average_duration") {
        averageDuration = data;
      } else if (queryId === "largestContentfulPaint") {
        console.log("LCP Query is : " +QUERIES.largestContentfulPaint);
        largestContentfulPaint = data;
        console.log("LCP value is :  " + largestContentfulPaint);
      } else if (queryId === "firstContentfulPaint") {
        firstContentfulPaint = data;
      } else if (queryId === "uniqueCount") {
        unique = data;
        maxTime = unique.maxTime;
        maxValue = unique.maxValue;
      } else if (queryId == "classmem") {
        classmem = data;
      } else if (queryId == "memory") {
        memory = data;
      } else if (queryId == "old_apdex") {
        old_apdexScore = data;
      } else if (queryId == "old_average_duration") {
        old_averageDuration = data;
      } else if (queryId == "xapicountperday") {
        xapicountperday = data / 1000000;
      } else if (queryId == "xapicountperhour") {
        xapicountperhour = data;
      } else if (queryId == "totalaction") {
        totalaction = Math.abs(data / 1000000);
      } else if (queryId == "top2countries") {
        ct1 = data[0].facet;
        ct2 = data[1].facet;
        apdexct1 = data[0].score;
        apdexct2 = data[1].score;
        // console.log(ct1);
        // console.log(ct2);
        QUERIES.old_ct1 = `
          {
      actor {
        account(id: ${ACCOUNT_ID}) {
          nrql(query: "SELECT count(*) as 'Page Hits', apdex(duration, t: 3.5) as 'Apdex' FROM BrowserInteraction where countryCode = '${ct1}' and appName = 'c1-prod1' and duration < 300 SINCE '${daybfryesterday}' UNTIL '${yesterday}'") {
            results
          }
        }
      }
    }
        `;
        QUERIES.old_ct2 = `
          {
      actor {
        account(id: ${ACCOUNT_ID}) {
          nrql(query: "SELECT count(*) as 'Page Hits', apdex(duration, t: 3.5) as 'Apdex' FROM BrowserInteraction where countryCode = '${ct2}' and appName = 'c1-prod1' and duration < 300 SINCE '${daybfryesterday}' UNTIL '${yesterday}'") {
            results
          }
        }
      }
    }
        `;
        // console.log(QUERIES.old_ct1);
        // console.log(QUERIES.old_ct2);
        
      }
      //  else if (queryId == "old_top2countries") {
      //   old_ct1 = data[0].facet;
      //   old_ct2 = data[1].facet;
      //   old_apdexct1 = data[0].score;
      //   old_apdexct2 = data[1].score;
      // } 
      else if (queryId == "incidents") {
        incidents = data;
      } else if (queryId == "new_reg") {
        new_reg = data;
      } else if (queryId == "percentile") {
        var_percentile = data;
        QUERIES.nnp_user = `
        {
      actor {
        account(id: ${ACCOUNT_ID}) {
          nrql(query: "SELECT average(duration) AS 'AVG for 99 Percentile' FROM BrowserInteraction WHERE appName = 'c1-prod1' AND duration < ${var_percentile} SINCE '${yesterday}' UNTIL '${today}'") {
            results
          }
        }
      }
    }
      `;
      } else if (queryId == "nnp_user") {
        nnp_user = data;
      } else if (queryId == "old_percentile") {
        old_percentile = data;
        QUERIES.old_nnp_user = `
          {
      actor {
        account(id: ${ACCOUNT_ID}) {
          nrql(query: "SELECT average(duration) AS 'AVG for 99 Percentile' FROM BrowserInteraction WHERE appName = 'c1-prod1' AND duration < ${old_percentile} SINCE '${daybfryesterday}' UNTIL '${yesterday}'") {
            results
          }
        }
      }
    }
        `;
      } else if (queryId == "old_nnp_user") {
        old_nnp_user = data;
      } else if (queryId == "incident2") {
        incident2 = data;
      } else if (queryId == "anomalies") {
        anomalies = data;
      }
      else if(queryId == "old_ct1"){
        // console.log("old_ct1 " + data);
        old_ct1 = data;
      }
      else if(queryId == "old_ct2"){
        // console.log("old_ct2 " + data);
        old_ct2 = data;
      }
    } catch (error) {
      console.error(`Error processing query ID ${queryId}:`, error.message);
      unique = "Error Processing data";
      break;
    }
  }

  let template = fs.readFileSync("template.txt", "utf-8");
  template = template
    .replace("<<Date1>>", today)
    .replace("<<Date2>>", yesterday)
    .replace("<<apdexScore>>", apdexScore)
    .replace(
      "<<averageDuration>>",
      Number.parseFloat(averageDuration).toFixed(2)
    )
    .replace(
      "<<largestContentfulPaint>>",
      Number.parseFloat(largestContentfulPaint).toFixed(2)
    )
    .replace(
      "<<firstContentfulPaint>>",
      Number.parseFloat(firstContentfulPaint).toFixed(2)
    )
    .replace("<<classmem>>", Number.parseFloat(classmem).toFixed(2))
    .replace("<<memory>>", Number.parseFloat(memory).toFixed(2))
    .replace(
      "<<xapicountperday>>",
      Number.parseFloat(xapicountperday).toFixed(2)
    )
    .replace(
      "<<xapicountperhour>>",
      Number.parseFloat(xapicountperhour / 1000).toFixed(0)
    )
    .replace("<<totalaction>>", Number.parseFloat(totalaction).toFixed(2))
    .replace("<<ct1>>", ct1)
    .replace("<<ct2>>", ct2)
    .replace("<<apdexct1>>", apdexct1)
    .replace("<<apdexct2>>", apdexct2)
    .replace("<<Incidents_to_add>> ", incidents)
    .replace("<<maxTime>>", maxTime)
    .replace("<<maxValue>>", maxValue)
    .replace("<<new_reg>>", Number.parseFloat(new_reg / 1000).toFixed(0))
    .replace("<<nnp_user>>", Number.parseFloat(nnp_user).toFixed(2))
    .replace("<<incident2>>", incident2)
    .replace("<<anomalies>>", anomalies);
  let cmpamt = Math.abs(apdexScore - old_apdexScore);
  if (apdexScore == old_apdexScore) {
    template = template
      .replace("<<Comparator>>", "Same as")
      .replace("<<cmpamt>>", old_apdexScore);
  } else if (apdexScore > old_apdexScore) {
    template = template
      .replace("<<Comparator>>", "Increased from")
      .replace("<<cmpamt>>", old_apdexScore);
  } else {
    template = template
      .replace("<<Comparator>>", "Reduced from")
      .replace("<<cmpamt>>", old_apdexScore);
  }
  let cmpamt1 = Math.abs(old_averageDuration - averageDuration);
  if (old_averageDuration > averageDuration) {
    template = template
      .replace("<<Comparator1>>", "Reduced")
      .replace("<<cmpamt1>>", Number.parseFloat(cmpamt1 * 1000).toFixed(2));
  } else {
    template = template
      .replace("<<Comparator1>>", "Increased")
      .replace("<<cmpamt1>>", Number.parseFloat(cmpamt1 * 1000).toFixed(2));
  }

  if (old_ct1 == apdexct1) {
    template = template
      .replace("<<Comparator2>>", "Same as")
      .replace("<<cmpamt2>>", old_ct1);
  } else if (old_ct1 > apdexct1) {
    template = template
      .replace("<<Comparator2>>", "Reduced from")
      .replace("<<cmpamt2>>", old_ct1);
  } else {
    template = template
      .replace("<<Comparator2>>", "Increased from")
      .replace("<<cmpamt2>>", old_ct1);
  }

  //
  if (old_ct2 == apdexct2) {
    template = template
      .replace("<<Comparator3>>", "Same as")
      .replace("<<cmpamt3>>", old_ct2);
  } else if (old_ct2 > apdexct2) {
    template = template
      .replace("<<Comparator3>>", "Reduced from")
      .replace("<<cmpamt3>>", old_ct2);
  } else {
    template = template
      .replace("<<Comparator3>>", "Increased from")
      .replace("<<cmpamt3>>", old_ct2);
  }

  if (nnp_user < old_nnp_user) {
    let a = Number.parseFloat(old_nnp_user).toFixed(2);
    let b = Number.parseFloat(nnp_user).toFixed(2);
    template = template
      .replace("<<Comparator4>>", "Reduced by")
      .replace("<<old_nnp_user>>", Number.parseFloat(a - b).toFixed(2) * 1000);
  } else if (nnp_user > old_nnp_user) {
    let a = Number.parseFloat(old_nnp_user).toFixed(2);
    let b = Number.parseFloat(nnp_user).toFixed(2);
    template = template
      .replace("<<Comparator4>>", "Increased by")
      .replace("<<old_nnp_user>>", Number.parseFloat(b - a).toFixed(2) * 1000);
  } else {
    template = template
      .replace("<<Comparator4>>", "Same as")
      .replace("<<old_nnp_user>>", Number.parseFloat(old_nnp_user).toFixed(2));
  }

  fs.writeFileSync("output.txt", template);
  console.log("Data fetching and writing completed.");
};

// Execute the function
await readCsvAndFetchData();
export { unique };
