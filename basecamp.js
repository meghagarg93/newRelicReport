import fs from "fs";
import axios from "axios";
import CryptoJS from "crypto-js";
import dotenv from "dotenv";

// let access_token = data.access_token;
// let refresh_token = data.refresh_token;
// let creation_date = data.day_created;

dotenv.config();
const secretKey = process.env.SECRET_KEY;

const encryptedclientId = "U2FsdGVkX1/NvoGhZPkYjP2FcrUErmI/OFS5HOH3OMDdj64Agm1nUejs0iyKh4OySL6xYyzm291i2kMGS5gWZQ==";
const encryptedclientSecret = "U2FsdGVkX19fg2Z9UgfmKxsQi7FXA0hYhXWtzwx2UbHnQGdEROEFryy05VNnpoK2mfBJHeMVkPLxAwO05kBbFA==";
const encryptedrefreshToken = "U2FsdGVkX1+72sPCYOXHplwioGJubtHyi2OeeDxuCrVYby8cnntSTZaM01//QFCWHCHI8983XVMejN3S2A6L0TYVAT8QlwvADcwPQM86tw0h0TK6pDkdbXEEVy8veP5kdTqJwji82HKTalrNOyXcoY6ZGyOYEB7C27cDjBeTM0nyA8F2x/4xCMvGZmekXbWtPcRcAJz8TRAlO/YkaP0Pot+WSkc2iIq7glhEGp84Sygw+Cyc8Q8OQAVfwU+HB1o9jS1eQ/UUROk8OTpWgfO1Q1c5K5QC9Jmh56uMhinCyw1Hx8xFYKKPz4a3Zq2e0mUeqIdVHmxtTMj0iN6y6eFK0eBAe3Kw+GEWPsgC3RvVMJPBUMqmCKRCgcA3zqLkPx8pEePbwZ+cy1iVxxUUVhMrw08C/aqfSAmaP7kG20mX4ilcKXg+Ru8NDUksM09/W6D6HykDkVtJQjFQgFhdmUEBkhSHnH5wB+oAf9xc3nXGqfRCh1plD0G53jgxIE3Sn9AftEpyscig5kO+XTUiHvCqFAfz2KC4SJYlsiZmmtHyE+o=";



// async function checkAndUpdateExpiresIn() {
//   const currentDate = moment().format("YYYY-MM-DD");
//   const curr_day = moment().format("DD");
//   const curr_mon = moment().format("MM");
//   let creation_day = moment(creation_date).format("DD");
//   let creation_mon = moment(creation_date).format("MM");
//   if (curr_mon != creation_mon) {
//     //create new token and set the value of day_created
//     try {
//       const accessToken = await startServer();
//       console.log("Access token:", accessToken);
//       const encryptedaccessToken = CryptoJS.AES.encrypt(accessToken, secretKey).toString();
//       //change value of day_created and access token
//       data.access_token = encryptedaccessToken;
//       data.day_created = moment().format("YYYY-MM-DD");
//       saveParams();
//     } catch (error) {
//       console.error("Error during OAuth process:", error);
//     }
//   } else {
//     if (curr_day - creation_day <= 10) {
//       //token valid
//       console.log("token valid");
//     } else {
//       //create new token and set the value of day_created
//       try {
//         const accessToken = await startServer();
//         console.log("Access token:", accessToken);
//         //change value of day_created and access token
//         const encryptedaccessToken = CryptoJS.AES.encrypt(accessToken, secretKey).toString();
//         data.access_token = encryptedaccessToken;
//         data.day_created = moment().format("YYYY-MM-DD");
//         saveParams();
//       } catch (error) {
//         console.error("Error during OAuth process:", error);
//       }
//     }
//   }
// }

// function saveParams() {
//   // Convert data to a JSON string with proper formatting
//   const dataString = `export default ${JSON.stringify(data, null, 2)};`;

//   // Write the updated data to params.js
//   fs.writeFileSync("./params.js", dataString, "utf8", (err) => {
//     if (err) {
//       console.error("Error writing to file:", err);
//     } else {
//       console.log("params.js successfully updated with new expires_in value.");
//     }
//   });
// }

// async function getsgid() {
//   try {
//     const url =
//       "https://3.basecampapi.com/4489886/attachments.json?name=chart.png";
//     const filePath = `./chart.png`;
//     const fileData = fs.readFileSync(filePath);
//     const response = await axios.post(url, fileData, {
//       headers: {
//         Authorization: `Bearer ${CryptoJS.AES.decrypt(access_token, secretKey).toString(CryptoJS.enc.Utf8)}`,
//         "Content-Type": "image/png",
//       },
//     });
//     console.log(JSON.stringify(response.data));
//     let template = fs.readFileSync("output.txt", "utf-8");
//     template = template.replace(
//       "<<chart_link>>",
//       response.data.attachable_sgid
//     );
//     fs.writeFileSync("output.txt", template);
//   } catch (error) {}
// }

async function getAccessTokenFromRefreshToken() {
  const refreshToken = CryptoJS.AES.decrypt(encryptedrefreshToken, secretKey).toString(CryptoJS.enc.Utf8);
  const clientId = CryptoJS.AES.decrypt(encryptedclientId, secretKey).toString(CryptoJS.enc.Utf8);
  const clientSecret = CryptoJS.AES.decrypt(encryptedclientSecret, secretKey).toString(CryptoJS.enc.Utf8);

  try {
    const response = await axios.post("https://launchpad.37signals.com/authorization/token", {
      type: "refresh",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }, {
      headers: {
        "Content-Type": "application/json"
      }
    });

    return response.data.access_token;
  } catch (error) {
    console.error("❌ Failed to fetch access token from refresh token:", error.response?.data || error.message);
    throw error;
  }
}

async function uploadImage(filePath, accessToken) {
  try {
    const fileData = fs.readFileSync(filePath);
    const url = "https://3.basecampapi.com/4489886/attachments.json?name=chart.png";

    const response = await axios.post(url, fileData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "image/png",
      },
    });

    return response.data.attachable_sgid;
  } catch (error) {
    console.error(`❌ Error uploading image ${filePath}:`, error.message);
    return null;
  }
}



// const postToBasecamp = async () => {
//   const url =
//     "https://3.basecampapi.com/4489886/buckets/20201395/recordings/7982515812/comments.json";
//   const headers = {
//     "Content-Type": "application/json",
//     Authorization: `Bearer ${CryptoJS.AES.decrypt(access_token, secretKey).toString(CryptoJS.enc.Utf8)}`,
//   };

//   const report = fs.readFileSync(`output.txt`, `utf8`);
//   // console.log(report);
//   const body = {
//     content: report,
//   };
//   try {
//     // console.log(body.content);
//     const response = await axios.post(url, body, { headers });
//     // console.log(response);
//   } catch (error) {
//     console.log(error);
//   }
// };

async function postToBasecamp(service, env) {
  const accessToken = await getAccessTokenFromRefreshToken();
  console.log("accessToken: " + accessToken);

  const chartPath = `chart.png`;
  const reportPath = `output.txt`;

  const chartSGID = await uploadImage(chartPath, accessToken);

  // Replace chart links in the report
  let content = fs.readFileSync(reportPath, "utf-8");
  content = content.replace("<<chart_link>>", chartSGID);

  fs.writeFileSync(reportPath, content);

  const url = `https://3.basecampapi.com/4489886/buckets/20201395/recordings/7982515812/comments.json`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`
  };

  try {
    const body = { content };
    await axios.post(url, body, { headers });
    console.log(`📬 Posted to Basecamp thread}`);
  } catch (error) {
    console.error(`❌ Failed to post Basecamp comment:`, error.message);
  }
}


export { postToBasecamp };