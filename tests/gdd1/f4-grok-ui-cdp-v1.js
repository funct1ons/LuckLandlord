'use strict';
const fs = require('fs');
const path = require('path');
const destHint = 'f4-grok-ui-v1';
if (process.argv[2] !== destHint) throw Error('pass argv ' + destHint + ' ; refusing default f4-ui-cdp-v1 overwrite');
const dest = path.join(__dirname, destHint + '-results.json');
if (fs.existsSync(dest)) throw Error('Refuse existing output ' + dest);
require('./f4-ui-cdp.js');
