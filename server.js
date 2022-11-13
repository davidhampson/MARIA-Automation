const http = require('http');
const fs   = require('fs');


const hostname = '127.0.0.1';

const port = 3000;


const server = http.createServer(function(req, res) {

  console.log(req.baseURL);
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');
  fs.createReadStream('index.html').pipe(res)

});


server.listen(port, hostname, function() {

  console.log('Server running at http://'+ hostname + ':' + port + '/');

});
