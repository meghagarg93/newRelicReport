import { google } from "googleapis";
import credentials from "./google-spreadsheet-private-key.json" assert { type: "json" };
import fs from "fs";
import path from "path";
import sendEmail from "./notify.js"; // Import the sendEmail function

const scopes = ["https://www.googleapis.com/auth/drive"];
const auth = new google.auth.JWT(
  credentials.client_email,
  null,
  credentials.private_key,
  scopes
);
const drive = google.drive({ version: "v3", auth });
var sharedFolderID = "1WetY0VILeu99f5hfQDi8PajwqG7BBsff";
export const uploadToDrive = async function (msg, argv) {
  console.log("inside drive upload");
  // let outputData = 'Test file' + new Date();
  let outputFileName = "output.txt";
  let filepath = path.join('', outputFileName);
  //console.log(filepath);
  // createTextFile(fs, outputData, filepath);
  let utilityName = "newRelicReport";
  let chartpath = path.join('', argv.chart);
  //   let currentDate = getCurrentDateString(argv.timestamp)
  //   //console.log(currentDate);
  let utilityFolderID = await getFolderId(drive, utilityName, sharedFolderID);
  //   //console.log(utilityFolderID);
  //   let dateFolderID = await getFolderId(drive, currentDate, utilityFolderID);
  //  // console.log(dateFolderID);
  //   let timestampFolderID = await getFolderId(drive, argv.timestamp, dateFolderID);
  // uploadFile(drive, outputFileName, filepath, utilityName, 'text')
  await uploadFile(drive, "chart.png", chartpath, utilityFolderID, "png");
  await uploadFile(drive, outputFileName, filepath, utilityFolderID, "text");

  await sendEmail();

  //upload attachments
  // uploadFile(drive, 'gradebook.txt', path.join(__dirname, '../output/gradebook.txt'), timestampFolderID, 'text')
  //       fs.readdirSync('gradebookScreenshots').forEach(file => {

  //         uploadFile(drive, file, path.join(__dirname, `../gradebookScreenshots/${file}`), timestampFolderID, 'png')

  //       })
  //     }

  // }
  async function getFolderId(drive, folderName, parentFolderId) {
    let folderExist = false;
    let folderid;
    let res = await drive.files.list({
      q: "parents in '" + parentFolderId + "'",
    });
    const files = res.data.files;
    for (var i = 0; i < files.length; i++) {
      console.log(files[i]);
      if (
        files[i].mimeType == "application/vnd.google-apps.folder" &&
        files[i].name == folderName
      ) {
        console.log(files[i].id);
        folderid = files[i].id;
        folderExist = true;
        break;
      }
    }
    if (folderExist == false) {
      console.log("folder does not exist");
      //create folder
      await createFolder(drive, folderName, parentFolderId);
      folderid = await getFolderId(drive, folderName, parentFolderId);
    }
    return folderid;
  }
  async function uploadFile(
    drive,
    filename,
    filepath,
    parentFolderid,
    fileType
  ) {
    let mimeTypeValue;
    if (fileType == "text") mimeTypeValue = "text/plain";
    else if (fileType == "csv") mimeTypeValue = "text/csv";
    else if (fileType == "png") mimeTypeValue = "image/png";
    else if (fileType == "jpeg") mimeTypeValue = "image/png";
    else console.log("fileType not supported");

    let parentsIdArr = [];
    parentsIdArr[0] = parentFolderid;
    const fileMetadata = {
      name: filename,
      parents: parentsIdArr,
    };
    const media = {
      mimeType: mimeTypeValue,
      body: fs.createReadStream(filepath),
    };
    try {
      await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: "id",
      });
    } catch (err) {
      // TODO(developer) - Handle error
      throw err;
    }
  }
  async function createFolder(drive, folderName, parentFolderid) {
    let parentsIdArr = [];
    parentsIdArr[0] = parentFolderid;
    let fileMetadata = {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: parentsIdArr,
    };
    try {
      await drive.files.create({
        resource: fileMetadata,
        fields: "id",
      });
    } catch (err) {
      throw err;
    }
  }
  async function createTextFile(fs, data, filepath) {
    // Write data in 'filename.txt' .
    fs.writeFileSync(filepath, data);
  }

  // function getCurrentDateString(timestamp) {
  //   //let timestamp = Date.now();
  //   let todate = new Date(timestamp).getDate();
  //   let tomonth = new Date(timestamp).getMonth() + 1;
  //   let toyear = new Date(timestamp).getFullYear();
  //   let currentDate = todate + '-' + tomonth + '-' + toyear;
  //   console.log(currentDate);
  //   return currentDate;
  // }
};
