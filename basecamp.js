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
const encryptedrefreshToken = "U2FsdGVkX1/Bre16n6FlFrJXWuKNw7ZrGEViWogbEEroasznd7/eMe3CX2l07ArlBXxun+CGqCGK0YJY/yrQ6MST69/haVtixckQURWwyJIBUWIR+S08a3JcAzVQqz77wM2HSzg2zIsmvYsMH4yWtcZ501E6NP1RJzoLD9xWDsAmeYb6OC+5iSypsFEQRw26dZ9Mp8wvnSKFieK2bQcosdrCcTF6UW2g2dR5l3qMx1LPiyX7HUoK07jEfL0ULSkN8jFCoFFHCNY3eY3lMsafEPfD/0nhTAMHDJCB5YOUBoy3sNACThXT088Z6AhUvHzr2Q/1MWcAkRzKin9FrU9UwYqnpiRr+RxB++s3voMt3Ow5t/KTRS4q2Sahf3ZZ9VLH14Uu7PoxF1qpLUJD+PdTs41+xe7iWyLKOKbBZKA8BiWWaBUxiRhDt50DL+Y0qRzsUhyJ5Wi/n/58FodmJPRPqqtIYbvFluvf2suDJx04O5GD178ltWmp+pcfhka1/8BodZO+jYqekMGsOvUoMpv4yiOuULPNoQ4NQHVv058o/2Q=";



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