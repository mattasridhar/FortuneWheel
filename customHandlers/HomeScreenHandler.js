const { ipcRenderer } = require("electron");
const fs = require("fs");

let filePath = "";
let participants = {};
let labels = [];

// let labels = labels;
let degree = 0;
let velocity = 0;
let velocityReduction = 0;
let hasHalted = false;
let lock = false;

let colorPalette = [];
/* [
  "#fbc",
  "#f88",
  "#fbc",
  "#f88",
  "#fbc",
  "#f88",
  "#fbc",
  "#f67",
  "#fbc",
]; */
let pies = 1;
let pieSlice = 360 / pies;
const context = canvas.getContext("2d");
const width = canvas.width;
const center = width / 2;

const ul = document.getElementById("list");
const content = document.getElementById("content");
document.getElementById("tutorial").setAttribute("hidden", "hidden");

// Receive the fortuner's Name that are sent by the main.js which it received from EnrollHandler.js
ipcRenderer.on("fortunerName:enroll", (e, inputs) => {
  loadFortuners(inputs);
});

const loadFortuners = (fortuners) => {
  content.removeAttribute("hidden");
  ul.className = "collection with-header";
  console.log("HSH fortunerName: ", fortuners);
  const li = document.createElement("li");
  li.className = "collection-item";
  const fortunerNameText = document.createTextNode(fortuners);
  li.appendChild(fortunerNameText);
  ul.appendChild(li);
};

// Clear the items by receiving the 'clearContents' signal sent by the main.js
ipcRenderer.on("clearContents", function () {
  clearCanvas();
});

clearCanvas = function () {
  ul.innerHTML = ""; //clearing the list that was populated earlier
};

document.getElementById("enrollBtn").addEventListener("click", function (e) {
  e.preventDefault();
  console.log("Enrol clicked");
  document.getElementById("tutorial").removeAttribute("hidden");
});

document.getElementById("loadDiv").addEventListener("click", function (e) {
  e.preventDefault();
  console.log("LoadBtn clicked");
  // Opening the window for loading the JSON file
  var input = document.createElement("input");
  input.type = "file";

  input.onchange = (e) => {
    var file = e.target.files[0];
    console.log("SRI filenem: ", file.type);
    filePath = file.path;
    if (file.type === "application/json") {
      readJson(file.name);
    }
  };

  input.click();
});

// Handle Spin Button functionality
document.getElementById("spin").addEventListener(
  "mousedown",
  function () {
    hasHalted = false;
    renderFortuneWheel();
  },
  false
);

// Read the JSON file
const readJson = (file) => {
  let rawdata = fs.readFileSync(file);
  participants = JSON.parse(rawdata);
  for (var key of Object.keys(participants)) {
    console.log(key + " -> " + participants[key]);
    loadFortuners(participants[key]);
    labels.push(key);
    colorPalette.push(participants[key]);
    renderFortuneWheel();
  }
  console.log(participants);
  document.getElementById("loadDiv").setAttribute("hidden", "hidden");
};

// Create the Fortune wheel with Names
const renderFortuneWheel = () => {
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
  if (lock && !velocity) {
    let labelsIndex = Math.floor(((360 - degree + 90) % 360) / pieSlice);
    labelsIndex = (pies + labelsIndex) % pies; // Handling ArrayOutOfIndex probs when checking below 0 and above array size locations
    return console.log("You got:\n" + labels[labelsIndex]);
  }

  createWheel();
  window.requestAnimationFrame(rotationAnimation);
};
