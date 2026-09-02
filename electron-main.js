const { app, BrowserWindow } = require("electron");
const REMOTE_URL = process.env.CHAT_SERVER_URL || "http://127.0.0.1:3000";
const { startServer } = require("./server");

let win;

async function createWindow(){
  try {
    if (!process.env.CHAT_SERVER_URL) await startServer(3000, "127.0.0.1");
    win = new BrowserWindow({
      width:1100,
      height:720,
      minWidth:800,
      minHeight:550,
      backgroundColor:"#17191f",
      autoHideMenuBar:true,
      webPreferences:{nodeIntegration:false,contextIsolation:true}
    });
    await win.loadURL(REMOTE_URL);
  } catch(err) {
    console.error("Erro ao iniciar o servidor:",err);
  }
}
app.whenReady().then(createWindow);
app.on("window-all-closed",()=>app.quit());
