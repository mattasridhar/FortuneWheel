const electron = require("electron");
const { ipcRenderer } = electron; //For sending values from this js page to the main.js page

const form = document.querySelector("form");
let selectedColor = "#b8a9c9";
let saveToFile = false;

//capturing Submit button event
form.addEventListener("submit", submitInputs);

document.getElementById("colorPicker").addEventListener("click", (e) => {
  selectedColor = e.target.id;
  const colorName = ntc.name(selectedColor)[1];
  document.getElementById(
    "colorName"
  ).innerText = `Selected Color: ${colorName}`;
});

document.getElementById("saveToFile").addEventListener("click", (e) => {
  saveToFile = e.target.checked;
});

function submitInputs(e) {
  e.preventDefault();
  const fortunerName = document.querySelector("#fortunerName").value;
  const jsonStr = JSON.stringify({
    name: fortunerName,
    color: selectedColor,
    shouldSave: saveToFile,
  });
  ipcRenderer.send("fortunerName:enroll", jsonStr);
}
