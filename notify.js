// notify.js
import nodemailer from 'nodemailer';
import  fs from 'fs';

// Define the sendEmail function
export default function sendEmail() {
  // Read the content of output.txt and the screenshot
  fs.readFile('output.txt', 'utf8', (err, textData) => {
    if (err) {
      console.error('Error reading file:', err);
      return;
    }

    console.log("Report text : " + textData);

    // Read the screenshot file
    fs.readFile('chart.png', (err, imageData) => {
      if (err) {
        console.error('Error reading image file:', err);
        return;
      }

      // Create a transport object with port 2525
      var transport = nodemailer.createTransport({
        service: 'gmail',
        port: 2525,  // Use port 2525
        auth: {
          user: "cupteamtool@gmail.com",  // Your Gmail address
          pass: "oxqdyawkxefvohcw"   // Your Gmail app password
        }
      });

      // Define email options with HTML content
      var mailOptions = {
        from: "cupteamtool@gmail.com",
        to: 'saiyam.sachdeva@comprotechnologies.com',
        to: 'megha.garg@comprotechnologies.com',
        subject: 'New Relic Report Status',
        html: `
          <pre>${textData}</pre>
        `,
        attachments: [
          {
            filename: 'chart.png',
            content: imageData,
            cid: 'screenshotImage' // Unique content ID for embedding
          },
          {
            filename: 'chart.png',
            content: imageData // Attach the same image as a regular attachment
          }
        ]
      };

      // Send the email
      transport.sendMail(mailOptions, function(error, info) {
        if (error) {
          console.log('Error occurred:', error);
        } else {
          console.log('Email sent:', info.response);
        }
      });
    });
  });
}

// Export the sendEmail function
//module.exports = sendEmail;
// export { sendEmail };
