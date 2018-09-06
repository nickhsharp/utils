"use strict";

const TYP = require("./typ");

let _meta = {};
let _pretty = false;

function _log(label, data, meta) {
  let log = {
    label: label,
    ts: Date.now(),
    meta: meta,
  };

  if (data instanceof Error) {
    log.error = data;
    log.stack = data.stack;
    return console.error(stringify(log)); // return to early exit function
  }

  // see if it's already been stringified so we don't double-stringify
  // add as "input" property if it's just a regular old string
  if (typeof data === "string" || data instanceof String) {
    try {
      log.data = JSON.parse(data);
    } catch (e) {
      log.data = data;
    }
  } else {
    log.data = data;
  }

  console.log(stringify(log));
}

function init(meta, pretty = false) {
  _meta = meta;
  _pretty = pretty ? 2 : 0;
}

function wrap(obj) {
  let meta = Object.assign({}, _meta, obj);
  return {
    log: (label, data) => {
      _log(label, data, meta);
    }
  }
}

function log(label, data) {
  _log(label, data, _meta)
}

function stringify(obj) {
  let cache = new WeakMap();

  function replacer(key, obj) {
    key = key || "root";

    if(TYP.isArray(obj) || TYP.isObject(obj)) {
      if(cache.has(obj)) {
        return `[Circular - ${cache.get(obj)}]`;
      } else {
        cache.set(obj, key);
        return obj;
      }
    } 
    return obj;
  }

  let ret = JSON.stringify(obj, replacer, _pretty);

  cache = null;
  return ret;
}

module.exports = {
  log: log,
  init: init,
  wrap: wrap,
  stringify: stringify,
};

//END