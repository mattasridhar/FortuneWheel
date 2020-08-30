const { ipcRenderer } = require("electron");
const fs = require("fs");

let fileName = "";
let participants = {};
let labels = [];
let labelsForReload = [];
let winnerName = "";

let degree = 0;
let velocity = 0;
let velocityReduction = 0;
let hasHalted = false;
let lock = false;
let hasSpun = false;
let indexShown = -1;
let stepCounter = 0;
let showTutorial = false;

let colorPalette = [];
let colorPaletteForReload = [];
let pies = 1;
let pieSlice = 360 / pies;
const context = canvas.getContext("2d");
const width = canvas.width;
const center = width / 2;

const ul = document.getElementById("list");
const content = document.getElementById("content");
const loadDiv = document.getElementById("loadDiv");
const reloadDiv = document.getElementById("reloadDiv");
const tutorialDiv = document.getElementById("tutorial");
const tutorialTextDiv = document.getElementById("tutorialText");
const tutorialGifDiv = document.getElementById("tutorialGif");
const spinDiv = document.getElementById("spinDiv");
const winnerDiv = document.getElementById("winnerDiv");
const winnerNameDiv = document.getElementById("winnerName");
const defaultWinner = `Awaiting to be SPUN! <img src="../assets/images/await.gif" style="width: 55px; height: 45px;"></img>`;
const tutorialSteps = {
  step0:
    "File Menu Options: \n\nClick on the 'File' Menu for options such as FullScreen, Reload of the Application or to Quit the Application. \nYou can use the respective shortcuts as well [Cmd+F / Ctrl+F, Cmd+R / Ctrl+R, Cmd+Q / Ctrl+Q] respectively.",
  step1:
    "Load and Play: \n\nClick on the '+' icon and select only JSON file to upload. \nClick on 'SPIN' button to rotate the Wheel, \nDouble Click on the List item to remove it from the Wheel. \n\nOn each spin, find the Winner highlighted above.",
  step2:
    "Enrolling new Fortuners: \n\nClick on 'Actions' tab and navigate to 'Enroll Fortuners' or use the Shortcut 'Option+E / Alt+E' for enrolling a new fortuner. \nIn the dialog box, Provide the name of the new Fortuner. \n[Optional] You may choose to add the new Fortuner into your DataFile. \n[Optional] You may choose a specific color be assigned to the new Fortuner. \nClick on the 'Enroll Fortuner' button.",
  step3:
    "Clearing the screen: \n\nClick on 'Actions' tab and navigate to 'Clear Fortuners' or use the Shortcut 'Option+C / Alt+C' for clearing the screen.",
  step4:
    "Reload and Play again: \n\nOnce all the fortuners have won, click on the 'Reload Fortuners' button below the Wheel to Reload the player information and Spin again!",
};
const tutorialGifs = {
  step0: "../assets/images/FileMenu.gif",
  step1: "../assets/images/loadFile.gif",
  step2: "../assets/images/enroll.gif",
  step3: "../assets/images/clearScreen.gif",
  step4: "../assets/images/reloadData.gif",
};

tutorialDiv.setAttribute("hidden", "hidden");
reloadDiv.setAttribute("hidden", "hidden");

// Tutorial handlers
document.getElementById("tutorialBtn").addEventListener("click", () => {
  showTutorial = !showTutorial;
  if (showTutorial) {
    tutorialDiv.removeAttribute("hidden");
    loadDiv.setAttribute("hidden", "hidden");
    winnerDiv.setAttribute("hidden", "hidden");
    content.setAttribute("hidden", "hidden");
    tutorialTextDiv.innerText = tutorialSteps["step0"];
    tutorialGifDiv.src = tutorialGifs["step0"];
  } else {
    finishTutorial();
  }
});

document.getElementById("skip").addEventListener("click", () => {
  finishTutorial();
});

document.getElementById("next").addEventListener("click", () => {
  stepCounter += 1;
  if (stepCounter === 5) {
    finishTutorial();
  }
  tutorialTextDiv.innerText = tutorialSteps[`step${stepCounter}`];
  tutorialGifDiv.src = tutorialGifs[`step${stepCounter}`];
});

// Change the UI when tutorial is skipped or is completed
const finishTutorial = () => {
  tutorialDiv.setAttribute("hidden", "hidden");
  loadDiv.removeAttribute("hidden");
  winnerDiv.removeAttribute("hidden");
  content.setAttribute("hidden", "hidden");
  stepCounter = 0;
  clearCanvas();
};

// Receive the fortuner's Name that are sent by the main.js which it received from EnrollHandler.js
ipcRenderer.on("fortunerName:enroll", (e, input) => {
  const jsonInput = JSON.parse(input);
  if (
    jsonInput.shouldSave &&
    fileName.length !== 0 &&
    !Object.keys(participants).includes(jsonInput.name)
  ) {
    participants[jsonInput.name] = jsonInput.color;
    fs.writeFileSync(fileName, JSON.stringify(participants));
    clearCanvas();
    readJson(fileName);
  } else if (!Object.keys(participants).includes(jsonInput.name)) {
    labels.push(jsonInput.name);
    colorPalette.push(jsonInput.color);
    loadFortuners(jsonInput.name);
  }

  renderFortuneWheel();
  spinDiv.removeAttribute("hidden");
});

// Create the List Item card and load with Fortuners names
const loadFortuners = (fortuners) => {
  content.removeAttribute("hidden");
  ul.className = "collection with-header";
  const li = document.createElement("li");
  li.className = "collection-item";
  li.setAttribute("id", "listItem");
  li.style.backgroundColor = "#ee6d72";
  const fortunerNameText = document.createTextNode(fortuners);
  li.appendChild(fortunerNameText);
  ul.appendChild(li);
};

// Clear the items by receiving the 'clearContents' signal sent by the main.js
ipcRenderer.on("clearContents", () => {
  clearCanvas();
});

const clearCanvas = () => {
  // Clearing the contents
  while (labels.length > 0) {
    labels.pop();
    colorPalette.pop();
  }
  while (labelsForReload.length > 0) {
    labelsForReload.pop();
    colorPaletteForReload.pop();
  }

  hasHalted = false;
  lock = false;
  hasSpun = false;
  indexShown = -1;
  ul.innerHTML = ""; //clearing the list that was populated earlier
  winnerNameDiv.innerHTML = `${defaultWinner}`;
  loadDiv.removeAttribute("hidden");
  content.setAttribute("hidden", "hidden");
};

// Handle double click of list item to disable and remove it from wheel
ul.addEventListener("dblclick", (e) => {
  const dblClickedItem = e.target.innerHTML.toString();
  const dblClickedColor = e.target.style.backgroundColor.toString();
  const dblClickedIndex = labels.indexOf(dblClickedItem);
  dblClickedColor === "rgb(238, 109, 114)"
    ? (e.target.style.backgroundColor = "#546d7a")
    : (e.target.style.backgroundColor = "#ee6d72");

  if (dblClickedIndex > -1) {
    indexShown = -1;
    hasHalted = false;
    hasSpun = false;
    labels.splice(dblClickedIndex, 1);
    colorPalette.splice(dblClickedIndex, 1);
    if (labels.length === 0) {
      renderAllClearWheel();
    }
    renderFortuneWheel();
  }
});

// Open the File selection window and read the file. If not JSON then show Error Window
loadDiv.addEventListener("click", (e) => {
  e.preventDefault();
  // Opening the window for loading the JSON file
  var input = document.createElement("input");
  input.type = "file";

  input.onchange = (e) => {
    var file = e.target.files[0];
    filePath = file.path;
    fileName = file.name;
    if (file.type === "application/json") {
      readJson(file.name);
      spinDiv.removeAttribute("hidden");
    }
  };

  input.click();
});

// handler to reload the imported data
reloadDiv.addEventListener("mousedown", () => {
  // Clean everything if file has never been read
  if (labelsForReload.length === 0) {
    winnerNameDiv.innerHTML = `${defaultWinner}`;
    loadDiv.removeAttribute("hidden");
    content.setAttribute("hidden", "hidden");
  }
  // Clearing the contents
  while (labels.length > 0) {
    labels.pop();
    colorPalette.pop();
  }
  indexShown = -1;
  hasHalted = false;
  lock = false;
  hasSpun = false;
  labels = [...labelsForReload];
  colorPalette = [...colorPaletteForReload];
  renderFortuneWheel();
  ul.innerHTML = "";
  for (var key of Object.keys(participants)) {
    loadFortuners(key);
  }
  spinDiv.removeAttribute("hidden");
  reloadDiv.setAttribute("hidden", "hidden");
  winnerNameDiv.innerHTML = `${defaultWinner}`;
});

// Handle Spin Button functionality
document.getElementById("spin").addEventListener(
  "click",
  () => {
    hasHalted = false;
    hasSpun = true;
    if (labels.length === 1) {
      renderAllClearWheel();
    }
    renderFortuneWheel();
  },
  false
);

// Create a All Cleared Wheel and show the Reload Button
const renderAllClearWheel = () => {
  indexShown = -1;
  hasSpun = false;
  labels = ["All Clear!"];
  colorPalette = ["#f74040"];
  reloadDiv.removeAttribute("hidden");
  spinDiv.setAttribute("hidden", "hidden");
  winnerNameDiv.innerHTML = `${defaultWinner}`;
};

// Read the JSON file
const readJson = (file) => {
  let rawdata = fs.readFileSync(file);
  participants = JSON.parse(rawdata);
  for (var key of Object.keys(participants)) {
    loadFortuners(key);
    labels.push(key);
    labelsForReload.push(key);
    colorPalette.push(participants[key]);
    colorPaletteForReload.push(participants[key]);
    renderFortuneWheel();
  }
  loadDiv.setAttribute("hidden", "hidden");
};

// Create the Fortune wheel with Names
const renderFortuneWheel = () => {
  if (indexShown > -1) {
    labels.splice(indexShown, 1);
    colorPalette.splice(indexShown, 1);
  }
  degree = randomize(0, 360);
  pies = colorPalette.length;
  pieSlice = 360 / pies;
  rotationAnimation();
  setTimeout(() => {
    hasHalted = true;
  }, 1000);
};

// Get a Random Value for the Wheel
const randomize = (min, max) => {
  return Math.random() * (max - min) + min;
};

const convertDegreeToRadians = (degreeValue) => {
  return (degreeValue * Math.PI) / 180;
};

// Create the Pie piece for the Wheel
const createPie = (degreeValue, color) => {
  context.beginPath();
  context.fillStyle = color;
  context.moveTo(center, center);
  context.arc(
    center,
    center,
    width / 2,
    convertDegreeToRadians(degreeValue),
    convertDegreeToRadians(degreeValue + pieSlice)
  );
  context.lineTo(center, center);
  context.fill();
};

// set the name of each fortuner into the wheel
const setName = (degreeValue, name) => {
  if (!name) name = "All Clear!";
  context.save();
  context.translate(center, center);
  context.rotate(convertDegreeToRadians(degreeValue));
  context.textAlign = "center";
  context.fillStyle = "#fff";
  context.font = "italic 30px sans-serif";
  context.fillText(name, 130, 10);
  context.restore();
};

// creates the Fortune wheel UI
const createWheel = () => {
  context.clearRect(0, 0, width, width);
  for (var i = 0; i < pies; i++) {
    createPie(degree, colorPalette[i]);
    setName(degree + pieSlice / 2, labels[i]);
    degree += pieSlice;
  }
};

// creates the rotation animation of the wheel
const rotationAnimation = () => {
  degree += velocity;
  degree %= 360;

  // Increase Velocity if its not time to stop
  if (!hasHalted && velocity < 3) {
    velocity = velocity + 1 * 0.1;
  }

  // Reduce velocity after timeout and bring to halt
  if (hasHalted) {
    if (!lock) {
      lock = true;
      velocityReduction = randomize(0.95, 0.998);
    }
    velocity = velocity > 0.2 ? (velocity *= velocityReduction) : 0;
  }

  // Upon halting, Show the value and remove from wheel for next iteration
  if (lock && !velocity && hasSpun) {
    let labelsIndex = Math.floor(((360 - degree + 90) % 360) / pieSlice);
    labelsIndex = (pies + labelsIndex) % pies; // Handling ArrayOutOfIndex probs when checking below 0 and above array size locations
    winnerName = labels[labelsIndex];
    if (winnerName) {
      winnerNameDiv.innerHTML = `<img src="../assets/images/celebLeft.png" style="width: 55px; height: 45px;"></img> 
    ${winnerName.toUpperCase()} 
    <img src="../assets/images/celebRight.png" style="width: 55px; height: 45px;"></img>`;
      indexShown = labelsIndex;
    } else {
      winnerNameDiv.innerHTML = `${defaultWinner}`;
    }
  }

  createWheel();
  window.requestAnimationFrame(rotationAnimation);
};
