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
    ".html": "text/html"
};
function getContentType(filename) {
    const extname = path.extname(filename);
    return extname in mimeMap ? mimeMap[extname] : "text/plain";
}
function getFilePath(reqUrl) {
    if(reqUrl.endsWith("/")) { reqUrl += "index.html"; }
    if(reqUrl.startsWith("/api/")) {
        const reqseg = reqUrl.slice(5);
        if(reqseg.startsWith("neo-retropad/")) {
            return path.resolve(__dirname, "..", "neo-retropad", reqseg.substring(13));
        }
        return undefined;
    } else {
        return path.join(__dirname, "public", reqUrl.substring(1));
    }
}



function sendStatusMessage(res, status, message) {
    res.statusCode = status;
    res.end(message);
}
const server = http.createServer(async (req, res) => {
    console.log(`[${req.method}] ${req.url}`);
    const filepath = getFilePath(req.url);
    console.log(`    -> ${filepath}`);
    if(!filepath) {
        return sendStatusMessage(res, 404, "File Not Found");
    }

    return fs.readFile(filepath, "utf8")
        .then((filedata) => {
            const contentType = getContentType(filepath);
            res.writeHead(200, { "Content-Type": contentType });
            res.end(filedata, "utf8");
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


