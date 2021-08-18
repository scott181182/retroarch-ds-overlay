const fs = require("fs").promises;
const http = require("http");
const path = require("path");



const mimeMap = {
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpg",
    ".wav": "audio/wav",
    ".html": "text/html",
    ".ico": "image/x-icon",
    ".mp3": "audio/mpeg",
    ".svg": "image/svg+xml",
    ".pdf": "application/pdf",
    ".doc": "application/msword"
};
function getContentType(filename) {
    const extname = path.extname(filename);
    return extname in mimeMap ? mimeMap[extname] : "text/plain";
}



const templates = [ "neo-retropad", "ds-retropad" ];
function getFilePath(reqUrl) {
    if(reqUrl.endsWith("/")) { reqUrl += "index.html"; }
    if(reqUrl.startsWith("/api/")) {
        const reqseg = reqUrl.slice(5);
        const tmpl = templates.find((t) => reqseg.startsWith(t + "/"));
        if(!tmpl) { return undefined; }

        return path.resolve(__dirname, "..", tmpl, reqseg.substring(tmpl.length + 1));
    } else {
        return path.join(__dirname, "public", reqUrl.substring(1));
    }
}



const reqHandlers = {
    "/api/templates": (_req, res) => {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(templates));
    }
}



function sendStatusMessage(res, status, message) {
    res.statusCode = status;
    res.end(message);
}
const server = http.createServer(async (req, res) => {
    console.log(`[${req.method}] ${req.url}`);
    if(req.url in reqHandlers) { return reqHandlers[req.url](req, res); }

    const filepath = getFilePath(req.url);
    console.log(`    -> ${filepath}`);
    if(!filepath) {
        return sendStatusMessage(res, 404, "File Not Found");
    }

    return fs.readFile(filepath)
        .then((filedata) => {
            const contentType = getContentType(filepath);
            res.writeHead(200, { "Content-Type": contentType });
            res.end(filedata);
        }).catch((err) => {
            if(err.code === "ENOENT") {
                sendStatusMessage(res, 404, "File Not Found");
            } else {
                console.error(err);
                sendStatusMessage(res, 500, "Internal Server Error");
            }
        });

});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}...`);
});


