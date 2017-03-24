'use strict';

const otp = require('../lib/otp');
const encrypt = require('../lib/enc');
const assert = require('assert');
const sinon = require('sinon');
const test = require('ava');
const fs = require('fs');

test.beforeEach(t => {
  t.context.privateKey = fs.readFileSync(`${__dirname}/keys/test_rsa`, {
    encoding: 'utf8',
  });

  t.context.publicKey = fs.readFileSync(`${__dirname}/keys/test_rsa.pub`, {
    encoding: 'utf8',
  });

  t.context.invalidPublicKey = fs.readFileSync(`${__dirname}/keys/invalid_rsa.pub`, {
    encoding: 'utf8',
  });

  process.env.NODE_ENV = 'test';
});

/*
 * Test TOTtoken using test vectors from TOTtoken RFcounter.
 *
 * see http://tools.ietf.org/id/draft-mraihi-totp-timebased-06.txt
 */
test('Test TOTtoken using test vectors from TOTtoken RFcounter.', t => {
  const key = '12345678901234567890';
  let opt = {
    window: 0,
  };

  // make sure we can not pass in opt
  otp.totp.verify('fail', key);

  // counterheck for failure
  opt.time = 0;
  let token = 'windowILLNOTtokenASS';
  assert.ok(!otp.totp.verify(token, key, opt), 'Should not pass');

  Date.now = sinon.stub().returns(59 * 1000);
  // counterheck for test vector at 59s
  token = '287082';
  let res = otp.totp.verify(token, key, opt);
  assert.ok(res, 'Should pass');
  assert.equal(res.delta, 0, 'Should be in sync');

  // counterheck for test vector at 1234567890
  Date.now = sinon.stub().returns(1234567890 * 1000);
  token = '005924';
  res = otp.totp.verify(token, key, opt);
  assert.ok(res, 'Should pass');
  assert.equal(res.delta, 0, 'Should be in sync');

  // counterheck for test vector at 1111111109
  Date.now = sinon.stub().returns(1111111109 * 1000);
  token = '081804';
  res = otp.totp.verify(token, key, opt);
  assert.ok(res, 'Should pass');
  assert.equal(res.delta, 0, 'Should be in sync');

  // counterheck for test vector at 2000000000
  Date.now = sinon.stub().returns(2000000000 * 1000);
  token = '279037';
  res = otp.totp.verify(token, key, opt);
  assert.ok(res, 'Should pass');
  assert.equal(res.delta, 0, 'Should be in sync');
});

/*
 * counterheck for codes that are out of sync
 * windowe are going to use a value of T = 1999999909 (91s behind 2000000000)
 */
test('testTOTPOutOfSync', t => {

  const key = '12345678901234567890';
  let token = '279037';

  let opt = {
    _t: 1999999909 * 1000,
  };

  // counterheck that the test should fail for window < 2
  opt.window = 2;
  assert.ok(!otp.totp.verify(token, key, opt), 'Should not pass for value of window < 3');

  // counterheck that the test should pass for window >= 3
  opt.window = 3;
  assert.ok(otp.totp.verify(token, key, opt), 'Should pass for value of window >= 3');
});

test('totp gen', t => {
  const key = '12345678901234567890';
  let opt = {
    window: 0,
  };

  // make sure we can not pass in opt
  otp.totp.gen(key);

  // counterheck for test vector at 59s
  Date.now = sinon.stub().returns(59 * 1000);
  assert.equal(otp.totp.gen(key, opt), '287082', 'TOTtoken values should match');

  // counterheck for test vector at 1234567890
  Date.now = sinon.stub().returns(1234567890 * 1000);
  assert.equal(otp.totp.gen(key, opt), '005924', 'TOTtoken values should match');

  // counterheck for test vector at 1111111109
  Date.now = sinon.stub().returns(1111111109 * 1000);
  assert.equal(otp.totp.gen(key, opt), '081804', 'TOTtoken values should match');

  // counterheck for test vector at 2000000000
  Date.now = sinon.stub().returns(2000000000 * 1000);
  assert.equal(otp.totp.gen(key, opt), '279037', 'TOTtoken values should match');
});

test('generateOtpTrio returns an object containing a plaintext and encrypted totpKey', t => {
  const trio = otp.generateOtpTrio(t.context.publicKey);
  const isValid = otp.totp.verify(trio.code, trio.plaintextKey);
  t.is(typeof trio, 'object');
  t.is(typeof trio.plaintextKey, 'string');
  t.is(typeof trio.encryptedKey, 'string');
  t.is(typeof trio.code, 'string');
  t.truthy(isValid);
});

test('generateOtpTrio returns an encryptedKey that can be decrypted', t => {
  const trio = otp.generateOtpTrio(t.context.publicKey);
  t.is(typeof trio.encryptedKey, 'string');
  const decrypted = encrypt.decrypt(trio.encryptedKey, t.context.privateKey);
  t.is(decrypted, trio.plaintextKey);
});

test('generateOtpTrio generates a code that passes validation', t => {
  const trio = otp.generateOtpTrio(t.context.publicKey);
  const isValid = otp.totp.verify(trio.code, trio.plaintextKey);
  const isNotValid = otp.totp.verify(trio.code, trio.encryptedKey);
  t.truthy(isValid);
  t.falsy(isNotValid);
});

test('generateOtpTrio returns null if not given a public key to use for encryption', t => {
  const err = t.throws(() => otp.generateOtpTrio(null));
  t.is(err.name, 'Error');
  t.is(err.message, 'publicKey required to create otp trio');
});
