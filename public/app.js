const socket = io(window.CHAT_SERVER_URL || location.origin);
let username = "";
let pc = null;
let localStream = null;
let inCall = false;

const $ = id => document.getElementById(id);
const loginBox = $("login"), app = $("app"), ring = $("ring");

async function auth(url) {
  const usernameInput = $("user").value.trim();
  const password = $("pass").value;
  const r = await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:usernameInput,password})});
  const d = await r.json();
  if(!r.ok) throw new Error(d.error);
  username = d.username;
  loginBox.classList.add("hidden"); app.classList.remove("hidden"); $("me").textContent = "@" + username;
  socket.emit("login", username);
}

$("loginBtn").onclick = async()=>{try{await auth("/api/login")}catch(e){$("loginMsg").textContent=e.message}};
$("registerBtn").onclick = async()=>{try{await auth("/api/register")}catch(e){$("loginMsg").textContent=e.message}};

$("form").onsubmit = e => {
  e.preventDefault();
  const v=$("msg").value.trim(); if(!v)return;
  socket.emit("message",v); $("msg").value="";
};

socket.on("message",m=>{
  const div=document.createElement("div"); div.className="message";
  div.innerHTML=`<b>${escapeHtml(m.username)}</b> <span>${escapeHtml(m.text)}</span>`;
  $("messages").appendChild(div); $("messages").scrollTop=$("messages").scrollHeight;
});
socket.on("presence", list=>{
  $("online").innerHTML="";
  list.forEach(u=>{const d=document.createElement("div");d.textContent="🟢 "+u;$("online").appendChild(d)});
});

function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}

$("callBtn").onclick=()=>startCall();

async function getMic(){
  return navigator.mediaDevices.getUserMedia({audio:true,video:false});
}
async function makePC(){
  pc=new RTCPeerConnection({iceServers:[{urls:"stun:stun.l.google.com:19302"}]});
  pc.onicecandidate=e=>{if(e.candidate)socket.emit("webrtc:ice",{candidate:e.candidate})};
  pc.ontrack=e=>{
    let audio=document.getElementById("remoteAudio");
    if(!audio){audio=document.createElement("audio");audio.id="remoteAudio";audio.autoplay=true;document.body.appendChild(audio)}
    audio.srcObject=e.streams[0];
  };
  localStream=await getMic();
  localStream.getTracks().forEach(t=>pc.addTrack(t,localStream));
}
async function startCall(){
  if(inCall)return;
  inCall=true; showCall("Ligando...", "Você iniciou uma chamada.", false);
  await makePC();
  const offer=await pc.createOffer(); await pc.setLocalDescription(offer);
  socket.emit("call:invite"); socket.emit("webrtc:offer",{offer});
}
socket.on("call:incoming",d=>{
  showCall("Chamada recebida",`${d.from} está ligando...`,true); ring.currentTime=0; ring.play().catch(()=>{});
});
socket.on("call:accepted",()=>{$("callStatus").textContent="Chamada conectada.";});
socket.on("webrtc:offer",async({offer})=>{
  if(inCall)return;
  inCall=true; ring.pause();
  await makePC(); await pc.setRemoteDescription(offer);
  const answer=await pc.createAnswer(); await pc.setLocalDescription(answer);
  socket.emit("webrtc:answer", {answer});
});
socket.on("webrtc:answer",async({answer})=>{
  if(pc) await pc.setRemoteDescription(answer);
});
socket.on("webrtc:ice",async({candidate})=>{
  if(pc && candidate) try{await pc.addIceCandidate(candidate)}catch{}
});
socket.on("call:ended",endCall);
$("accept").onclick=async()=>{
  ring.pause(); $("accept").classList.add("hidden"); $("reject").classList.add("hidden"); $("end").classList.remove("hidden");
  $("callStatus").textContent="Conectando...";
  socket.emit("call:accept");
};
$("reject").onclick=()=>{ring.pause();socket.emit("call:reject");hideCall()};
$("end").onclick=()=>{socket.emit("call:end");endCall()};

function showCall(title,status,incoming){
  $("callTitle").textContent=title;$("callStatus").textContent=status;
  $("callModal").classList.remove("hidden");
  $("accept").classList.toggle("hidden",!incoming);
  $("end").classList.toggle("hidden",incoming);
  $("reject").classList.toggle("hidden",!incoming);
}
function hideCall(){$("callModal").classList.add("hidden")}
function endCall(){
  ring.pause(); ring.currentTime=0;
  if(localStream)localStream.getTracks().forEach(t=>t.stop());
  if(pc){pc.close();pc=null}
  inCall=false;hideCall();
}
