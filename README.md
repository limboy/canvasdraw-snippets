### What's this?
this repo contains snippets which can be used in [canvasdraw](https://canvasdraw.limboy.me/), and some utilities to ease the process.

[click here](https://github.com/limboy/canvasdraw) to know more about canvasdraw.

### Install and Usage
run `npm install` to install required dependencies. all available commands are in `package.json`.

- `npm run serve` preview script result, useful when in dev mode.
- `npm run pub snippet-name.js` publish this snippet, will return a viewable url.
- `npm run cns` create new snippet. will create a new snippet with default content under `snippets` dir.
- `npm run grm` generate readme for snippets. will create a `README.md` under `snippets` dir, snippets not start with `_` will be published.