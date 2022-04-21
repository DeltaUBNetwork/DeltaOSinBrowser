import Server from 'bare-server-node';
import http from 'http';
import nodeStatic from 'node-static';

const bare =  new Server('/bare/', '');
const serve = new nodeStatic.Server('public/');
const server = http.createServer();
 
 

server.on('request', (request, response) => {
    if (bare.route_request(request, response)) return true;
  
   
   
   
});

server.on('upgrade', (req, socket, head) => {
	if(bare.route_upgrade(req, socket, head))return;
	socket.end();
});


server.listen(443);
console.log('Listening on port 443')