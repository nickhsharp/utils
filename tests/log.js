"use strict";

const ava = require("ava");
const sinon = require("sinon");
const {test, } = ava;

const LOG = require("../lib/log.js");

test.beforeEach((t) => {
  t.context.log = console.log;

  console.log = sinon.spy();
});

test.afterEach((t) => {
  console.log = t.context.log;
});

test("LOG has four functions", t => {
  t.is(typeof LOG.log, "function");
  t.is(typeof LOG.stringify, "function");
  t.is(typeof LOG.init, "function");
  t.is(typeof LOG.wrap, "function");
});

test("LOG.init sets a global set of meta data for each log", t => {
  const now = new Date();
  const clock = sinon.useFakeTimers(now.getTime());
  
  LOG.init({
    foo: "bar"
  });

  LOG.log("test", "test");

  t.is(console.log.getCalls()[0].args[0], `{"label":"test","ts":${now.getTime()},"meta":{"foo":"bar"},"data":"test"}`);

  clock.restore();
});

test("LOG.init controls pretty print of output", t => {
  const now = new Date();
  const clock = sinon.useFakeTimers(now.getTime());
  
  LOG.init({
    foo: "bar"
  }, null, true);

  LOG.log("test", "test");

  t.is(console.log.getCalls()[0].args[0], `{
  "label": "test",
  "ts": ${now.getTime()},
  "meta": {
    "foo": "bar"
  },
  "data": "test"
}`);

  clock.restore();
});

test("LOG.wrap gives you a log function that has meta added onto it on top of init", t => {
  const now = new Date();
  const clock = sinon.useFakeTimers(now.getTime());
  
  LOG.init({
    foo: "bar"
  }, null, true);

  LOG.log("test", "test");
  t.is(console.log.getCalls()[0].args[0], `{
  "label": "test",
  "ts": ${now.getTime()},
  "meta": {
    "foo": "bar"
  },
  "data": "test"
}`);

  let logger = LOG.wrap({
    buz: "ber"
  });

  logger.log("test", "test");

  t.is(console.log.getCalls()[1].args[0], `{
  "label": "test",
  "ts": ${now.getTime()},
  "meta": {
    "foo": "bar",
    "buz": "ber"
  },
  "level": "LOG",
  "data": "test"
}`);

  clock.restore();
});

test("LOG.wrap gives you a fun simple log level shit", t => {
  const now = new Date();
  const clock = sinon.useFakeTimers(now.getTime());
  
  LOG.init({
    foo: "bar"
  }, null, true);

  let logger = LOG.wrap({
    buz: "ber"
  }, "WARN");

  logger.log("test", "test");

  t.is(console.log.getCalls()[0].args[0], `{
  "label": "test",
  "ts": ${now.getTime()},
  "meta": {
    "foo": "bar",
    "buz": "ber"
  },
  "level": "LOG",
  "data": "test"
}`);

  logger.warn("test", "test");
  t.is(console.log.getCalls()[1].args[0], `{
  "label": "test",
  "ts": ${now.getTime()},
  "meta": {
    "foo": "bar",
    "buz": "ber"
  },
  "level": "WARN",
  "data": "test"
}`);

  logger.info("test", "test");
  t.is(console.log.getCalls().length, 2);

  clock.restore();
});

test("LOG.stringify is a safe stringify for circular madness", t => {
  LOG.init({}, null, true);

  let circularObj = {};
  circularObj.circularRef = circularObj;
  circularObj.list = [ circularObj, circularObj ];

  let json = LOG.stringify(circularObj);

  t.is(json, `{
  "circularRef": "[Circular - root]",
  "list": [
    "[Circular - root]",
    "[Circular - root]"
  ]
}`)
});

test("LOG.stringify is a safe stringify for circular madness", t => {
  LOG.init({}, null, true);

  let circularObj = {};
  circularObj.circularRef = circularObj;
  circularObj.list = [ true, circularObj ];
  circularObj.other = {
    herp: "derp"
  }
  circularObj.more = {
    herp: circularObj
  }

  let json = LOG.stringify(circularObj);

  t.is(json, `{
  "circularRef": "[Circular - root]",
  "list": [
    true,
    "[Circular - root]"
  ],
  "other": {
    "herp": "derp"
  },
  "more": {
    "herp": "[Circular - root]"
  }
}`)
});

test("LOG.stringify is a safe stringify for circular madness", t => {
  LOG.init({}, null, true);

  let circularObj = {};
  circularObj.circularRef = circularObj;
  circularObj.list = [ circularObj, circularObj ];

  let otherObj = {};
  otherObj.circularReg = otherObj;
  circularObj.otherObj = otherObj;

  let json = LOG.stringify(circularObj);

  t.is(json, `{
  "circularRef": "[Circular - root]",
  "list": [
    "[Circular - root]",
    "[Circular - root]"
  ],
  "otherObj": {
    "circularReg": "[Circular - otherObj]"
  }
}`)
});

test("LOG.stringify is a safe stringify for circular madness", t => {
  LOG.init({}, null, true);

  let circularObj = {};
  circularObj.circularRef = circularObj;
  circularObj.list = [ circularObj, circularObj ];

  let otherObj = {};
  otherObj.circularReg = otherObj;
  circularObj.test = {
    otherObj: otherObj
  }

  let json = LOG.stringify(circularObj);

  t.is(json, `{
  "circularRef": "[Circular - root]",
  "list": [
    "[Circular - root]",
    "[Circular - root]"
  ],
  "test": {
    "otherObj": {
      "circularReg": "[Circular - otherObj]"
    }
  }
}`)
});


