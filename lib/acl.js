'use strict';

const createRegex = require('./urn');
const OTP = require('./otp');
const JWT = require('./jwt');

const DEFAULT_SIGNING_ALGORITHM = 'RS256';

/**
 * Default expiration time for jwts created here.
 * Setting to one month.
 * @type {[type]}
 */
const ONE_MONTH_IN_SECONDS = 2628000;

function filterOnPropertyAndRemoveDuplicates(array, property) {
  let filtered = array.map(object => object[property]);
  let unique = filtered.filter(function(elem, pos) {
    return filtered.indexOf(elem) == pos;
  });

  return unique;
}

function ACL(privateKey, publicKey) {
  // TODO optionally accept a value to use for the iss, aud and jdi values here.
  this.jwtManager = new JWT({
    algorithm: DEFAULT_SIGNING_ALGORITHM,
    signKey: privateKey,
    verifyKey: publicKey,
    expiresIn: ONE_MONTH_IN_SECONDS,
  });
  
  this.createFullJwtPayload = (user, roles, groups, encryptedOtpKey) => {
    return {
      groups: user.groups ? groups : [],
      roles: user.roles ? roles : [],
      allow: user.allow,
      deny: user.deny,
      principal: user.id,
      username: user.name,
      permissions: user.permissions,
      secret: {
        totpKey: encryptedOtpKey,
      },
    };
  };

  this.createSlimJwtPayload = (user, encryptedOtpKey) => {
    return {
      groups: user.groups,
      roles: user.roles,
      allow: filterOnPropertyAndRemoveDuplicates(user.allow, 'wrn_pattern'),
      deny: filterOnPropertyAndRemoveDuplicates(user.deny, 'wrn_pattern'),
      principal: user.id,
      username: user.name,
      secret: {
        totpKey: encryptedOtpKey,
      },
    };
  };

  this.finalizePayload = (user, roles, groups) => {
    if (!publicKey || !privateKey) {
      throw new Error('Missing keys for jwt creation');
    }

    let otpValues = OTP.generateOtpTrio(publicKey);
    return {
      slim: `${this.jwtManager.createAndSign(this.createSlimJwtPayload(user, otpValues.encryptedKey))}`,
      full: this.jwtManager.createAndSign(this.createFullJwtPayload(user, roles, groups, otpValues.encryptedKey)),
      otp: otpValues.plaintextKey,
    };
  };
}

module.exports = ACL;
