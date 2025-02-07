// notify.js
import nodemailer from "nodemailer";
import fs from "fs";
import CryptoJS from "crypto-js";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env

const secretKey = process.env.SECRET_KEY; // Use API_KEY from .env


// Define the sendEmail function
export default function sendEmail(fail) {
  let password = CryptoJS.AES.decrypt("U2FsdGVkX1+eOet6PMhEyu+sZHVYS0o3IGvhJxmV9V23E0dXH/7rYFpkKH9SgR+p", secretKey).toString(CryptoJS.enc.Utf8)
  // Read the content of output.txt and the screenshot
  if (fail === 0) {
    fs.readFile("output.txt", "utf8", (err, textData) => {
      if (err) {
        console.error("Error reading file:", err);
        return;
      }

      console.log("Report text : " + textData);

      // Create a transport object with port 2525
      var transport = nodemailer.createTransport({
        service: "gmail",
        port: 2525, // Use port 2525
        auth: {
          user: "cupteamtool@gmail.com", // Your Gmail address
          pass: password // Your Gmail app password
        },
      });

      // Define email options with HTML content
      var mailOptions = {
        from: "cupteamtool@gmail.com",
        to: [
          "saiyam.sachdeva@comprotechnologies.com",
          `megha.garg@comprotechnologies.com`,
        ],
        subject: "New Relic Report Status",
        html: `
              <pre>${textData}</pre>
            `,
      };

      // Send the email
      transport.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log("Error occurred:", error);
        } else {
          console.log("Email sent:", info.response);
        }
      });
    });
  } else if(fail === 1) {
    let textData = "Failure: Maximum Number of Retry Done";
    var transport = nodemailer.createTransport({
      service: "gmail",
      port: 2525, // Use port 2525
      auth: {
        user: "cupteamtool@gmail.com", // Your Gmail address
        pass: password , // Your Gmail app password
      },
    });

    // Define email options with HTML content
    var mailOptions = {
      from: "cupteamtool@gmail.com",
      to: [
        "saiyam.sachdeva@comprotechnologies.com",
        `megha.garg@comprotechnologies.com`,
      ],
      subject: "New Relic Report Status",
      html: `
      <pre>${textData}</pre>
    `,
    };

    // Send the email
    transport.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log("Error occurred:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });
  }
}

