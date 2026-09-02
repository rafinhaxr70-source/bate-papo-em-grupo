AMIGOS CHAT — COMO RODAR

1. Instale o Node.js (versão 18 ou superior).
2. Abra um terminal dentro desta pasta.
3. Rode:
   npm install
4. Depois:
   npm start
5. Abra no navegador:
   http://localhost:3000

IMPORTANTE:
- Para seus amigos acessarem pela internet, o app precisa ser colocado em um servidor/host.
- Em produção, recomenda-se HTTPS para o microfone funcionar corretamente.
- O WebRTC usa STUN para ajudar a conectar os usuários. Para redes mais restritivas, um servidor TURN pode ser necessário.
- O toque de chamada é o arquivo MP3 enviado pelo usuário.
