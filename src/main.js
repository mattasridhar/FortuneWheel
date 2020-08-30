const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const path = require("path");
const url = require("url");

let windowObj, dialogWindow;

// Render when ready
app.on("ready", () => {
  windowObj = new BrowserWindow(startUpWindowParams);

  // Load the mainMenu
  loadMainMenu(Menu);

  // Load the StartUpWindow
  loadWindow(windowObj, "index");

  // Close the Window
  closeWindow(windowObj);

  // Terminate all open windows on quit
  windowObj.on("closed", () => {
    app.quit();
  });
});

// capture the fortunerName sent by the ipcRenderer from the EnrollHandler.js
ipcMain.on("BtnType", (e, type) => {
  console.log("fBtnType: " + type); //gets logged in the Terminal Console
});

// capture the fortunerName sent by the ipcRenderer from the EnrollHandler.js
ipcMain.on("fortunerName:enroll", (e, fortuner) => {
  console.log("fortunerName from DialogWindow: " + fortuner); //gets logged in the Terminal Console
  windowObj.webContents.send("fortunerName:enroll", fortuner);
  dialogWindow.close();
});

//Load the contents of the tabs of the Main Menu
const loadMainMenu = (menu) => {
  const mainMenu = menu.buildFromTemplate(mainMenuTabs);
  menu.setApplicationMenu(mainMenu);
};

//Garbage collector
const closeWindow = (currentWindow) => {
  currentWindow.on("closed", () => {
    currentWindow = null;
  });
};

//Load html page into this start-up window
const loadWindow = (currentWindow, htmlResource) => {
  //below statement creates a URL for the file as 'file://dirname/index.html' where the '//'is coming from 'slashes: true', 'file:' is from protocol and 'dirname' is the current directory received from '__dirname'
  currentWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "/../windows/" + htmlResource + ".html"),
      protocol: "file:",
      slashes: true,
    })
  );
};

// load the dialog window for providing inputs to be sorted
const openEnrollDialog = (dialogWindow) => {
  loadWindow(dialogWindow, "dialogWindow");
  closeWindow(dialogWindow);
};

const startUpWindowParams = {
  webPreferences: {
    nodeIntegration: true, //to make the require in other JS pages work
  },
  title: "Fortune Wheel",
  titleBarStyle: "visible",
  width: 1280,
  height: 800,
  backgroundColor: "#e8f2fc",
  show: true,
  icon: path.join(__dirname, "favicon.ico"),
};

const enrollDialogParams = {
  webPreferences: {
    nodeIntegration: true,
  },
  title: "Enroll Fortuners",
  titleBarStyle: "hidden", //Hides the top bar in the Window
  width: 500,
  height: 400,
  backgroundColor: "#e8f2fc",
  show: true,
  icon: path.join(__dirname, "favicon.ico"),
};

// template for the Main MENU tabs
const mainMenuTabs = [
  {
    label: "File",
    submenu: [
      {
        label: "Toggle Full Screen",
        accelerator: process.platform === "darwin" ? "Cmd + F" : "Ctrl + F",
        role: "toggleFullScreen",
      },
      {
        label: "Reload",
        accelerator: process.platform === "darwin" ? "Cmd + R" : "Ctrl + R",
        role: "reload",
      },
      {
        label: "Quit Application",
        accelerator: process.platform === "darwin" ? "Cmd + Q" : "Ctrl + Q",
        role: "quit",
      },
    ],
  },
  {
    label: "Actions",
    submenu: [
      {
        label: "Enroll Fortuners",
        accelerator: process.platform === "darwin" ? "Option + E" : "Alt + E",
        click() {
          //create enroll dialog window
          dialogWindow = new BrowserWindow(enrollDialogParams);
          openEnrollDialog(dialogWindow);
        },
      },
      {
        label: "Clear Fortuners",
        accelerator: process.platform === "darwin" ? "Option + C" : "Alt + C",
        click() {
          //clear the contents of mainWindow
          windowObj.webContents.send("clearContents");
        },
      },
    ],
  },
];

//For MAC as it populates the File Menu under the 'Electron' Tab
if (process.platform === "darwin") {
  mainMenuTabs.unshift({
    label: "",
  });
}

//show developer tools only when on dev mode
if (process.env.NODE_ENV !== "production") {
  mainMenuTabs.push({
    label: "Developer Tools",
    submenu: [
      {
        label: "Toggle DevTools",
        accelerator: process.platform === "darwin" ? "F12" : "F12",
        role: "toggleDevTools", //Another style of doing what we are doing above..
      },
    ],
  });
}
