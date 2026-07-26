const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 8082;
const DIST_DIR = path.join(__dirname, "dist");
const DIST_ROOT = path.resolve(DIST_DIR);

const mimeTypes = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
};

function isContainedPath(rootPath, candidatePath) {
  const relativePath = path.relative(rootPath, candidatePath);
  return (
    relativePath === "" ||
    (relativePath !== ".." &&
      !relativePath.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relativePath))
  );
}

const server = http.createServer((req, res) => {
  const rawPath = (req.url || "/").split(/[?#]/, 1)[0] || "/";
  let decodedPath;

  try {
    decodedPath = decodeURIComponent(rawPath);
  } catch {
    res.writeHead(400);
    res.end("Bad Request");
    return;
  }

  const relativeRequestPath = decodedPath.replace(/^[/\\]+/, "");
  let filePath = path.resolve(DIST_ROOT, relativeRequestPath || "index.html");

  if (!isContainedPath(DIST_ROOT, filePath)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  const extname = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[extname] || "application/octet-stream";

  fs.realpath(DIST_ROOT, (rootError, realRootPath) => {
    if (rootError) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }

    const readContainedFile = (
      candidatePath,
      candidateContentType,
      fallback,
    ) => {
      fs.realpath(candidatePath, (realPathError, realPath) => {
        if (realPathError) {
          if (realPathError.code === "ENOENT" && fallback) {
            readContainedFile(
              path.join(DIST_ROOT, "index.html"),
              "text/html",
              false,
            );
          } else {
            res.writeHead(realPathError.code === "ENOENT" ? 404 : 500);
            res.end(
              realPathError.code === "ENOENT" ? "Not Found" : "Server Error",
            );
          }
          return;
        }

        if (!isContainedPath(realRootPath, realPath)) {
          res.writeHead(403);
          res.end("Forbidden");
          return;
        }

        fs.readFile(realPath, (readError, content) => {
          if (readError) {
            res.writeHead(readError.code === "ENOENT" ? 404 : 500);
            res.end(readError.code === "ENOENT" ? "Not Found" : "Server Error");
            return;
          }

          res.writeHead(200, { "Content-Type": candidateContentType });
          res.end(content);
        });
      });
    };

    readContainedFile(filePath, contentType, true);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
