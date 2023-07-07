import fs from 'fs';
import * as url from 'url';
import * as http from 'http';
import fetch from 'node-fetch';
const { createHash, } = await import('node:crypto');

const hostname = '127.0.0.1';
const port = 3851;
const COMMANDS = {
  "serve": "serve",
  "cns": "cns", // create new snippet
  "pub": "pub", // publish a snippet
  "grm": "grm", // generate readme in snippets dir
}

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const args = process.argv.slice(2);
const command = args[0];

const routes = {
  '/': (req, res) => {
    let snippets = fs.readdirSync("./snippets");
    snippets = snippets.map(filename => `<li><a href="https://canvasdraw.limboy.me/render/http://${hostname}:${port}/snippets?filename=${filename}">${filename}</a></li>`);
    let html = `
    <html>
      <style>
      html {
        max-width: 70ch;
        padding: 3em 1em;
        margin: auto;
        font-family: -apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif;
        font-size: 16px;
        line-height: 1.5;
      }
      ul {
        margin-bottom: 2em;
        padding-left: 2em;
        color: #1d1d1d;
        font-family: sans-serif;
      }
      a {
        text-decoration: none;
        color: rgb(9, 105, 218);
      }
      a:hover {
        text-decoration: underline;
      }
      </style>
      <ul>
      ${snippets.join('')}
      </ul>
    `

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.end(html);
  },
  '/snippets': (req, res) => {
    const { query } = url.parse(req.url, true);
    const filename = query.filename;
    const snippetPath = __dirname + "/snippets/" + filename;
    let snippetContent = '';
    try {
      snippetContent = fs.readFileSync(snippetPath, 'utf8');
    } catch (error) {
      console.error('Error reading file:', error);
      res.statusCode = 500;
    }

    res.setHeader('Content-Type', "text/javascript");
    res.setHeader('Access-Control-Allow-Origin', "*");
    res.end(snippetContent);
  },
  '/404': (req, res) => {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain');
    res.end('File not found.\n');
  }
};

const server = http.createServer((req, res) => {
  const pathname = url.parse(req.url).pathname;

  const routeHandler = routes[pathname];
  if (routeHandler) {
    routeHandler(req, res);
  } else {
    routes['/404'](req, res);
  }
});

const serve = () => {
  server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
  });
}

const createNewSnippet = () => {
  const template = `// just for code completion, will be removed when rendering
import { Canvas, Ellipse, Circle, Path, Polygon, Rect, TextItem } from 'yaoocanvas'

/**
 * @typedef {Object} Noise
 * @property {(x: number, y: number) => number} simplex2
 * @property {(x: number, y: number, z: number) => number} simplex3
 * @property {(x: number, y: number) => number} perlin2
 * @property {(x: number, y: number, z: number) => number} perlin3
 * @property {(val: number) => voide} seed
 */

/**
 * 
 * @param {Canvas} canvas 
 * @param {{query:string, frame:string}} payload 
 * @param {{get:(string) => string, set:(string, string)}} store 
 * @param {{noise:Noise}} util 
 */
function draw(canvas, payload, store, util) { 
}
  `
  const curDate = (new Date()).toISOString().split("T")[0].replaceAll("-", "");
  let suffix = "";
  while (true) {
    const snippetPath = __dirname + "/snippets/" + curDate + suffix + ".js";
    if (fs.existsSync(snippetPath)) {
      suffix = ".1";
    } else {
      fs.writeFileSync(snippetPath, template);
      break;
    }
  }
}

const publish = async (snippetName) => {
  const snippetPath = __dirname + "/snippets/" + snippetName;
  let snippetContent = "";
  try {
    snippetContent = fs.readFileSync(snippetPath, "utf-8");
  } catch (e) {
    console.log(e);
  }

  if (snippetContent) {
    const postUrl = "https://corsproxy.limboy.me/https://go.dev/_/share";
    const data = await fetch(postUrl, {
      method: "POST", body: snippetContent, headers: {
        "Origin": "https://go.dev"
      }
    })
    const snippetId = await data.text();
    const snippetUrl = "https://canvasdraw.limboy.me/render/" + snippetId
    console.log("✅ " + snippetUrl);

    return snippetUrl;
  }
}

const processSnippets = async () => {
  const parseResultFile = __dirname + "/snippets/.parse-result.json";
  const tobePublishedFiles = [];
  const files = fs.readdirSync(__dirname + "/snippets");
  let parseResult = {};
  let newParseResult = {};

  if (fs.existsSync(parseResultFile)) {
    const parseResultCnt = fs.readFileSync(parseResultFile, 'utf-8');
    parseResult = JSON.parse(parseResultCnt);
  }

  for await (const snippetFilename of files) {
    if (!snippetFilename.startsWith("_") && !snippetFilename.startsWith(".") && !snippetFilename.endsWith(".md")) {
      let shouldPublish = false;
      const content = fs.readFileSync(__dirname + "/snippets/" + snippetFilename, "utf-8");
      const contentHash = createHash('md5').update(content).digest("hex");
      let snippetInfo = {
        hash: contentHash,
        url: ""
      };

      if (!parseResult[snippetFilename]) {
        shouldPublish = true;
      } else {
        if (parseResult[snippetFilename]["hash"] !== contentHash) {
          shouldPublish = true;
        } else {
          snippetInfo = parseResult[snippetFilename];
        }
      }

      if (shouldPublish) {
        const snippetUrl = await publish(snippetFilename);
        snippetInfo = {
          hash: contentHash,
          url: snippetUrl
        }
      }
      newParseResult[snippetFilename] = snippetInfo;
    }
  }

  fs.writeFileSync(parseResultFile, JSON.stringify(newParseResult, null, 2));

  return newParseResult;
}

const generateSnippetsReadMe = async () => {
  const parseResult = await processSnippets();
  let result = '<pre>auto generated by command: npm run grm</pre>\n';
  for (const [snippetFilename, snippetInfo] of Object.entries(parseResult)) {
    let snippet = `\n### ${snippetFilename}\n`
    snippet += `[![](${snippetInfo["url"]}.png)](${snippetInfo["url"]})\n`;
    result += snippet;
  }
  const readmeFile = __dirname + "/snippets/README.md";
  fs.writeFileSync(readmeFile, result);
}

switch (command) {
  case COMMANDS.serve:
    serve();
    break;
  case COMMANDS.cns:
    createNewSnippet();
    break;
  case COMMANDS.grm:
    generateSnippetsReadMe();
    break;
  case COMMANDS.pub:
    if (args.length == 2) {
      const snippetName = args[1];
      await publish(snippetName);
    } else {
      console.log("usage: npm run pub snippet.js");
    }
}
