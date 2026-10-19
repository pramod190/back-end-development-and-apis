
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Keep PORT = 3001 as required by the project.
const PORT = 3001;

const server = http.createServer((req, res) => {
  fs.readFile(path.join(__dirname, 'public', 'index.html'), (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server });

wss.on('connection', (socket, req) => {
  const username = new URL(
    req.url,
    'http://localhost'
  ).searchParams.get('username');

  const broadcast = (message) => {
    const data = JSON.stringify(message);

    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(data);
      }
    });
  };

  broadcast({
    type: 'system',
    text: `${username} joined`
  });

  socket.on('message', (message) => {
    const { username, text } = JSON.parse(message.toString());

    broadcast({
      type: 'chat',
      username,
      text
    });
  });

  socket.on('close', () => {
    broadcast({
      type: 'system',
      text: `${username} left`
    });
  });
});

server.listen(PORT, () => {
  console.log('Chat server running at http://localhost:3001');
});
