const express = require("express");
const http = require("http");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;
const DATA = path.join(__dirname, "users.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let users = fs.existsSync(DATA) ? JSON.parse(fs.readFileSync(DATA, "utf8")) : {};
function saveUsers(){ fs.writeFileSync(DATA, JSON.stringify(users,null,2)); }
function hash(s){ return crypto.createHash("sha256").update(s).digest("hex"); }

app.post("/api/register",(req,res)=>{
  const username=String(req.body.username||"").trim();
  const password=String(req.body.password||"");
  if(!/^[a-zA-Z0-9_]{3,20}$/.test(username))
    return res.status(400).json({error:"O usuário deve ter de 3 a 20 caracteres e usar apenas letras, números ou _."});
  if(password.length<4) return res.status(400).json({error:"A senha precisa ter pelo menos 4 caracteres."});
  if(users[username]) return res.status(409).json({error:"Esse usuário já existe."});
  users[username]={password:hash(password),avatar:"",banner:"",description:""}; saveUsers();
  res.json({ok:true,username});
});

app.post("/api/login",(req,res)=>{
  const username=String(req.body.username||"").trim();
  const password=String(req.body.password||"");
  if(!users[username] || users[username].password!==hash(password))
    return res.status(401).json({error:"Usuário ou senha incorretos."});
  res.json({ok:true,username});
});

function safeProfile(username){const u=users[username];return {username,avatar:u?.avatar||"",banner:u?.banner||"",description:u?.description||""};}
app.get("/api/profile/:username",(req,res)=>{const username=String(req.params.username||"");if(!users[username])return res.status(404).json({error:"Usuário não encontrado."});res.json(safeProfile(username));});
app.put("/api/profile",(req,res)=>{const username=String(req.body.username||req.headers["x-username"]||"").trim();if(!users[username])return res.status(401).json({error:"Usuário não encontrado."});const avatar=String(req.body.avatar||"");const banner=String(req.body.banner||"");const description=String(req.body.description||"").slice(0,160);if(avatar && !/^data:image\/(png|jpeg|webp);base64,/.test(avatar))return res.status(400).json({error:"Foto inválida."});if(banner && !/^data:image\/(png|jpeg|webp);base64,/.test(banner))return res.status(400).json({error:"Banner inválido."});if(avatar.length>3000000||banner.length>3000000)return res.status(400).json({error:"Imagem muito grande."});users[username]={...users[username],avatar,banner,description};saveUsers();res.json(safeProfile(username));});
const online=new Map();
io.on("connection",socket=>{
  socket.on("login",username=>{
    online.set(socket.id,username); socket.join("chat");
    io.to("chat").emit("presence",[...online.values()]);
  });
  socket.on("message",text=>{
    const username=online.get(socket.id); if(!username)return;
    text=String(text||"").trim().slice(0,500);
    if(text)io.to("chat").emit("message",{username,text,time:Date.now()});
  });
  socket.on("call:request",({toUser})=>{const from=online.get(socket.id);if(!from)return;for(const [sid,u] of online){if(u===toUser)io.to(sid).emit("call:request",{from});}});
  socket.on("call:ready",({to})=>{if(to)io.to(to).emit("call:ready",{from:socket.id});});
  socket.on("webrtc:offer",data=>{if(data?.to)io.to(data.to).emit("webrtc:offer",{...data,from:socket.id});});
  socket.on("webrtc:answer",data=>{if(data?.to)io.to(data.to).emit("webrtc:answer",{...data,from:socket.id});});
  socket.on("webrtc:ice",data=>{if(data?.to)io.to(data.to).emit("webrtc:ice",{...data,from:socket.id});});
  socket.on("call:end",()=>socket.broadcast.to("chat").emit("call:end"));
  socket.on("disconnect",()=>{online.delete(socket.id);io.to("chat").emit("presence",[...online.values()]);});
});

function startServer(port=PORT, host=process.env.HOST || "0.0.0.0"){
  return new Promise((resolve,reject)=>{
    const onError=e=>{server.off("listening",onListening);reject(e)};
    const onListening=()=>{server.off("error",onError);resolve(server)};
    server.once("error",onError);
    server.once("listening",onListening);
    server.listen(port,host);
  });
}

if(require.main===module){
  startServer().then(()=>console.log(`Amigos Chat iniciado na porta ${PORT}`))
    .catch(err=>{console.error(err);process.exit(1)});
}
module.exports={startServer};
