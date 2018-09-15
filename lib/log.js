"use strict";

const TYP = require("./typ");

const DEFAULT_LEVEL = "WARN";
const LOG_LEVELS = {
  LOG: 5,
  TRACE: 4,
  DEBUG: 3,
  INFO: 2,
  WARN: 1,
  ERROR: 0,
};

let _meta = {};
let _pretty = false;
let _level = 5;

function _log(label, data, meta, level) {
  let log = {
    level: level,
    ts: Date.now(),
    label: label,
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

function init(meta, level = DEFAULT_LEVEL, pretty = false) {
  _meta = meta;
  _level = LOG_LEVELS[level] || LOG_LEVELS[DEFAULT_LEVEL];
  _pretty = pretty ? 2 : 0;

  return {
    log: log,
    wrap: wrap,
    stringify: stringify
  }
}

function wrap(obj = {}, level) {
  let attempted_level = LOG_LEVELS[level] || _level;
  const log_level = _level < attempted_level ? _level : attempted_level;
  const meta = Object.assign({}, _meta, obj);

  return {
    log: (label, data) => {
      _log(label, data, meta, "LOG");
    },
    trace: (label, data) => {
      if(log_level >= 4) {
        _log(label, data, meta, "TRACE");
      }
    },
    debug: (label, data) => {
      if(log_level >= 3) {
        _log(label, data, meta, "DEBUG");
      }
    },
    info: (label, data) => {
      if(log_level >= 2) {
        _log(label, data, meta, "INFO");
      }
    },
    warn: (label, data) => {
      if(log_level >= 1) {
        _log(label, data, meta, "WARN");
      }
    },
    error: (label, data) => {
      if(log_level >= 0) {
        _log(label, data, meta, "ERROR");
      }
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