const http = require('http');
let static = require('node-static');
let fileServer = new static.Server('.');
const path = require('path');
const fs = require('fs');

const hostname = '127.0.0.1';
const port = 3000;

http.createServer(accept).listen(port, hostname, () => {
  console.log(`Server listening at ${hostname}:${port}`);
});


function accept(req, res) {
  
  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', ['x-file-id', 'x-start-byte', 'x-file-size']);
    res.end("ok");

  } else if (req.url == '/status.html' && req.method !== 'OPTIONS') {
    onStatus(req, res);

  } else if (req.url == '/upload.html' && req.method == 'POST') {
    onUpload(req, res);

  } else {
    fileServer.serve(req, res);
  }
}

let uploads = Object.create(null);

function onStatus(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', ['x-file-id', 'x-start-byte', 'x-file-size']);



  let fileId = req.headers['x-file-id'];
  let upload = uploads[fileId];



  if (!upload) {
    res.end("0");
    return;
  } else {
    res.end(String(upload.bytesReceived));
    return;
  }
}

// -----------------------------------

function onUpload(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', ['x-file-id', 'x-start-byte', 'x-file-size']);

  let fileId = req.headers['x-file-id'];
  let startByte = parseInt(req.headers['x-start-byte']);


  if (!fileId) {
    res.writeHead(400, "No file id");
    res.end("no file id");
    return;
  }

  let filePath = path.resolve(__dirname, `./src/${fileId}`);

  if (!uploads[fileId]) uploads[fileId] = {};

  let upload = uploads[fileId];

  let fileStream;

  if (!startByte) {
    upload.bytesReceived = 0;
    fileStream = fs.createWriteStream(filePath, {
      flags: 'w'
    });

  } else {
    if (upload.bytesReceived != startByte) {
      res.writeHead(400, "Wrong start byte");
      res.end(upload.bytesReceived);
      return;
    }

    fileStream = fs.createWriteStream(filePath, {
      flags: 'a'
    });
  }

  req.on('data', function (data) {
    upload.bytesReceived += data.length;
  });

  req.pipe(fileStream);

  fileStream.on('close', function () {

    if (upload.bytesReceived == req.headers['x-file-size']) {
      delete uploads[fileId];
      res.end("Success " + upload.bytesReceived);
      return;

    } else {
      res.end();
      return;
    }
  });


  fileStream.on('error', function (err) {
    res.writeHead(500, "File error");
    res.end();
    return;
  });

}





