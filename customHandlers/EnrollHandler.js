const electron = require("electron");
const { ipcRenderer } = electron; //For sending values from this js page to the main.js page

const form = document.querySelector("form");

//capturing Submit button event
form.addEventListener("submit", submitInputs);

function submitInputs(e) {
  e.preventDefault();
  const fortunerName = document.querySelector("#fortunerName").value;
  console.log("Submit Inputs value: " + fortunerName); //gets logged in the browser console
  ipcRenderer.send("fortunerName:enroll", fortunerName);
}
