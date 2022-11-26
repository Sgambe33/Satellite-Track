// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"../node_modules/satellite.js/dist/satellite.es.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.constants = void 0;
exports.degreesLat = degreesLat;
exports.degreesLong = degreesLong;
exports.degreesToRadians = degreesToRadians;
exports.dopplerFactor = dopplerFactor;
exports.ecfToEci = ecfToEci;
exports.ecfToLookAngles = ecfToLookAngles;
exports.eciToEcf = eciToEcf;
exports.eciToGeodetic = eciToGeodetic;
exports.geodeticToEcf = geodeticToEcf;
exports.gstime = gstime;
exports.invjday = invjday;
exports.jday = jday;
exports.propagate = propagate;
exports.radiansLat = radiansLat;
exports.radiansLong = radiansLong;
exports.radiansToDegrees = radiansToDegrees;
exports.sgp4 = sgp4;
exports.twoline2satrec = twoline2satrec;
/*!
 * satellite-js v4.1.4
 * (c) 2013 Shashwat Kandadai and UCSC
 * https://github.com/shashwatak/satellite-js
 * License: MIT
 */

var pi = Math.PI;
var twoPi = pi * 2;
var deg2rad = pi / 180.0;
var rad2deg = 180 / pi;
var minutesPerDay = 1440.0;
var mu = 398600.5; // in km3 / s2

var earthRadius = 6378.137; // in km

var xke = 60.0 / Math.sqrt(earthRadius * earthRadius * earthRadius / mu);
var vkmpersec = earthRadius * xke / 60.0;
var tumin = 1.0 / xke;
var j2 = 0.00108262998905;
var j3 = -0.00000253215306;
var j4 = -0.00000161098761;
var j3oj2 = j3 / j2;
var x2o3 = 2.0 / 3.0;
var constants = /*#__PURE__*/Object.freeze({
  __proto__: null,
  pi: pi,
  twoPi: twoPi,
  deg2rad: deg2rad,
  rad2deg: rad2deg,
  minutesPerDay: minutesPerDay,
  mu: mu,
  earthRadius: earthRadius,
  xke: xke,
  vkmpersec: vkmpersec,
  tumin: tumin,
  j2: j2,
  j3: j3,
  j4: j4,
  j3oj2: j3oj2,
  x2o3: x2o3
});

/* -----------------------------------------------------------------------------
 *
 *                           procedure days2mdhms
 *
 *  this procedure converts the day of the year, days, to the equivalent month
 *    day, hour, minute and second.
 *
 *  algorithm     : set up array for the number of days per month
 *                  find leap year - use 1900 because 2000 is a leap year
 *                  loop through a temp value while the value is < the days
 *                  perform int conversions to the correct day and month
 *                  convert remainder into h m s using type conversions
 *
 *  author        : david vallado                  719-573-2600    1 mar 2001
 *
 *  inputs          description                    range / units
 *    year        - year                           1900 .. 2100
 *    days        - julian day of the year         0.0  .. 366.0
 *
 *  outputs       :
 *    mon         - month                          1 .. 12
 *    day         - day                            1 .. 28,29,30,31
 *    hr          - hour                           0 .. 23
 *    min         - minute                         0 .. 59
 *    sec         - second                         0.0 .. 59.999
 *
 *  locals        :
 *    dayofyr     - day of year
 *    temp        - temporary extended values
 *    inttemp     - temporary int value
 *    i           - index
 *    lmonth[12]  - int array containing the number of days per month
 *
 *  coupling      :
 *    none.
 * --------------------------------------------------------------------------- */
exports.constants = constants;
function days2mdhms(year, days) {
  var lmonth = [31, year % 4 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  var dayofyr = Math.floor(days); //  ----------------- find month and day of month ----------------

  var i = 1;
  var inttemp = 0;
  while (dayofyr > inttemp + lmonth[i - 1] && i < 12) {
    inttemp += lmonth[i - 1];
    i += 1;
  }
  var mon = i;
  var day = dayofyr - inttemp; //  ----------------- find hours minutes and seconds -------------

  var temp = (days - dayofyr) * 24.0;
  var hr = Math.floor(temp);
  temp = (temp - hr) * 60.0;
  var minute = Math.floor(temp);
  var sec = (temp - minute) * 60.0;
  return {
    mon: mon,
    day: day,
    hr: hr,
    minute: minute,
    sec: sec
  };
}
/* -----------------------------------------------------------------------------
 *
 *                           procedure jday
 *
 *  this procedure finds the julian date given the year, month, day, and time.
 *    the julian date is defined by each elapsed day since noon, jan 1, 4713 bc.
 *
 *  algorithm     : calculate the answer in one step for efficiency
 *
 *  author        : david vallado                  719-573-2600    1 mar 2001
 *
 *  inputs          description                    range / units
 *    year        - year                           1900 .. 2100
 *    mon         - month                          1 .. 12
 *    day         - day                            1 .. 28,29,30,31
 *    hr          - universal time hour            0 .. 23
 *    min         - universal time min             0 .. 59
 *    sec         - universal time sec             0.0 .. 59.999
 *
 *  outputs       :
 *    jd          - julian date                    days from 4713 bc
 *
 *  locals        :
 *    none.
 *
 *  coupling      :
 *    none.
 *
 *  references    :
 *    vallado       2007, 189, alg 14, ex 3-14
 *
 * --------------------------------------------------------------------------- */

function jdayInternal(year, mon, day, hr, minute, sec) {
  var msec = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : 0;
  return 367.0 * year - Math.floor(7 * (year + Math.floor((mon + 9) / 12.0)) * 0.25) + Math.floor(275 * mon / 9.0) + day + 1721013.5 + ((msec / 60000 + sec / 60.0 + minute) / 60.0 + hr) / 24.0 // ut in days
  // # - 0.5*sgn(100.0*year + mon - 190002.5) + 0.5;
  ;
}

function jday(year, mon, day, hr, minute, sec, msec) {
  if (year instanceof Date) {
    var date = year;
    return jdayInternal(date.getUTCFullYear(), date.getUTCMonth() + 1,
    // Note, this function requires months in range 1-12.
    date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds());
  }
  return jdayInternal(year, mon, day, hr, minute, sec, msec);
}
/* -----------------------------------------------------------------------------
 *
 *                           procedure invjday
 *
 *  this procedure finds the year, month, day, hour, minute and second
 *  given the julian date. tu can be ut1, tdt, tdb, etc.
 *
 *  algorithm     : set up starting values
 *                  find leap year - use 1900 because 2000 is a leap year
 *                  find the elapsed days through the year in a loop
 *                  call routine to find each individual value
 *
 *  author        : david vallado                  719-573-2600    1 mar 2001
 *
 *  inputs          description                    range / units
 *    jd          - julian date                    days from 4713 bc
 *
 *  outputs       :
 *    year        - year                           1900 .. 2100
 *    mon         - month                          1 .. 12
 *    day         - day                            1 .. 28,29,30,31
 *    hr          - hour                           0 .. 23
 *    min         - minute                         0 .. 59
 *    sec         - second                         0.0 .. 59.999
 *
 *  locals        :
 *    days        - day of year plus fractional
 *                  portion of a day               days
 *    tu          - julian centuries from 0 h
 *                  jan 0, 1900
 *    temp        - temporary double values
 *    leapyrs     - number of leap years from 1900
 *
 *  coupling      :
 *    days2mdhms  - finds month, day, hour, minute and second given days and year
 *
 *  references    :
 *    vallado       2007, 208, alg 22, ex 3-13
 * --------------------------------------------------------------------------- */

function invjday(jd, asArray) {
  // --------------- find year and days of the year -
  var temp = jd - 2415019.5;
  var tu = temp / 365.25;
  var year = 1900 + Math.floor(tu);
  var leapyrs = Math.floor((year - 1901) * 0.25); // optional nudge by 8.64x10-7 sec to get even outputs

  var days = temp - ((year - 1900) * 365.0 + leapyrs) + 0.00000000001; // ------------ check for case of beginning of a year -----------

  if (days < 1.0) {
    year -= 1;
    leapyrs = Math.floor((year - 1901) * 0.25);
    days = temp - ((year - 1900) * 365.0 + leapyrs);
  } // ----------------- find remaing data  -------------------------

  var mdhms = days2mdhms(year, days);
  var mon = mdhms.mon,
    day = mdhms.day,
    hr = mdhms.hr,
    minute = mdhms.minute;
  var sec = mdhms.sec - 0.00000086400;
  if (asArray) {
    return [year, mon, day, hr, minute, Math.floor(sec)];
  }
  return new Date(Date.UTC(year, mon - 1, day, hr, minute, Math.floor(sec)));
}

/* -----------------------------------------------------------------------------
 *
 *                           procedure dpper
 *
 *  this procedure provides deep space long period periodic contributions
 *    to the mean elements.  by design, these periodics are zero at epoch.
 *    this used to be dscom which included initialization, but it's really a
 *    recurring function.
 *
 *  author        : david vallado                  719-573-2600   28 jun 2005
 *
 *  inputs        :
 *    e3          -
 *    ee2         -
 *    peo         -
 *    pgho        -
 *    pho         -
 *    pinco       -
 *    plo         -
 *    se2 , se3 , sgh2, sgh3, sgh4, sh2, sh3, si2, si3, sl2, sl3, sl4 -
 *    t           -
 *    xh2, xh3, xi2, xi3, xl2, xl3, xl4 -
 *    zmol        -
 *    zmos        -
 *    ep          - eccentricity                           0.0 - 1.0
 *    inclo       - inclination - needed for lyddane modification
 *    nodep       - right ascension of ascending node
 *    argpp       - argument of perigee
 *    mp          - mean anomaly
 *
 *  outputs       :
 *    ep          - eccentricity                           0.0 - 1.0
 *    inclp       - inclination
 *    nodep        - right ascension of ascending node
 *    argpp       - argument of perigee
 *    mp          - mean anomaly
 *
 *  locals        :
 *    alfdp       -
 *    betdp       -
 *    cosip  , sinip  , cosop  , sinop  ,
 *    dalf        -
 *    dbet        -
 *    dls         -
 *    f2, f3      -
 *    pe          -
 *    pgh         -
 *    ph          -
 *    pinc        -
 *    pl          -
 *    sel   , ses   , sghl  , sghs  , shl   , shs   , sil   , sinzf , sis   ,
 *    sll   , sls
 *    xls         -
 *    xnoh        -
 *    zf          -
 *    zm          -
 *
 *  coupling      :
 *    none.
 *
 *  references    :
 *    hoots, roehrich, norad spacetrack report #3 1980
 *    hoots, norad spacetrack report #6 1986
 *    hoots, schumacher and glover 2004
 *    vallado, crawford, hujsak, kelso  2006
 ----------------------------------------------------------------------------*/

function dpper(satrec, options) {
  var e3 = satrec.e3,
    ee2 = satrec.ee2,
    peo = satrec.peo,
    pgho = satrec.pgho,
    pho = satrec.pho,
    pinco = satrec.pinco,
    plo = satrec.plo,
    se2 = satrec.se2,
    se3 = satrec.se3,
    sgh2 = satrec.sgh2,
    sgh3 = satrec.sgh3,
    sgh4 = satrec.sgh4,
    sh2 = satrec.sh2,
    sh3 = satrec.sh3,
    si2 = satrec.si2,
    si3 = satrec.si3,
    sl2 = satrec.sl2,
    sl3 = satrec.sl3,
    sl4 = satrec.sl4,
    t = satrec.t,
    xgh2 = satrec.xgh2,
    xgh3 = satrec.xgh3,
    xgh4 = satrec.xgh4,
    xh2 = satrec.xh2,
    xh3 = satrec.xh3,
    xi2 = satrec.xi2,
    xi3 = satrec.xi3,
    xl2 = satrec.xl2,
    xl3 = satrec.xl3,
    xl4 = satrec.xl4,
    zmol = satrec.zmol,
    zmos = satrec.zmos;
  var init = options.init,
    opsmode = options.opsmode;
  var ep = options.ep,
    inclp = options.inclp,
    nodep = options.nodep,
    argpp = options.argpp,
    mp = options.mp; // Copy satellite attributes into local variables for convenience
  // and symmetry in writing formulae.

  var alfdp;
  var betdp;
  var cosip;
  var sinip;
  var cosop;
  var sinop;
  var dalf;
  var dbet;
  var dls;
  var f2;
  var f3;
  var pe;
  var pgh;
  var ph;
  var pinc;
  var pl;
  var sinzf;
  var xls;
  var xnoh;
  var zf;
  var zm; //  ---------------------- constants -----------------------------

  var zns = 1.19459e-5;
  var zes = 0.01675;
  var znl = 1.5835218e-4;
  var zel = 0.05490; //  --------------- calculate time varying periodics -----------

  zm = zmos + zns * t; // be sure that the initial call has time set to zero

  if (init === 'y') {
    zm = zmos;
  }
  zf = zm + 2.0 * zes * Math.sin(zm);
  sinzf = Math.sin(zf);
  f2 = 0.5 * sinzf * sinzf - 0.25;
  f3 = -0.5 * sinzf * Math.cos(zf);
  var ses = se2 * f2 + se3 * f3;
  var sis = si2 * f2 + si3 * f3;
  var sls = sl2 * f2 + sl3 * f3 + sl4 * sinzf;
  var sghs = sgh2 * f2 + sgh3 * f3 + sgh4 * sinzf;
  var shs = sh2 * f2 + sh3 * f3;
  zm = zmol + znl * t;
  if (init === 'y') {
    zm = zmol;
  }
  zf = zm + 2.0 * zel * Math.sin(zm);
  sinzf = Math.sin(zf);
  f2 = 0.5 * sinzf * sinzf - 0.25;
  f3 = -0.5 * sinzf * Math.cos(zf);
  var sel = ee2 * f2 + e3 * f3;
  var sil = xi2 * f2 + xi3 * f3;
  var sll = xl2 * f2 + xl3 * f3 + xl4 * sinzf;
  var sghl = xgh2 * f2 + xgh3 * f3 + xgh4 * sinzf;
  var shll = xh2 * f2 + xh3 * f3;
  pe = ses + sel;
  pinc = sis + sil;
  pl = sls + sll;
  pgh = sghs + sghl;
  ph = shs + shll;
  if (init === 'n') {
    pe -= peo;
    pinc -= pinco;
    pl -= plo;
    pgh -= pgho;
    ph -= pho;
    inclp += pinc;
    ep += pe;
    sinip = Math.sin(inclp);
    cosip = Math.cos(inclp);
    /* ----------------- apply periodics directly ------------ */
    // sgp4fix for lyddane choice
    // strn3 used original inclination - this is technically feasible
    // gsfc used perturbed inclination - also technically feasible
    // probably best to readjust the 0.2 limit value and limit discontinuity
    // 0.2 rad = 11.45916 deg
    // use next line for original strn3 approach and original inclination
    // if (inclo >= 0.2)
    // use next line for gsfc version and perturbed inclination

    if (inclp >= 0.2) {
      ph /= sinip;
      pgh -= cosip * ph;
      argpp += pgh;
      nodep += ph;
      mp += pl;
    } else {
      //  ---- apply periodics with lyddane modification ----
      sinop = Math.sin(nodep);
      cosop = Math.cos(nodep);
      alfdp = sinip * sinop;
      betdp = sinip * cosop;
      dalf = ph * cosop + pinc * cosip * sinop;
      dbet = -ph * sinop + pinc * cosip * cosop;
      alfdp += dalf;
      betdp += dbet;
      nodep %= twoPi; //  sgp4fix for afspc written intrinsic functions
      //  nodep used without a trigonometric function ahead

      if (nodep < 0.0 && opsmode === 'a') {
        nodep += twoPi;
      }
      xls = mp + argpp + cosip * nodep;
      dls = pl + pgh - pinc * nodep * sinip;
      xls += dls;
      xnoh = nodep;
      nodep = Math.atan2(alfdp, betdp); //  sgp4fix for afspc written intrinsic functions
      //  nodep used without a trigonometric function ahead

      if (nodep < 0.0 && opsmode === 'a') {
        nodep += twoPi;
      }
      if (Math.abs(xnoh - nodep) > pi) {
        if (nodep < xnoh) {
          nodep += twoPi;
        } else {
          nodep -= twoPi;
        }
      }
      mp += pl;
      argpp = xls - mp - cosip * nodep;
    }
  }
  return {
    ep: ep,
    inclp: inclp,
    nodep: nodep,
    argpp: argpp,
    mp: mp
  };
}

/*-----------------------------------------------------------------------------
 *
 *                           procedure dscom
 *
 *  this procedure provides deep space common items used by both the secular
 *    and periodics subroutines.  input is provided as shown. this routine
 *    used to be called dpper, but the functions inside weren't well organized.
 *
 *  author        : david vallado                  719-573-2600   28 jun 2005
 *
 *  inputs        :
 *    epoch       -
 *    ep          - eccentricity
 *    argpp       - argument of perigee
 *    tc          -
 *    inclp       - inclination
 *    nodep       - right ascension of ascending node
 *    np          - mean motion
 *
 *  outputs       :
 *    sinim  , cosim  , sinomm , cosomm , snodm  , cnodm
 *    day         -
 *    e3          -
 *    ee2         -
 *    em          - eccentricity
 *    emsq        - eccentricity squared
 *    gam         -
 *    peo         -
 *    pgho        -
 *    pho         -
 *    pinco       -
 *    plo         -
 *    rtemsq      -
 *    se2, se3         -
 *    sgh2, sgh3, sgh4        -
 *    sh2, sh3, si2, si3, sl2, sl3, sl4         -
 *    s1, s2, s3, s4, s5, s6, s7          -
 *    ss1, ss2, ss3, ss4, ss5, ss6, ss7, sz1, sz2, sz3         -
 *    sz11, sz12, sz13, sz21, sz22, sz23, sz31, sz32, sz33        -
 *    xgh2, xgh3, xgh4, xh2, xh3, xi2, xi3, xl2, xl3, xl4         -
 *    nm          - mean motion
 *    z1, z2, z3, z11, z12, z13, z21, z22, z23, z31, z32, z33         -
 *    zmol        -
 *    zmos        -
 *
 *  locals        :
 *    a1, a2, a3, a4, a5, a6, a7, a8, a9, a10         -
 *    betasq      -
 *    cc          -
 *    ctem, stem        -
 *    x1, x2, x3, x4, x5, x6, x7, x8          -
 *    xnodce      -
 *    xnoi        -
 *    zcosg  , zsing  , zcosgl , zsingl , zcosh  , zsinh  , zcoshl , zsinhl ,
 *    zcosi  , zsini  , zcosil , zsinil ,
 *    zx          -
 *    zy          -
 *
 *  coupling      :
 *    none.
 *
 *  references    :
 *    hoots, roehrich, norad spacetrack report #3 1980
 *    hoots, norad spacetrack report #6 1986
 *    hoots, schumacher and glover 2004
 *    vallado, crawford, hujsak, kelso  2006
 ----------------------------------------------------------------------------*/

function dscom(options) {
  var epoch = options.epoch,
    ep = options.ep,
    argpp = options.argpp,
    tc = options.tc,
    inclp = options.inclp,
    nodep = options.nodep,
    np = options.np;
  var a1;
  var a2;
  var a3;
  var a4;
  var a5;
  var a6;
  var a7;
  var a8;
  var a9;
  var a10;
  var cc;
  var x1;
  var x2;
  var x3;
  var x4;
  var x5;
  var x6;
  var x7;
  var x8;
  var zcosg;
  var zsing;
  var zcosh;
  var zsinh;
  var zcosi;
  var zsini;
  var ss1;
  var ss2;
  var ss3;
  var ss4;
  var ss5;
  var ss6;
  var ss7;
  var sz1;
  var sz2;
  var sz3;
  var sz11;
  var sz12;
  var sz13;
  var sz21;
  var sz22;
  var sz23;
  var sz31;
  var sz32;
  var sz33;
  var s1;
  var s2;
  var s3;
  var s4;
  var s5;
  var s6;
  var s7;
  var z1;
  var z2;
  var z3;
  var z11;
  var z12;
  var z13;
  var z21;
  var z22;
  var z23;
  var z31;
  var z32;
  var z33; // -------------------------- constants -------------------------

  var zes = 0.01675;
  var zel = 0.05490;
  var c1ss = 2.9864797e-6;
  var c1l = 4.7968065e-7;
  var zsinis = 0.39785416;
  var zcosis = 0.91744867;
  var zcosgs = 0.1945905;
  var zsings = -0.98088458; //  --------------------- local variables ------------------------

  var nm = np;
  var em = ep;
  var snodm = Math.sin(nodep);
  var cnodm = Math.cos(nodep);
  var sinomm = Math.sin(argpp);
  var cosomm = Math.cos(argpp);
  var sinim = Math.sin(inclp);
  var cosim = Math.cos(inclp);
  var emsq = em * em;
  var betasq = 1.0 - emsq;
  var rtemsq = Math.sqrt(betasq); //  ----------------- initialize lunar solar terms ---------------

  var peo = 0.0;
  var pinco = 0.0;
  var plo = 0.0;
  var pgho = 0.0;
  var pho = 0.0;
  var day = epoch + 18261.5 + tc / 1440.0;
  var xnodce = (4.5236020 - 9.2422029e-4 * day) % twoPi;
  var stem = Math.sin(xnodce);
  var ctem = Math.cos(xnodce);
  var zcosil = 0.91375164 - 0.03568096 * ctem;
  var zsinil = Math.sqrt(1.0 - zcosil * zcosil);
  var zsinhl = 0.089683511 * stem / zsinil;
  var zcoshl = Math.sqrt(1.0 - zsinhl * zsinhl);
  var gam = 5.8351514 + 0.0019443680 * day;
  var zx = 0.39785416 * stem / zsinil;
  var zy = zcoshl * ctem + 0.91744867 * zsinhl * stem;
  zx = Math.atan2(zx, zy);
  zx += gam - xnodce;
  var zcosgl = Math.cos(zx);
  var zsingl = Math.sin(zx); //  ------------------------- do solar terms ---------------------

  zcosg = zcosgs;
  zsing = zsings;
  zcosi = zcosis;
  zsini = zsinis;
  zcosh = cnodm;
  zsinh = snodm;
  cc = c1ss;
  var xnoi = 1.0 / nm;
  var lsflg = 0;
  while (lsflg < 2) {
    lsflg += 1;
    a1 = zcosg * zcosh + zsing * zcosi * zsinh;
    a3 = -zsing * zcosh + zcosg * zcosi * zsinh;
    a7 = -zcosg * zsinh + zsing * zcosi * zcosh;
    a8 = zsing * zsini;
    a9 = zsing * zsinh + zcosg * zcosi * zcosh;
    a10 = zcosg * zsini;
    a2 = cosim * a7 + sinim * a8;
    a4 = cosim * a9 + sinim * a10;
    a5 = -sinim * a7 + cosim * a8;
    a6 = -sinim * a9 + cosim * a10;
    x1 = a1 * cosomm + a2 * sinomm;
    x2 = a3 * cosomm + a4 * sinomm;
    x3 = -a1 * sinomm + a2 * cosomm;
    x4 = -a3 * sinomm + a4 * cosomm;
    x5 = a5 * sinomm;
    x6 = a6 * sinomm;
    x7 = a5 * cosomm;
    x8 = a6 * cosomm;
    z31 = 12.0 * x1 * x1 - 3.0 * x3 * x3;
    z32 = 24.0 * x1 * x2 - 6.0 * x3 * x4;
    z33 = 12.0 * x2 * x2 - 3.0 * x4 * x4;
    z1 = 3.0 * (a1 * a1 + a2 * a2) + z31 * emsq;
    z2 = 6.0 * (a1 * a3 + a2 * a4) + z32 * emsq;
    z3 = 3.0 * (a3 * a3 + a4 * a4) + z33 * emsq;
    z11 = -6.0 * a1 * a5 + emsq * (-24.0 * x1 * x7 - 6.0 * x3 * x5);
    z12 = -6.0 * (a1 * a6 + a3 * a5) + emsq * (-24.0 * (x2 * x7 + x1 * x8) + -6.0 * (x3 * x6 + x4 * x5));
    z13 = -6.0 * a3 * a6 + emsq * (-24.0 * x2 * x8 - 6.0 * x4 * x6);
    z21 = 6.0 * a2 * a5 + emsq * (24.0 * x1 * x5 - 6.0 * x3 * x7);
    z22 = 6.0 * (a4 * a5 + a2 * a6) + emsq * (24.0 * (x2 * x5 + x1 * x6) - 6.0 * (x4 * x7 + x3 * x8));
    z23 = 6.0 * a4 * a6 + emsq * (24.0 * x2 * x6 - 6.0 * x4 * x8);
    z1 = z1 + z1 + betasq * z31;
    z2 = z2 + z2 + betasq * z32;
    z3 = z3 + z3 + betasq * z33;
    s3 = cc * xnoi;
    s2 = -0.5 * s3 / rtemsq;
    s4 = s3 * rtemsq;
    s1 = -15.0 * em * s4;
    s5 = x1 * x3 + x2 * x4;
    s6 = x2 * x3 + x1 * x4;
    s7 = x2 * x4 - x1 * x3; //  ----------------------- do lunar terms -------------------

    if (lsflg === 1) {
      ss1 = s1;
      ss2 = s2;
      ss3 = s3;
      ss4 = s4;
      ss5 = s5;
      ss6 = s6;
      ss7 = s7;
      sz1 = z1;
      sz2 = z2;
      sz3 = z3;
      sz11 = z11;
      sz12 = z12;
      sz13 = z13;
      sz21 = z21;
      sz22 = z22;
      sz23 = z23;
      sz31 = z31;
      sz32 = z32;
      sz33 = z33;
      zcosg = zcosgl;
      zsing = zsingl;
      zcosi = zcosil;
      zsini = zsinil;
      zcosh = zcoshl * cnodm + zsinhl * snodm;
      zsinh = snodm * zcoshl - cnodm * zsinhl;
      cc = c1l;
    }
  }
  var zmol = (4.7199672 + (0.22997150 * day - gam)) % twoPi;
  var zmos = (6.2565837 + 0.017201977 * day) % twoPi; //  ------------------------ do solar terms ----------------------

  var se2 = 2.0 * ss1 * ss6;
  var se3 = 2.0 * ss1 * ss7;
  var si2 = 2.0 * ss2 * sz12;
  var si3 = 2.0 * ss2 * (sz13 - sz11);
  var sl2 = -2.0 * ss3 * sz2;
  var sl3 = -2.0 * ss3 * (sz3 - sz1);
  var sl4 = -2.0 * ss3 * (-21.0 - 9.0 * emsq) * zes;
  var sgh2 = 2.0 * ss4 * sz32;
  var sgh3 = 2.0 * ss4 * (sz33 - sz31);
  var sgh4 = -18.0 * ss4 * zes;
  var sh2 = -2.0 * ss2 * sz22;
  var sh3 = -2.0 * ss2 * (sz23 - sz21); //  ------------------------ do lunar terms ----------------------

  var ee2 = 2.0 * s1 * s6;
  var e3 = 2.0 * s1 * s7;
  var xi2 = 2.0 * s2 * z12;
  var xi3 = 2.0 * s2 * (z13 - z11);
  var xl2 = -2.0 * s3 * z2;
  var xl3 = -2.0 * s3 * (z3 - z1);
  var xl4 = -2.0 * s3 * (-21.0 - 9.0 * emsq) * zel;
  var xgh2 = 2.0 * s4 * z32;
  var xgh3 = 2.0 * s4 * (z33 - z31);
  var xgh4 = -18.0 * s4 * zel;
  var xh2 = -2.0 * s2 * z22;
  var xh3 = -2.0 * s2 * (z23 - z21);
  return {
    snodm: snodm,
    cnodm: cnodm,
    sinim: sinim,
    cosim: cosim,
    sinomm: sinomm,
    cosomm: cosomm,
    day: day,
    e3: e3,
    ee2: ee2,
    em: em,
    emsq: emsq,
    gam: gam,
    peo: peo,
    pgho: pgho,
    pho: pho,
    pinco: pinco,
    plo: plo,
    rtemsq: rtemsq,
    se2: se2,
    se3: se3,
    sgh2: sgh2,
    sgh3: sgh3,
    sgh4: sgh4,
    sh2: sh2,
    sh3: sh3,
    si2: si2,
    si3: si3,
    sl2: sl2,
    sl3: sl3,
    sl4: sl4,
    s1: s1,
    s2: s2,
    s3: s3,
    s4: s4,
    s5: s5,
    s6: s6,
    s7: s7,
    ss1: ss1,
    ss2: ss2,
    ss3: ss3,
    ss4: ss4,
    ss5: ss5,
    ss6: ss6,
    ss7: ss7,
    sz1: sz1,
    sz2: sz2,
    sz3: sz3,
    sz11: sz11,
    sz12: sz12,
    sz13: sz13,
    sz21: sz21,
    sz22: sz22,
    sz23: sz23,
    sz31: sz31,
    sz32: sz32,
    sz33: sz33,
    xgh2: xgh2,
    xgh3: xgh3,
    xgh4: xgh4,
    xh2: xh2,
    xh3: xh3,
    xi2: xi2,
    xi3: xi3,
    xl2: xl2,
    xl3: xl3,
    xl4: xl4,
    nm: nm,
    z1: z1,
    z2: z2,
    z3: z3,
    z11: z11,
    z12: z12,
    z13: z13,
    z21: z21,
    z22: z22,
    z23: z23,
    z31: z31,
    z32: z32,
    z33: z33,
    zmol: zmol,
    zmos: zmos
  };
}

/*-----------------------------------------------------------------------------
 *
 *                           procedure dsinit
 *
 *  this procedure provides deep space contributions to mean motion dot due
 *    to geopotential resonance with half day and one day orbits.
 *
 *  author        : david vallado                  719-573-2600   28 jun 2005
 *
 *  inputs        :
 *    cosim, sinim-
 *    emsq        - eccentricity squared
 *    argpo       - argument of perigee
 *    s1, s2, s3, s4, s5      -
 *    ss1, ss2, ss3, ss4, ss5 -
 *    sz1, sz3, sz11, sz13, sz21, sz23, sz31, sz33 -
 *    t           - time
 *    tc          -
 *    gsto        - greenwich sidereal time                   rad
 *    mo          - mean anomaly
 *    mdot        - mean anomaly dot (rate)
 *    no          - mean motion
 *    nodeo       - right ascension of ascending node
 *    nodedot     - right ascension of ascending node dot (rate)
 *    xpidot      -
 *    z1, z3, z11, z13, z21, z23, z31, z33 -
 *    eccm        - eccentricity
 *    argpm       - argument of perigee
 *    inclm       - inclination
 *    mm          - mean anomaly
 *    xn          - mean motion
 *    nodem       - right ascension of ascending node
 *
 *  outputs       :
 *    em          - eccentricity
 *    argpm       - argument of perigee
 *    inclm       - inclination
 *    mm          - mean anomaly
 *    nm          - mean motion
 *    nodem       - right ascension of ascending node
 *    irez        - flag for resonance           0-none, 1-one day, 2-half day
 *    atime       -
 *    d2201, d2211, d3210, d3222, d4410, d4422, d5220, d5232, d5421, d5433    -
 *    dedt        -
 *    didt        -
 *    dmdt        -
 *    dndt        -
 *    dnodt       -
 *    domdt       -
 *    del1, del2, del3        -
 *    ses  , sghl , sghs , sgs  , shl  , shs  , sis  , sls
 *    theta       -
 *    xfact       -
 *    xlamo       -
 *    xli         -
 *    xni
 *
 *  locals        :
 *    ainv2       -
 *    aonv        -
 *    cosisq      -
 *    eoc         -
 *    f220, f221, f311, f321, f322, f330, f441, f442, f522, f523, f542, f543  -
 *    g200, g201, g211, g300, g310, g322, g410, g422, g520, g521, g532, g533  -
 *    sini2       -
 *    temp        -
 *    temp1       -
 *    theta       -
 *    xno2        -
 *
 *  coupling      :
 *    getgravconst
 *
 *  references    :
 *    hoots, roehrich, norad spacetrack report #3 1980
 *    hoots, norad spacetrack report #6 1986
 *    hoots, schumacher and glover 2004
 *    vallado, crawford, hujsak, kelso  2006
 ----------------------------------------------------------------------------*/

function dsinit(options) {
  var cosim = options.cosim,
    argpo = options.argpo,
    s1 = options.s1,
    s2 = options.s2,
    s3 = options.s3,
    s4 = options.s4,
    s5 = options.s5,
    sinim = options.sinim,
    ss1 = options.ss1,
    ss2 = options.ss2,
    ss3 = options.ss3,
    ss4 = options.ss4,
    ss5 = options.ss5,
    sz1 = options.sz1,
    sz3 = options.sz3,
    sz11 = options.sz11,
    sz13 = options.sz13,
    sz21 = options.sz21,
    sz23 = options.sz23,
    sz31 = options.sz31,
    sz33 = options.sz33,
    t = options.t,
    tc = options.tc,
    gsto = options.gsto,
    mo = options.mo,
    mdot = options.mdot,
    no = options.no,
    nodeo = options.nodeo,
    nodedot = options.nodedot,
    xpidot = options.xpidot,
    z1 = options.z1,
    z3 = options.z3,
    z11 = options.z11,
    z13 = options.z13,
    z21 = options.z21,
    z23 = options.z23,
    z31 = options.z31,
    z33 = options.z33,
    ecco = options.ecco,
    eccsq = options.eccsq;
  var emsq = options.emsq,
    em = options.em,
    argpm = options.argpm,
    inclm = options.inclm,
    mm = options.mm,
    nm = options.nm,
    nodem = options.nodem,
    irez = options.irez,
    atime = options.atime,
    d2201 = options.d2201,
    d2211 = options.d2211,
    d3210 = options.d3210,
    d3222 = options.d3222,
    d4410 = options.d4410,
    d4422 = options.d4422,
    d5220 = options.d5220,
    d5232 = options.d5232,
    d5421 = options.d5421,
    d5433 = options.d5433,
    dedt = options.dedt,
    didt = options.didt,
    dmdt = options.dmdt,
    dnodt = options.dnodt,
    domdt = options.domdt,
    del1 = options.del1,
    del2 = options.del2,
    del3 = options.del3,
    xfact = options.xfact,
    xlamo = options.xlamo,
    xli = options.xli,
    xni = options.xni;
  var f220;
  var f221;
  var f311;
  var f321;
  var f322;
  var f330;
  var f441;
  var f442;
  var f522;
  var f523;
  var f542;
  var f543;
  var g200;
  var g201;
  var g211;
  var g300;
  var g310;
  var g322;
  var g410;
  var g422;
  var g520;
  var g521;
  var g532;
  var g533;
  var sini2;
  var temp;
  var temp1;
  var xno2;
  var ainv2;
  var aonv;
  var cosisq;
  var eoc;
  var q22 = 1.7891679e-6;
  var q31 = 2.1460748e-6;
  var q33 = 2.2123015e-7;
  var root22 = 1.7891679e-6;
  var root44 = 7.3636953e-9;
  var root54 = 2.1765803e-9;
  var rptim = 4.37526908801129966e-3; // equates to 7.29211514668855e-5 rad/sec

  var root32 = 3.7393792e-7;
  var root52 = 1.1428639e-7;
  var znl = 1.5835218e-4;
  var zns = 1.19459e-5; // -------------------- deep space initialization ------------

  irez = 0;
  if (nm < 0.0052359877 && nm > 0.0034906585) {
    irez = 1;
  }
  if (nm >= 8.26e-3 && nm <= 9.24e-3 && em >= 0.5) {
    irez = 2;
  } // ------------------------ do solar terms -------------------

  var ses = ss1 * zns * ss5;
  var sis = ss2 * zns * (sz11 + sz13);
  var sls = -zns * ss3 * (sz1 + sz3 - 14.0 - 6.0 * emsq);
  var sghs = ss4 * zns * (sz31 + sz33 - 6.0);
  var shs = -zns * ss2 * (sz21 + sz23); // sgp4fix for 180 deg incl

  if (inclm < 5.2359877e-2 || inclm > pi - 5.2359877e-2) {
    shs = 0.0;
  }
  if (sinim !== 0.0) {
    shs /= sinim;
  }
  var sgs = sghs - cosim * shs; // ------------------------- do lunar terms ------------------

  dedt = ses + s1 * znl * s5;
  didt = sis + s2 * znl * (z11 + z13);
  dmdt = sls - znl * s3 * (z1 + z3 - 14.0 - 6.0 * emsq);
  var sghl = s4 * znl * (z31 + z33 - 6.0);
  var shll = -znl * s2 * (z21 + z23); // sgp4fix for 180 deg incl

  if (inclm < 5.2359877e-2 || inclm > pi - 5.2359877e-2) {
    shll = 0.0;
  }
  domdt = sgs + sghl;
  dnodt = shs;
  if (sinim !== 0.0) {
    domdt -= cosim / sinim * shll;
    dnodt += shll / sinim;
  } // ----------- calculate deep space resonance effects --------

  var dndt = 0.0;
  var theta = (gsto + tc * rptim) % twoPi;
  em += dedt * t;
  inclm += didt * t;
  argpm += domdt * t;
  nodem += dnodt * t;
  mm += dmdt * t; // sgp4fix for negative inclinations
  // the following if statement should be commented out
  // if (inclm < 0.0)
  // {
  //   inclm  = -inclm;
  //   argpm  = argpm - pi;
  //   nodem = nodem + pi;
  // }
  // -------------- initialize the resonance terms -------------

  if (irez !== 0) {
    aonv = Math.pow(nm / xke, x2o3); // ---------- geopotential resonance for 12 hour orbits ------

    if (irez === 2) {
      cosisq = cosim * cosim;
      var emo = em;
      em = ecco;
      var emsqo = emsq;
      emsq = eccsq;
      eoc = em * emsq;
      g201 = -0.306 - (em - 0.64) * 0.440;
      if (em <= 0.65) {
        g211 = 3.616 - 13.2470 * em + 16.2900 * emsq;
        g310 = -19.302 + 117.3900 * em - 228.4190 * emsq + 156.5910 * eoc;
        g322 = -18.9068 + 109.7927 * em - 214.6334 * emsq + 146.5816 * eoc;
        g410 = -41.122 + 242.6940 * em - 471.0940 * emsq + 313.9530 * eoc;
        g422 = -146.407 + 841.8800 * em - 1629.014 * emsq + 1083.4350 * eoc;
        g520 = -532.114 + 3017.977 * em - 5740.032 * emsq + 3708.2760 * eoc;
      } else {
        g211 = -72.099 + 331.819 * em - 508.738 * emsq + 266.724 * eoc;
        g310 = -346.844 + 1582.851 * em - 2415.925 * emsq + 1246.113 * eoc;
        g322 = -342.585 + 1554.908 * em - 2366.899 * emsq + 1215.972 * eoc;
        g410 = -1052.797 + 4758.686 * em - 7193.992 * emsq + 3651.957 * eoc;
        g422 = -3581.690 + 16178.110 * em - 24462.770 * emsq + 12422.520 * eoc;
        if (em > 0.715) {
          g520 = -5149.66 + 29936.92 * em - 54087.36 * emsq + 31324.56 * eoc;
        } else {
          g520 = 1464.74 - 4664.75 * em + 3763.64 * emsq;
        }
      }
      if (em < 0.7) {
        g533 = -919.22770 + 4988.6100 * em - 9064.7700 * emsq + 5542.21 * eoc;
        g521 = -822.71072 + 4568.6173 * em - 8491.4146 * emsq + 5337.524 * eoc;
        g532 = -853.66600 + 4690.2500 * em - 8624.7700 * emsq + 5341.4 * eoc;
      } else {
        g533 = -37995.780 + 161616.52 * em - 229838.20 * emsq + 109377.94 * eoc;
        g521 = -51752.104 + 218913.95 * em - 309468.16 * emsq + 146349.42 * eoc;
        g532 = -40023.880 + 170470.89 * em - 242699.48 * emsq + 115605.82 * eoc;
      }
      sini2 = sinim * sinim;
      f220 = 0.75 * (1.0 + 2.0 * cosim + cosisq);
      f221 = 1.5 * sini2;
      f321 = 1.875 * sinim * (1.0 - 2.0 * cosim - 3.0 * cosisq);
      f322 = -1.875 * sinim * (1.0 + 2.0 * cosim - 3.0 * cosisq);
      f441 = 35.0 * sini2 * f220;
      f442 = 39.3750 * sini2 * sini2;
      f522 = 9.84375 * sinim * (sini2 * (1.0 - 2.0 * cosim - 5.0 * cosisq) + 0.33333333 * (-2.0 + 4.0 * cosim + 6.0 * cosisq));
      f523 = sinim * (4.92187512 * sini2 * (-2.0 - 4.0 * cosim + 10.0 * cosisq) + 6.56250012 * (1.0 + 2.0 * cosim - 3.0 * cosisq));
      f542 = 29.53125 * sinim * (2.0 - 8.0 * cosim + cosisq * (-12.0 + 8.0 * cosim + 10.0 * cosisq));
      f543 = 29.53125 * sinim * (-2.0 - 8.0 * cosim + cosisq * (12.0 + 8.0 * cosim - 10.0 * cosisq));
      xno2 = nm * nm;
      ainv2 = aonv * aonv;
      temp1 = 3.0 * xno2 * ainv2;
      temp = temp1 * root22;
      d2201 = temp * f220 * g201;
      d2211 = temp * f221 * g211;
      temp1 *= aonv;
      temp = temp1 * root32;
      d3210 = temp * f321 * g310;
      d3222 = temp * f322 * g322;
      temp1 *= aonv;
      temp = 2.0 * temp1 * root44;
      d4410 = temp * f441 * g410;
      d4422 = temp * f442 * g422;
      temp1 *= aonv;
      temp = temp1 * root52;
      d5220 = temp * f522 * g520;
      d5232 = temp * f523 * g532;
      temp = 2.0 * temp1 * root54;
      d5421 = temp * f542 * g521;
      d5433 = temp * f543 * g533;
      xlamo = (mo + nodeo + nodeo - (theta + theta)) % twoPi;
      xfact = mdot + dmdt + 2.0 * (nodedot + dnodt - rptim) - no;
      em = emo;
      emsq = emsqo;
    } //  ---------------- synchronous resonance terms --------------

    if (irez === 1) {
      g200 = 1.0 + emsq * (-2.5 + 0.8125 * emsq);
      g310 = 1.0 + 2.0 * emsq;
      g300 = 1.0 + emsq * (-6.0 + 6.60937 * emsq);
      f220 = 0.75 * (1.0 + cosim) * (1.0 + cosim);
      f311 = 0.9375 * sinim * sinim * (1.0 + 3.0 * cosim) - 0.75 * (1.0 + cosim);
      f330 = 1.0 + cosim;
      f330 *= 1.875 * f330 * f330;
      del1 = 3.0 * nm * nm * aonv * aonv;
      del2 = 2.0 * del1 * f220 * g200 * q22;
      del3 = 3.0 * del1 * f330 * g300 * q33 * aonv;
      del1 = del1 * f311 * g310 * q31 * aonv;
      xlamo = (mo + nodeo + argpo - theta) % twoPi;
      xfact = mdot + xpidot + dmdt + domdt + dnodt - (no + rptim);
    } //  ------------ for sgp4, initialize the integrator ----------

    xli = xlamo;
    xni = no;
    atime = 0.0;
    nm = no + dndt;
  }
  return {
    em: em,
    argpm: argpm,
    inclm: inclm,
    mm: mm,
    nm: nm,
    nodem: nodem,
    irez: irez,
    atime: atime,
    d2201: d2201,
    d2211: d2211,
    d3210: d3210,
    d3222: d3222,
    d4410: d4410,
    d4422: d4422,
    d5220: d5220,
    d5232: d5232,
    d5421: d5421,
    d5433: d5433,
    dedt: dedt,
    didt: didt,
    dmdt: dmdt,
    dndt: dndt,
    dnodt: dnodt,
    domdt: domdt,
    del1: del1,
    del2: del2,
    del3: del3,
    xfact: xfact,
    xlamo: xlamo,
    xli: xli,
    xni: xni
  };
}

/* -----------------------------------------------------------------------------
 *
 *                           function gstime
 *
 *  this function finds the greenwich sidereal time.
 *
 *  author        : david vallado                  719-573-2600    1 mar 2001
 *
 *  inputs          description                    range / units
 *    jdut1       - julian date in ut1             days from 4713 bc
 *
 *  outputs       :
 *    gstime      - greenwich sidereal time        0 to 2pi rad
 *
 *  locals        :
 *    temp        - temporary variable for doubles   rad
 *    tut1        - julian centuries from the
 *                  jan 1, 2000 12 h epoch (ut1)
 *
 *  coupling      :
 *    none
 *
 *  references    :
 *    vallado       2004, 191, eq 3-45
 * --------------------------------------------------------------------------- */

function gstimeInternal(jdut1) {
  var tut1 = (jdut1 - 2451545.0) / 36525.0;
  var temp = -6.2e-6 * tut1 * tut1 * tut1 + 0.093104 * tut1 * tut1 + (876600.0 * 3600 + 8640184.812866) * tut1 + 67310.54841; // # sec

  temp = temp * deg2rad / 240.0 % twoPi; // 360/86400 = 1/240, to deg, to rad
  //  ------------------------ check quadrants ---------------------

  if (temp < 0.0) {
    temp += twoPi;
  }
  return temp;
}
function gstime() {
  if ((arguments.length <= 0 ? undefined : arguments[0]) instanceof Date || arguments.length > 1) {
    return gstimeInternal(jday.apply(void 0, arguments));
  }
  return gstimeInternal.apply(void 0, arguments);
}

/*-----------------------------------------------------------------------------
 *
 *                           procedure initl
 *
 *  this procedure initializes the sgp4 propagator. all the initialization is
 *    consolidated here instead of having multiple loops inside other routines.
 *
 *  author        : david vallado                  719-573-2600   28 jun 2005
 *
 *  inputs        :
 *    ecco        - eccentricity                           0.0 - 1.0
 *    epoch       - epoch time in days from jan 0, 1950. 0 hr
 *    inclo       - inclination of satellite
 *    no          - mean motion of satellite
 *    satn        - satellite number
 *
 *  outputs       :
 *    ainv        - 1.0 / a
 *    ao          - semi major axis
 *    con41       -
 *    con42       - 1.0 - 5.0 cos(i)
 *    cosio       - cosine of inclination
 *    cosio2      - cosio squared
 *    eccsq       - eccentricity squared
 *    method      - flag for deep space                    'd', 'n'
 *    omeosq      - 1.0 - ecco * ecco
 *    posq        - semi-parameter squared
 *    rp          - radius of perigee
 *    rteosq      - square root of (1.0 - ecco*ecco)
 *    sinio       - sine of inclination
 *    gsto        - gst at time of observation               rad
 *    no          - mean motion of satellite
 *
 *  locals        :
 *    ak          -
 *    d1          -
 *    del         -
 *    adel        -
 *    po          -
 *
 *  coupling      :
 *    getgravconst
 *    gstime      - find greenwich sidereal time from the julian date
 *
 *  references    :
 *    hoots, roehrich, norad spacetrack report #3 1980
 *    hoots, norad spacetrack report #6 1986
 *    hoots, schumacher and glover 2004
 *    vallado, crawford, hujsak, kelso  2006
 ----------------------------------------------------------------------------*/

function initl(options) {
  var ecco = options.ecco,
    epoch = options.epoch,
    inclo = options.inclo,
    opsmode = options.opsmode;
  var no = options.no; // sgp4fix use old way of finding gst
  // ----------------------- earth constants ---------------------
  // sgp4fix identify constants and allow alternate values
  // ------------- calculate auxillary epoch quantities ----------

  var eccsq = ecco * ecco;
  var omeosq = 1.0 - eccsq;
  var rteosq = Math.sqrt(omeosq);
  var cosio = Math.cos(inclo);
  var cosio2 = cosio * cosio; // ------------------ un-kozai the mean motion -----------------

  var ak = Math.pow(xke / no, x2o3);
  var d1 = 0.75 * j2 * (3.0 * cosio2 - 1.0) / (rteosq * omeosq);
  var delPrime = d1 / (ak * ak);
  var adel = ak * (1.0 - delPrime * delPrime - delPrime * (1.0 / 3.0 + 134.0 * delPrime * delPrime / 81.0));
  delPrime = d1 / (adel * adel);
  no /= 1.0 + delPrime;
  var ao = Math.pow(xke / no, x2o3);
  var sinio = Math.sin(inclo);
  var po = ao * omeosq;
  var con42 = 1.0 - 5.0 * cosio2;
  var con41 = -con42 - cosio2 - cosio2;
  var ainv = 1.0 / ao;
  var posq = po * po;
  var rp = ao * (1.0 - ecco);
  var method = 'n'; //  sgp4fix modern approach to finding sidereal time

  var gsto;
  if (opsmode === 'a') {
    //  sgp4fix use old way of finding gst
    //  count integer number of days from 0 jan 1970
    var ts70 = epoch - 7305.0;
    var ds70 = Math.floor(ts70 + 1.0e-8);
    var tfrac = ts70 - ds70; //  find greenwich location at epoch

    var c1 = 1.72027916940703639e-2;
    var thgr70 = 1.7321343856509374;
    var fk5r = 5.07551419432269442e-15;
    var c1p2p = c1 + twoPi;
    gsto = (thgr70 + c1 * ds70 + c1p2p * tfrac + ts70 * ts70 * fk5r) % twoPi;
    if (gsto < 0.0) {
      gsto += twoPi;
    }
  } else {
    gsto = gstime(epoch + 2433281.5);
  }
  return {
    no: no,
    method: method,
    ainv: ainv,
    ao: ao,
    con41: con41,
    con42: con42,
    cosio: cosio,
    cosio2: cosio2,
    eccsq: eccsq,
    omeosq: omeosq,
    posq: posq,
    rp: rp,
    rteosq: rteosq,
    sinio: sinio,
    gsto: gsto
  };
}

/*-----------------------------------------------------------------------------
 *
 *                           procedure dspace
 *
 *  this procedure provides deep space contributions to mean elements for
 *    perturbing third body.  these effects have been averaged over one
 *    revolution of the sun and moon.  for earth resonance effects, the
 *    effects have been averaged over no revolutions of the satellite.
 *    (mean motion)
 *
 *  author        : david vallado                  719-573-2600   28 jun 2005
 *
 *  inputs        :
 *    d2201, d2211, d3210, d3222, d4410, d4422, d5220, d5232, d5421, d5433 -
 *    dedt        -
 *    del1, del2, del3  -
 *    didt        -
 *    dmdt        -
 *    dnodt       -
 *    domdt       -
 *    irez        - flag for resonance           0-none, 1-one day, 2-half day
 *    argpo       - argument of perigee
 *    argpdot     - argument of perigee dot (rate)
 *    t           - time
 *    tc          -
 *    gsto        - gst
 *    xfact       -
 *    xlamo       -
 *    no          - mean motion
 *    atime       -
 *    em          - eccentricity
 *    ft          -
 *    argpm       - argument of perigee
 *    inclm       - inclination
 *    xli         -
 *    mm          - mean anomaly
 *    xni         - mean motion
 *    nodem       - right ascension of ascending node
 *
 *  outputs       :
 *    atime       -
 *    em          - eccentricity
 *    argpm       - argument of perigee
 *    inclm       - inclination
 *    xli         -
 *    mm          - mean anomaly
 *    xni         -
 *    nodem       - right ascension of ascending node
 *    dndt        -
 *    nm          - mean motion
 *
 *  locals        :
 *    delt        -
 *    ft          -
 *    theta       -
 *    x2li        -
 *    x2omi       -
 *    xl          -
 *    xldot       -
 *    xnddt       -
 *    xndt        -
 *    xomi        -
 *
 *  coupling      :
 *    none        -
 *
 *  references    :
 *    hoots, roehrich, norad spacetrack report #3 1980
 *    hoots, norad spacetrack report #6 1986
 *    hoots, schumacher and glover 2004
 *    vallado, crawford, hujsak, kelso  2006
 ----------------------------------------------------------------------------*/

function dspace(options) {
  var irez = options.irez,
    d2201 = options.d2201,
    d2211 = options.d2211,
    d3210 = options.d3210,
    d3222 = options.d3222,
    d4410 = options.d4410,
    d4422 = options.d4422,
    d5220 = options.d5220,
    d5232 = options.d5232,
    d5421 = options.d5421,
    d5433 = options.d5433,
    dedt = options.dedt,
    del1 = options.del1,
    del2 = options.del2,
    del3 = options.del3,
    didt = options.didt,
    dmdt = options.dmdt,
    dnodt = options.dnodt,
    domdt = options.domdt,
    argpo = options.argpo,
    argpdot = options.argpdot,
    t = options.t,
    tc = options.tc,
    gsto = options.gsto,
    xfact = options.xfact,
    xlamo = options.xlamo,
    no = options.no;
  var atime = options.atime,
    em = options.em,
    argpm = options.argpm,
    inclm = options.inclm,
    xli = options.xli,
    mm = options.mm,
    xni = options.xni,
    nodem = options.nodem,
    nm = options.nm;
  var fasx2 = 0.13130908;
  var fasx4 = 2.8843198;
  var fasx6 = 0.37448087;
  var g22 = 5.7686396;
  var g32 = 0.95240898;
  var g44 = 1.8014998;
  var g52 = 1.0508330;
  var g54 = 4.4108898;
  var rptim = 4.37526908801129966e-3; // equates to 7.29211514668855e-5 rad/sec

  var stepp = 720.0;
  var stepn = -720.0;
  var step2 = 259200.0;
  var delt;
  var x2li;
  var x2omi;
  var xl;
  var xldot;
  var xnddt;
  var xndt;
  var xomi;
  var dndt = 0.0;
  var ft = 0.0; //  ----------- calculate deep space resonance effects -----------

  var theta = (gsto + tc * rptim) % twoPi;
  em += dedt * t;
  inclm += didt * t;
  argpm += domdt * t;
  nodem += dnodt * t;
  mm += dmdt * t; // sgp4fix for negative inclinations
  // the following if statement should be commented out
  // if (inclm < 0.0)
  // {
  //   inclm = -inclm;
  //   argpm = argpm - pi;
  //   nodem = nodem + pi;
  // }

  /* - update resonances : numerical (euler-maclaurin) integration - */

  /* ------------------------- epoch restart ----------------------  */
  //   sgp4fix for propagator problems
  //   the following integration works for negative time steps and periods
  //   the specific changes are unknown because the original code was so convoluted
  // sgp4fix take out atime = 0.0 and fix for faster operation

  if (irez !== 0) {
    //  sgp4fix streamline check
    if (atime === 0.0 || t * atime <= 0.0 || Math.abs(t) < Math.abs(atime)) {
      atime = 0.0;
      xni = no;
      xli = xlamo;
    } // sgp4fix move check outside loop

    if (t > 0.0) {
      delt = stepp;
    } else {
      delt = stepn;
    }
    var iretn = 381; // added for do loop

    while (iretn === 381) {
      //  ------------------- dot terms calculated -------------
      //  ----------- near - synchronous resonance terms -------
      if (irez !== 2) {
        xndt = del1 * Math.sin(xli - fasx2) + del2 * Math.sin(2.0 * (xli - fasx4)) + del3 * Math.sin(3.0 * (xli - fasx6));
        xldot = xni + xfact;
        xnddt = del1 * Math.cos(xli - fasx2) + 2.0 * del2 * Math.cos(2.0 * (xli - fasx4)) + 3.0 * del3 * Math.cos(3.0 * (xli - fasx6));
        xnddt *= xldot;
      } else {
        // --------- near - half-day resonance terms --------
        xomi = argpo + argpdot * atime;
        x2omi = xomi + xomi;
        x2li = xli + xli;
        xndt = d2201 * Math.sin(x2omi + xli - g22) + d2211 * Math.sin(xli - g22) + d3210 * Math.sin(xomi + xli - g32) + d3222 * Math.sin(-xomi + xli - g32) + d4410 * Math.sin(x2omi + x2li - g44) + d4422 * Math.sin(x2li - g44) + d5220 * Math.sin(xomi + xli - g52) + d5232 * Math.sin(-xomi + xli - g52) + d5421 * Math.sin(xomi + x2li - g54) + d5433 * Math.sin(-xomi + x2li - g54);
        xldot = xni + xfact;
        xnddt = d2201 * Math.cos(x2omi + xli - g22) + d2211 * Math.cos(xli - g22) + d3210 * Math.cos(xomi + xli - g32) + d3222 * Math.cos(-xomi + xli - g32) + d5220 * Math.cos(xomi + xli - g52) + d5232 * Math.cos(-xomi + xli - g52) + 2.0 * d4410 * Math.cos(x2omi + x2li - g44) + d4422 * Math.cos(x2li - g44) + d5421 * Math.cos(xomi + x2li - g54) + d5433 * Math.cos(-xomi + x2li - g54);
        xnddt *= xldot;
      } //  ----------------------- integrator -------------------
      //  sgp4fix move end checks to end of routine

      if (Math.abs(t - atime) >= stepp) {
        iretn = 381;
      } else {
        ft = t - atime;
        iretn = 0;
      }
      if (iretn === 381) {
        xli += xldot * delt + xndt * step2;
        xni += xndt * delt + xnddt * step2;
        atime += delt;
      }
    }
    nm = xni + xndt * ft + xnddt * ft * ft * 0.5;
    xl = xli + xldot * ft + xndt * ft * ft * 0.5;
    if (irez !== 1) {
      mm = xl - 2.0 * nodem + 2.0 * theta;
      dndt = nm - no;
    } else {
      mm = xl - nodem - argpm + theta;
      dndt = nm - no;
    }
    nm = no + dndt;
  }
  return {
    atime: atime,
    em: em,
    argpm: argpm,
    inclm: inclm,
    xli: xli,
    mm: mm,
    xni: xni,
    nodem: nodem,
    dndt: dndt,
    nm: nm
  };
}

/*----------------------------------------------------------------------------
 *
 *                             procedure sgp4
 *
 *  this procedure is the sgp4 prediction model from space command. this is an
 *    updated and combined version of sgp4 and sdp4, which were originally
 *    published separately in spacetrack report //3. this version follows the
 *    methodology from the aiaa paper (2006) describing the history and
 *    development of the code.
 *
 *  author        : david vallado                  719-573-2600   28 jun 2005
 *
 *  inputs        :
 *    satrec  - initialised structure from sgp4init() call.
 *    tsince  - time since epoch (minutes)
 *
 *  outputs       :
 *    r           - position vector                     km
 *    v           - velocity                            km/sec
 *  return code - non-zero on error.
 *                   1 - mean elements, ecc >= 1.0 or ecc < -0.001 or a < 0.95 er
 *                   2 - mean motion less than 0.0
 *                   3 - pert elements, ecc < 0.0  or  ecc > 1.0
 *                   4 - semi-latus rectum < 0.0
 *                   5 - epoch elements are sub-orbital
 *                   6 - satellite has decayed
 *
 *  locals        :
 *    am          -
 *    axnl, aynl        -
 *    betal       -
 *    cosim   , sinim   , cosomm  , sinomm  , cnod    , snod    , cos2u   ,
 *    sin2u   , coseo1  , sineo1  , cosi    , sini    , cosip   , sinip   ,
 *    cosisq  , cossu   , sinsu   , cosu    , sinu
 *    delm        -
 *    delomg      -
 *    dndt        -
 *    eccm        -
 *    emsq        -
 *    ecose       -
 *    el2         -
 *    eo1         -
 *    eccp        -
 *    esine       -
 *    argpm       -
 *    argpp       -
 *    omgadf      -
 *    pl          -
 *    r           -
 *    rtemsq      -
 *    rdotl       -
 *    rl          -
 *    rvdot       -
 *    rvdotl      -
 *    su          -
 *    t2  , t3   , t4    , tc
 *    tem5, temp , temp1 , temp2  , tempa  , tempe  , templ
 *    u   , ux   , uy    , uz     , vx     , vy     , vz
 *    inclm       - inclination
 *    mm          - mean anomaly
 *    nm          - mean motion
 *    nodem       - right asc of ascending node
 *    xinc        -
 *    xincp       -
 *    xl          -
 *    xlm         -
 *    mp          -
 *    xmdf        -
 *    xmx         -
 *    xmy         -
 *    nodedf      -
 *    xnode       -
 *    nodep       -
 *    np          -
 *
 *  coupling      :
 *    getgravconst-
 *    dpper
 *    dspace
 *
 *  references    :
 *    hoots, roehrich, norad spacetrack report //3 1980
 *    hoots, norad spacetrack report //6 1986
 *    hoots, schumacher and glover 2004
 *    vallado, crawford, hujsak, kelso  2006
 ----------------------------------------------------------------------------*/

function sgp4(satrec, tsince) {
  /* eslint-disable no-param-reassign */
  var coseo1;
  var sineo1;
  var cosip;
  var sinip;
  var cosisq;
  var delm;
  var delomg;
  var eo1;
  var argpm;
  var argpp;
  var su;
  var t3;
  var t4;
  var tc;
  var tem5;
  var temp;
  var tempa;
  var tempe;
  var templ;
  var inclm;
  var mm;
  var nm;
  var nodem;
  var xincp;
  var xlm;
  var mp;
  var nodep;
  /* ------------------ set mathematical constants --------------- */
  // sgp4fix divisor for divide by zero check on inclination
  // the old check used 1.0 + cos(pi-1.0e-9), but then compared it to
  // 1.5 e-12, so the threshold was changed to 1.5e-12 for consistency

  var temp4 = 1.5e-12; // --------------------- clear sgp4 error flag -----------------

  satrec.t = tsince;
  satrec.error = 0; //  ------- update for secular gravity and atmospheric drag -----

  var xmdf = satrec.mo + satrec.mdot * satrec.t;
  var argpdf = satrec.argpo + satrec.argpdot * satrec.t;
  var nodedf = satrec.nodeo + satrec.nodedot * satrec.t;
  argpm = argpdf;
  mm = xmdf;
  var t2 = satrec.t * satrec.t;
  nodem = nodedf + satrec.nodecf * t2;
  tempa = 1.0 - satrec.cc1 * satrec.t;
  tempe = satrec.bstar * satrec.cc4 * satrec.t;
  templ = satrec.t2cof * t2;
  if (satrec.isimp !== 1) {
    delomg = satrec.omgcof * satrec.t; //  sgp4fix use mutliply for speed instead of pow

    var delmtemp = 1.0 + satrec.eta * Math.cos(xmdf);
    delm = satrec.xmcof * (delmtemp * delmtemp * delmtemp - satrec.delmo);
    temp = delomg + delm;
    mm = xmdf + temp;
    argpm = argpdf - temp;
    t3 = t2 * satrec.t;
    t4 = t3 * satrec.t;
    tempa = tempa - satrec.d2 * t2 - satrec.d3 * t3 - satrec.d4 * t4;
    tempe += satrec.bstar * satrec.cc5 * (Math.sin(mm) - satrec.sinmao);
    templ = templ + satrec.t3cof * t3 + t4 * (satrec.t4cof + satrec.t * satrec.t5cof);
  }
  nm = satrec.no;
  var em = satrec.ecco;
  inclm = satrec.inclo;
  if (satrec.method === 'd') {
    tc = satrec.t;
    var dspaceOptions = {
      irez: satrec.irez,
      d2201: satrec.d2201,
      d2211: satrec.d2211,
      d3210: satrec.d3210,
      d3222: satrec.d3222,
      d4410: satrec.d4410,
      d4422: satrec.d4422,
      d5220: satrec.d5220,
      d5232: satrec.d5232,
      d5421: satrec.d5421,
      d5433: satrec.d5433,
      dedt: satrec.dedt,
      del1: satrec.del1,
      del2: satrec.del2,
      del3: satrec.del3,
      didt: satrec.didt,
      dmdt: satrec.dmdt,
      dnodt: satrec.dnodt,
      domdt: satrec.domdt,
      argpo: satrec.argpo,
      argpdot: satrec.argpdot,
      t: satrec.t,
      tc: tc,
      gsto: satrec.gsto,
      xfact: satrec.xfact,
      xlamo: satrec.xlamo,
      no: satrec.no,
      atime: satrec.atime,
      em: em,
      argpm: argpm,
      inclm: inclm,
      xli: satrec.xli,
      mm: mm,
      xni: satrec.xni,
      nodem: nodem,
      nm: nm
    };
    var dspaceResult = dspace(dspaceOptions);
    em = dspaceResult.em;
    argpm = dspaceResult.argpm;
    inclm = dspaceResult.inclm;
    mm = dspaceResult.mm;
    nodem = dspaceResult.nodem;
    nm = dspaceResult.nm;
  }
  if (nm <= 0.0) {
    // printf("// error nm %f\n", nm);
    satrec.error = 2; // sgp4fix add return

    return [false, false];
  }
  var am = Math.pow(xke / nm, x2o3) * tempa * tempa;
  nm = xke / Math.pow(am, 1.5);
  em -= tempe; // fix tolerance for error recognition
  // sgp4fix am is fixed from the previous nm check

  if (em >= 1.0 || em < -0.001) {
    // || (am < 0.95)
    // printf("// error em %f\n", em);
    satrec.error = 1; // sgp4fix to return if there is an error in eccentricity

    return [false, false];
  } //  sgp4fix fix tolerance to avoid a divide by zero

  if (em < 1.0e-6) {
    em = 1.0e-6;
  }
  mm += satrec.no * templ;
  xlm = mm + argpm + nodem;
  nodem %= twoPi;
  argpm %= twoPi;
  xlm %= twoPi;
  mm = (xlm - argpm - nodem) % twoPi; // ----------------- compute extra mean quantities -------------

  var sinim = Math.sin(inclm);
  var cosim = Math.cos(inclm); // -------------------- add lunar-solar periodics --------------

  var ep = em;
  xincp = inclm;
  argpp = argpm;
  nodep = nodem;
  mp = mm;
  sinip = sinim;
  cosip = cosim;
  if (satrec.method === 'd') {
    var dpperParameters = {
      inclo: satrec.inclo,
      init: 'n',
      ep: ep,
      inclp: xincp,
      nodep: nodep,
      argpp: argpp,
      mp: mp,
      opsmode: satrec.operationmode
    };
    var dpperResult = dpper(satrec, dpperParameters);
    ep = dpperResult.ep;
    nodep = dpperResult.nodep;
    argpp = dpperResult.argpp;
    mp = dpperResult.mp;
    xincp = dpperResult.inclp;
    if (xincp < 0.0) {
      xincp = -xincp;
      nodep += pi;
      argpp -= pi;
    }
    if (ep < 0.0 || ep > 1.0) {
      //  printf("// error ep %f\n", ep);
      satrec.error = 3; //  sgp4fix add return

      return [false, false];
    }
  } //  -------------------- long period periodics ------------------

  if (satrec.method === 'd') {
    sinip = Math.sin(xincp);
    cosip = Math.cos(xincp);
    satrec.aycof = -0.5 * j3oj2 * sinip; //  sgp4fix for divide by zero for xincp = 180 deg

    if (Math.abs(cosip + 1.0) > 1.5e-12) {
      satrec.xlcof = -0.25 * j3oj2 * sinip * (3.0 + 5.0 * cosip) / (1.0 + cosip);
    } else {
      satrec.xlcof = -0.25 * j3oj2 * sinip * (3.0 + 5.0 * cosip) / temp4;
    }
  }
  var axnl = ep * Math.cos(argpp);
  temp = 1.0 / (am * (1.0 - ep * ep));
  var aynl = ep * Math.sin(argpp) + temp * satrec.aycof;
  var xl = mp + argpp + nodep + temp * satrec.xlcof * axnl; // --------------------- solve kepler's equation ---------------

  var u = (xl - nodep) % twoPi;
  eo1 = u;
  tem5 = 9999.9;
  var ktr = 1; //    sgp4fix for kepler iteration
  //    the following iteration needs better limits on corrections

  while (Math.abs(tem5) >= 1.0e-12 && ktr <= 10) {
    sineo1 = Math.sin(eo1);
    coseo1 = Math.cos(eo1);
    tem5 = 1.0 - coseo1 * axnl - sineo1 * aynl;
    tem5 = (u - aynl * coseo1 + axnl * sineo1 - eo1) / tem5;
    if (Math.abs(tem5) >= 0.95) {
      if (tem5 > 0.0) {
        tem5 = 0.95;
      } else {
        tem5 = -0.95;
      }
    }
    eo1 += tem5;
    ktr += 1;
  } //  ------------- short period preliminary quantities -----------

  var ecose = axnl * coseo1 + aynl * sineo1;
  var esine = axnl * sineo1 - aynl * coseo1;
  var el2 = axnl * axnl + aynl * aynl;
  var pl = am * (1.0 - el2);
  if (pl < 0.0) {
    //  printf("// error pl %f\n", pl);
    satrec.error = 4; //  sgp4fix add return

    return [false, false];
  }
  var rl = am * (1.0 - ecose);
  var rdotl = Math.sqrt(am) * esine / rl;
  var rvdotl = Math.sqrt(pl) / rl;
  var betal = Math.sqrt(1.0 - el2);
  temp = esine / (1.0 + betal);
  var sinu = am / rl * (sineo1 - aynl - axnl * temp);
  var cosu = am / rl * (coseo1 - axnl + aynl * temp);
  su = Math.atan2(sinu, cosu);
  var sin2u = (cosu + cosu) * sinu;
  var cos2u = 1.0 - 2.0 * sinu * sinu;
  temp = 1.0 / pl;
  var temp1 = 0.5 * j2 * temp;
  var temp2 = temp1 * temp; // -------------- update for short period periodics ------------

  if (satrec.method === 'd') {
    cosisq = cosip * cosip;
    satrec.con41 = 3.0 * cosisq - 1.0;
    satrec.x1mth2 = 1.0 - cosisq;
    satrec.x7thm1 = 7.0 * cosisq - 1.0;
  }
  var mrt = rl * (1.0 - 1.5 * temp2 * betal * satrec.con41) + 0.5 * temp1 * satrec.x1mth2 * cos2u; // sgp4fix for decaying satellites

  if (mrt < 1.0) {
    // printf("// decay condition %11.6f \n",mrt);
    satrec.error = 6;
    return {
      position: false,
      velocity: false
    };
  }
  su -= 0.25 * temp2 * satrec.x7thm1 * sin2u;
  var xnode = nodep + 1.5 * temp2 * cosip * sin2u;
  var xinc = xincp + 1.5 * temp2 * cosip * sinip * cos2u;
  var mvt = rdotl - nm * temp1 * satrec.x1mth2 * sin2u / xke;
  var rvdot = rvdotl + nm * temp1 * (satrec.x1mth2 * cos2u + 1.5 * satrec.con41) / xke; // --------------------- orientation vectors -------------------

  var sinsu = Math.sin(su);
  var cossu = Math.cos(su);
  var snod = Math.sin(xnode);
  var cnod = Math.cos(xnode);
  var sini = Math.sin(xinc);
  var cosi = Math.cos(xinc);
  var xmx = -snod * cosi;
  var xmy = cnod * cosi;
  var ux = xmx * sinsu + cnod * cossu;
  var uy = xmy * sinsu + snod * cossu;
  var uz = sini * sinsu;
  var vx = xmx * cossu - cnod * sinsu;
  var vy = xmy * cossu - snod * sinsu;
  var vz = sini * cossu; // --------- position and velocity (in km and km/sec) ----------

  var r = {
    x: mrt * ux * earthRadius,
    y: mrt * uy * earthRadius,
    z: mrt * uz * earthRadius
  };
  var v = {
    x: (mvt * ux + rvdot * vx) * vkmpersec,
    y: (mvt * uy + rvdot * vy) * vkmpersec,
    z: (mvt * uz + rvdot * vz) * vkmpersec
  };
  return {
    position: r,
    velocity: v
  };
  /* eslint-enable no-param-reassign */
}

/*-----------------------------------------------------------------------------
 *
 *                             procedure sgp4init
 *
 *  this procedure initializes variables for sgp4.
 *
 *  author        : david vallado                  719-573-2600   28 jun 2005
 *  author        : david vallado                  719-573-2600   28 jun 2005
 *
 *  inputs        :
 *    opsmode     - mode of operation afspc or improved 'a', 'i'
 *    satn        - satellite number
 *    bstar       - sgp4 type drag coefficient              kg/m2er
 *    ecco        - eccentricity
 *    epoch       - epoch time in days from jan 0, 1950. 0 hr
 *    argpo       - argument of perigee (output if ds)
 *    inclo       - inclination
 *    mo          - mean anomaly (output if ds)
 *    no          - mean motion
 *    nodeo       - right ascension of ascending node
 *
 *  outputs       :
 *    rec      - common values for subsequent calls
 *    return code - non-zero on error.
 *                   1 - mean elements, ecc >= 1.0 or ecc < -0.001 or a < 0.95 er
 *                   2 - mean motion less than 0.0
 *                   3 - pert elements, ecc < 0.0  or  ecc > 1.0
 *                   4 - semi-latus rectum < 0.0
 *                   5 - epoch elements are sub-orbital
 *                   6 - satellite has decayed
 *
 *  locals        :
 *    cnodm  , snodm  , cosim  , sinim  , cosomm , sinomm
 *    cc1sq  , cc2    , cc3
 *    coef   , coef1
 *    cosio4      -
 *    day         -
 *    dndt        -
 *    em          - eccentricity
 *    emsq        - eccentricity squared
 *    eeta        -
 *    etasq       -
 *    gam         -
 *    argpm       - argument of perigee
 *    nodem       -
 *    inclm       - inclination
 *    mm          - mean anomaly
 *    nm          - mean motion
 *    perige      - perigee
 *    pinvsq      -
 *    psisq       -
 *    qzms24      -
 *    rtemsq      -
 *    s1, s2, s3, s4, s5, s6, s7          -
 *    sfour       -
 *    ss1, ss2, ss3, ss4, ss5, ss6, ss7         -
 *    sz1, sz2, sz3
 *    sz11, sz12, sz13, sz21, sz22, sz23, sz31, sz32, sz33        -
 *    tc          -
 *    temp        -
 *    temp1, temp2, temp3       -
 *    tsi         -
 *    xpidot      -
 *    xhdot1      -
 *    z1, z2, z3          -
 *    z11, z12, z13, z21, z22, z23, z31, z32, z33         -
 *
 *  coupling      :
 *    getgravconst-
 *    initl       -
 *    dscom       -
 *    dpper       -
 *    dsinit      -
 *    sgp4        -
 *
 *  references    :
 *    hoots, roehrich, norad spacetrack report #3 1980
 *    hoots, norad spacetrack report #6 1986
 *    hoots, schumacher and glover 2004
 *    vallado, crawford, hujsak, kelso  2006
 ----------------------------------------------------------------------------*/

function sgp4init(satrec, options) {
  /* eslint-disable no-param-reassign */
  var opsmode = options.opsmode,
    satn = options.satn,
    epoch = options.epoch,
    xbstar = options.xbstar,
    xecco = options.xecco,
    xargpo = options.xargpo,
    xinclo = options.xinclo,
    xmo = options.xmo,
    xno = options.xno,
    xnodeo = options.xnodeo;
  var cosim;
  var sinim;
  var cc1sq;
  var cc2;
  var cc3;
  var coef;
  var coef1;
  var cosio4;
  var em;
  var emsq;
  var eeta;
  var etasq;
  var argpm;
  var nodem;
  var inclm;
  var mm;
  var nm;
  var perige;
  var pinvsq;
  var psisq;
  var qzms24;
  var s1;
  var s2;
  var s3;
  var s4;
  var s5;
  var sfour;
  var ss1;
  var ss2;
  var ss3;
  var ss4;
  var ss5;
  var sz1;
  var sz3;
  var sz11;
  var sz13;
  var sz21;
  var sz23;
  var sz31;
  var sz33;
  var tc;
  var temp;
  var temp1;
  var temp2;
  var temp3;
  var tsi;
  var xpidot;
  var xhdot1;
  var z1;
  var z3;
  var z11;
  var z13;
  var z21;
  var z23;
  var z31;
  var z33;
  /* ------------------------ initialization --------------------- */
  // sgp4fix divisor for divide by zero check on inclination
  // the old check used 1.0 + Math.cos(pi-1.0e-9), but then compared it to
  // 1.5 e-12, so the threshold was changed to 1.5e-12 for consistency

  var temp4 = 1.5e-12; // ----------- set all near earth variables to zero ------------

  satrec.isimp = 0;
  satrec.method = 'n';
  satrec.aycof = 0.0;
  satrec.con41 = 0.0;
  satrec.cc1 = 0.0;
  satrec.cc4 = 0.0;
  satrec.cc5 = 0.0;
  satrec.d2 = 0.0;
  satrec.d3 = 0.0;
  satrec.d4 = 0.0;
  satrec.delmo = 0.0;
  satrec.eta = 0.0;
  satrec.argpdot = 0.0;
  satrec.omgcof = 0.0;
  satrec.sinmao = 0.0;
  satrec.t = 0.0;
  satrec.t2cof = 0.0;
  satrec.t3cof = 0.0;
  satrec.t4cof = 0.0;
  satrec.t5cof = 0.0;
  satrec.x1mth2 = 0.0;
  satrec.x7thm1 = 0.0;
  satrec.mdot = 0.0;
  satrec.nodedot = 0.0;
  satrec.xlcof = 0.0;
  satrec.xmcof = 0.0;
  satrec.nodecf = 0.0; // ----------- set all deep space variables to zero ------------

  satrec.irez = 0;
  satrec.d2201 = 0.0;
  satrec.d2211 = 0.0;
  satrec.d3210 = 0.0;
  satrec.d3222 = 0.0;
  satrec.d4410 = 0.0;
  satrec.d4422 = 0.0;
  satrec.d5220 = 0.0;
  satrec.d5232 = 0.0;
  satrec.d5421 = 0.0;
  satrec.d5433 = 0.0;
  satrec.dedt = 0.0;
  satrec.del1 = 0.0;
  satrec.del2 = 0.0;
  satrec.del3 = 0.0;
  satrec.didt = 0.0;
  satrec.dmdt = 0.0;
  satrec.dnodt = 0.0;
  satrec.domdt = 0.0;
  satrec.e3 = 0.0;
  satrec.ee2 = 0.0;
  satrec.peo = 0.0;
  satrec.pgho = 0.0;
  satrec.pho = 0.0;
  satrec.pinco = 0.0;
  satrec.plo = 0.0;
  satrec.se2 = 0.0;
  satrec.se3 = 0.0;
  satrec.sgh2 = 0.0;
  satrec.sgh3 = 0.0;
  satrec.sgh4 = 0.0;
  satrec.sh2 = 0.0;
  satrec.sh3 = 0.0;
  satrec.si2 = 0.0;
  satrec.si3 = 0.0;
  satrec.sl2 = 0.0;
  satrec.sl3 = 0.0;
  satrec.sl4 = 0.0;
  satrec.gsto = 0.0;
  satrec.xfact = 0.0;
  satrec.xgh2 = 0.0;
  satrec.xgh3 = 0.0;
  satrec.xgh4 = 0.0;
  satrec.xh2 = 0.0;
  satrec.xh3 = 0.0;
  satrec.xi2 = 0.0;
  satrec.xi3 = 0.0;
  satrec.xl2 = 0.0;
  satrec.xl3 = 0.0;
  satrec.xl4 = 0.0;
  satrec.xlamo = 0.0;
  satrec.zmol = 0.0;
  satrec.zmos = 0.0;
  satrec.atime = 0.0;
  satrec.xli = 0.0;
  satrec.xni = 0.0; // sgp4fix - note the following variables are also passed directly via satrec.
  // it is possible to streamline the sgp4init call by deleting the "x"
  // variables, but the user would need to set the satrec.* values first. we
  // include the additional assignments in case twoline2rv is not used.

  satrec.bstar = xbstar;
  satrec.ecco = xecco;
  satrec.argpo = xargpo;
  satrec.inclo = xinclo;
  satrec.mo = xmo;
  satrec.no = xno;
  satrec.nodeo = xnodeo; //  sgp4fix add opsmode

  satrec.operationmode = opsmode; // ------------------------ earth constants -----------------------
  // sgp4fix identify constants and allow alternate values

  var ss = 78.0 / earthRadius + 1.0; // sgp4fix use multiply for speed instead of pow

  var qzms2ttemp = (120.0 - 78.0) / earthRadius;
  var qzms2t = qzms2ttemp * qzms2ttemp * qzms2ttemp * qzms2ttemp;
  satrec.init = 'y';
  satrec.t = 0.0;
  var initlOptions = {
    satn: satn,
    ecco: satrec.ecco,
    epoch: epoch,
    inclo: satrec.inclo,
    no: satrec.no,
    method: satrec.method,
    opsmode: satrec.operationmode
  };
  var initlResult = initl(initlOptions);
  var ao = initlResult.ao,
    con42 = initlResult.con42,
    cosio = initlResult.cosio,
    cosio2 = initlResult.cosio2,
    eccsq = initlResult.eccsq,
    omeosq = initlResult.omeosq,
    posq = initlResult.posq,
    rp = initlResult.rp,
    rteosq = initlResult.rteosq,
    sinio = initlResult.sinio;
  satrec.no = initlResult.no;
  satrec.con41 = initlResult.con41;
  satrec.gsto = initlResult.gsto;
  satrec.error = 0; // sgp4fix remove this check as it is unnecessary
  // the mrt check in sgp4 handles decaying satellite cases even if the starting
  // condition is below the surface of te earth
  // if (rp < 1.0)
  // {
  //   printf("// *** satn%d epoch elts sub-orbital ***\n", satn);
  //   satrec.error = 5;
  // }

  if (omeosq >= 0.0 || satrec.no >= 0.0) {
    satrec.isimp = 0;
    if (rp < 220.0 / earthRadius + 1.0) {
      satrec.isimp = 1;
    }
    sfour = ss;
    qzms24 = qzms2t;
    perige = (rp - 1.0) * earthRadius; // - for perigees below 156 km, s and qoms2t are altered -

    if (perige < 156.0) {
      sfour = perige - 78.0;
      if (perige < 98.0) {
        sfour = 20.0;
      } // sgp4fix use multiply for speed instead of pow

      var qzms24temp = (120.0 - sfour) / earthRadius;
      qzms24 = qzms24temp * qzms24temp * qzms24temp * qzms24temp;
      sfour = sfour / earthRadius + 1.0;
    }
    pinvsq = 1.0 / posq;
    tsi = 1.0 / (ao - sfour);
    satrec.eta = ao * satrec.ecco * tsi;
    etasq = satrec.eta * satrec.eta;
    eeta = satrec.ecco * satrec.eta;
    psisq = Math.abs(1.0 - etasq);
    coef = qzms24 * Math.pow(tsi, 4.0);
    coef1 = coef / Math.pow(psisq, 3.5);
    cc2 = coef1 * satrec.no * (ao * (1.0 + 1.5 * etasq + eeta * (4.0 + etasq)) + 0.375 * j2 * tsi / psisq * satrec.con41 * (8.0 + 3.0 * etasq * (8.0 + etasq)));
    satrec.cc1 = satrec.bstar * cc2;
    cc3 = 0.0;
    if (satrec.ecco > 1.0e-4) {
      cc3 = -2.0 * coef * tsi * j3oj2 * satrec.no * sinio / satrec.ecco;
    }
    satrec.x1mth2 = 1.0 - cosio2;
    satrec.cc4 = 2.0 * satrec.no * coef1 * ao * omeosq * (satrec.eta * (2.0 + 0.5 * etasq) + satrec.ecco * (0.5 + 2.0 * etasq) - j2 * tsi / (ao * psisq) * (-3.0 * satrec.con41 * (1.0 - 2.0 * eeta + etasq * (1.5 - 0.5 * eeta)) + 0.75 * satrec.x1mth2 * (2.0 * etasq - eeta * (1.0 + etasq)) * Math.cos(2.0 * satrec.argpo)));
    satrec.cc5 = 2.0 * coef1 * ao * omeosq * (1.0 + 2.75 * (etasq + eeta) + eeta * etasq);
    cosio4 = cosio2 * cosio2;
    temp1 = 1.5 * j2 * pinvsq * satrec.no;
    temp2 = 0.5 * temp1 * j2 * pinvsq;
    temp3 = -0.46875 * j4 * pinvsq * pinvsq * satrec.no;
    satrec.mdot = satrec.no + 0.5 * temp1 * rteosq * satrec.con41 + 0.0625 * temp2 * rteosq * (13.0 - 78.0 * cosio2 + 137.0 * cosio4);
    satrec.argpdot = -0.5 * temp1 * con42 + 0.0625 * temp2 * (7.0 - 114.0 * cosio2 + 395.0 * cosio4) + temp3 * (3.0 - 36.0 * cosio2 + 49.0 * cosio4);
    xhdot1 = -temp1 * cosio;
    satrec.nodedot = xhdot1 + (0.5 * temp2 * (4.0 - 19.0 * cosio2) + 2.0 * temp3 * (3.0 - 7.0 * cosio2)) * cosio;
    xpidot = satrec.argpdot + satrec.nodedot;
    satrec.omgcof = satrec.bstar * cc3 * Math.cos(satrec.argpo);
    satrec.xmcof = 0.0;
    if (satrec.ecco > 1.0e-4) {
      satrec.xmcof = -x2o3 * coef * satrec.bstar / eeta;
    }
    satrec.nodecf = 3.5 * omeosq * xhdot1 * satrec.cc1;
    satrec.t2cof = 1.5 * satrec.cc1; // sgp4fix for divide by zero with xinco = 180 deg

    if (Math.abs(cosio + 1.0) > 1.5e-12) {
      satrec.xlcof = -0.25 * j3oj2 * sinio * (3.0 + 5.0 * cosio) / (1.0 + cosio);
    } else {
      satrec.xlcof = -0.25 * j3oj2 * sinio * (3.0 + 5.0 * cosio) / temp4;
    }
    satrec.aycof = -0.5 * j3oj2 * sinio; // sgp4fix use multiply for speed instead of pow

    var delmotemp = 1.0 + satrec.eta * Math.cos(satrec.mo);
    satrec.delmo = delmotemp * delmotemp * delmotemp;
    satrec.sinmao = Math.sin(satrec.mo);
    satrec.x7thm1 = 7.0 * cosio2 - 1.0; // --------------- deep space initialization -------------

    if (2 * pi / satrec.no >= 225.0) {
      satrec.method = 'd';
      satrec.isimp = 1;
      tc = 0.0;
      inclm = satrec.inclo;
      var dscomOptions = {
        epoch: epoch,
        ep: satrec.ecco,
        argpp: satrec.argpo,
        tc: tc,
        inclp: satrec.inclo,
        nodep: satrec.nodeo,
        np: satrec.no,
        e3: satrec.e3,
        ee2: satrec.ee2,
        peo: satrec.peo,
        pgho: satrec.pgho,
        pho: satrec.pho,
        pinco: satrec.pinco,
        plo: satrec.plo,
        se2: satrec.se2,
        se3: satrec.se3,
        sgh2: satrec.sgh2,
        sgh3: satrec.sgh3,
        sgh4: satrec.sgh4,
        sh2: satrec.sh2,
        sh3: satrec.sh3,
        si2: satrec.si2,
        si3: satrec.si3,
        sl2: satrec.sl2,
        sl3: satrec.sl3,
        sl4: satrec.sl4,
        xgh2: satrec.xgh2,
        xgh3: satrec.xgh3,
        xgh4: satrec.xgh4,
        xh2: satrec.xh2,
        xh3: satrec.xh3,
        xi2: satrec.xi2,
        xi3: satrec.xi3,
        xl2: satrec.xl2,
        xl3: satrec.xl3,
        xl4: satrec.xl4,
        zmol: satrec.zmol,
        zmos: satrec.zmos
      };
      var dscomResult = dscom(dscomOptions);
      satrec.e3 = dscomResult.e3;
      satrec.ee2 = dscomResult.ee2;
      satrec.peo = dscomResult.peo;
      satrec.pgho = dscomResult.pgho;
      satrec.pho = dscomResult.pho;
      satrec.pinco = dscomResult.pinco;
      satrec.plo = dscomResult.plo;
      satrec.se2 = dscomResult.se2;
      satrec.se3 = dscomResult.se3;
      satrec.sgh2 = dscomResult.sgh2;
      satrec.sgh3 = dscomResult.sgh3;
      satrec.sgh4 = dscomResult.sgh4;
      satrec.sh2 = dscomResult.sh2;
      satrec.sh3 = dscomResult.sh3;
      satrec.si2 = dscomResult.si2;
      satrec.si3 = dscomResult.si3;
      satrec.sl2 = dscomResult.sl2;
      satrec.sl3 = dscomResult.sl3;
      satrec.sl4 = dscomResult.sl4;
      sinim = dscomResult.sinim;
      cosim = dscomResult.cosim;
      em = dscomResult.em;
      emsq = dscomResult.emsq;
      s1 = dscomResult.s1;
      s2 = dscomResult.s2;
      s3 = dscomResult.s3;
      s4 = dscomResult.s4;
      s5 = dscomResult.s5;
      ss1 = dscomResult.ss1;
      ss2 = dscomResult.ss2;
      ss3 = dscomResult.ss3;
      ss4 = dscomResult.ss4;
      ss5 = dscomResult.ss5;
      sz1 = dscomResult.sz1;
      sz3 = dscomResult.sz3;
      sz11 = dscomResult.sz11;
      sz13 = dscomResult.sz13;
      sz21 = dscomResult.sz21;
      sz23 = dscomResult.sz23;
      sz31 = dscomResult.sz31;
      sz33 = dscomResult.sz33;
      satrec.xgh2 = dscomResult.xgh2;
      satrec.xgh3 = dscomResult.xgh3;
      satrec.xgh4 = dscomResult.xgh4;
      satrec.xh2 = dscomResult.xh2;
      satrec.xh3 = dscomResult.xh3;
      satrec.xi2 = dscomResult.xi2;
      satrec.xi3 = dscomResult.xi3;
      satrec.xl2 = dscomResult.xl2;
      satrec.xl3 = dscomResult.xl3;
      satrec.xl4 = dscomResult.xl4;
      satrec.zmol = dscomResult.zmol;
      satrec.zmos = dscomResult.zmos;
      nm = dscomResult.nm;
      z1 = dscomResult.z1;
      z3 = dscomResult.z3;
      z11 = dscomResult.z11;
      z13 = dscomResult.z13;
      z21 = dscomResult.z21;
      z23 = dscomResult.z23;
      z31 = dscomResult.z31;
      z33 = dscomResult.z33;
      var dpperOptions = {
        inclo: inclm,
        init: satrec.init,
        ep: satrec.ecco,
        inclp: satrec.inclo,
        nodep: satrec.nodeo,
        argpp: satrec.argpo,
        mp: satrec.mo,
        opsmode: satrec.operationmode
      };
      var dpperResult = dpper(satrec, dpperOptions);
      satrec.ecco = dpperResult.ep;
      satrec.inclo = dpperResult.inclp;
      satrec.nodeo = dpperResult.nodep;
      satrec.argpo = dpperResult.argpp;
      satrec.mo = dpperResult.mp;
      argpm = 0.0;
      nodem = 0.0;
      mm = 0.0;
      var dsinitOptions = {
        cosim: cosim,
        emsq: emsq,
        argpo: satrec.argpo,
        s1: s1,
        s2: s2,
        s3: s3,
        s4: s4,
        s5: s5,
        sinim: sinim,
        ss1: ss1,
        ss2: ss2,
        ss3: ss3,
        ss4: ss4,
        ss5: ss5,
        sz1: sz1,
        sz3: sz3,
        sz11: sz11,
        sz13: sz13,
        sz21: sz21,
        sz23: sz23,
        sz31: sz31,
        sz33: sz33,
        t: satrec.t,
        tc: tc,
        gsto: satrec.gsto,
        mo: satrec.mo,
        mdot: satrec.mdot,
        no: satrec.no,
        nodeo: satrec.nodeo,
        nodedot: satrec.nodedot,
        xpidot: xpidot,
        z1: z1,
        z3: z3,
        z11: z11,
        z13: z13,
        z21: z21,
        z23: z23,
        z31: z31,
        z33: z33,
        ecco: satrec.ecco,
        eccsq: eccsq,
        em: em,
        argpm: argpm,
        inclm: inclm,
        mm: mm,
        nm: nm,
        nodem: nodem,
        irez: satrec.irez,
        atime: satrec.atime,
        d2201: satrec.d2201,
        d2211: satrec.d2211,
        d3210: satrec.d3210,
        d3222: satrec.d3222,
        d4410: satrec.d4410,
        d4422: satrec.d4422,
        d5220: satrec.d5220,
        d5232: satrec.d5232,
        d5421: satrec.d5421,
        d5433: satrec.d5433,
        dedt: satrec.dedt,
        didt: satrec.didt,
        dmdt: satrec.dmdt,
        dnodt: satrec.dnodt,
        domdt: satrec.domdt,
        del1: satrec.del1,
        del2: satrec.del2,
        del3: satrec.del3,
        xfact: satrec.xfact,
        xlamo: satrec.xlamo,
        xli: satrec.xli,
        xni: satrec.xni
      };
      var dsinitResult = dsinit(dsinitOptions);
      satrec.irez = dsinitResult.irez;
      satrec.atime = dsinitResult.atime;
      satrec.d2201 = dsinitResult.d2201;
      satrec.d2211 = dsinitResult.d2211;
      satrec.d3210 = dsinitResult.d3210;
      satrec.d3222 = dsinitResult.d3222;
      satrec.d4410 = dsinitResult.d4410;
      satrec.d4422 = dsinitResult.d4422;
      satrec.d5220 = dsinitResult.d5220;
      satrec.d5232 = dsinitResult.d5232;
      satrec.d5421 = dsinitResult.d5421;
      satrec.d5433 = dsinitResult.d5433;
      satrec.dedt = dsinitResult.dedt;
      satrec.didt = dsinitResult.didt;
      satrec.dmdt = dsinitResult.dmdt;
      satrec.dnodt = dsinitResult.dnodt;
      satrec.domdt = dsinitResult.domdt;
      satrec.del1 = dsinitResult.del1;
      satrec.del2 = dsinitResult.del2;
      satrec.del3 = dsinitResult.del3;
      satrec.xfact = dsinitResult.xfact;
      satrec.xlamo = dsinitResult.xlamo;
      satrec.xli = dsinitResult.xli;
      satrec.xni = dsinitResult.xni;
    } // ----------- set variables if not deep space -----------

    if (satrec.isimp !== 1) {
      cc1sq = satrec.cc1 * satrec.cc1;
      satrec.d2 = 4.0 * ao * tsi * cc1sq;
      temp = satrec.d2 * tsi * satrec.cc1 / 3.0;
      satrec.d3 = (17.0 * ao + sfour) * temp;
      satrec.d4 = 0.5 * temp * ao * tsi * (221.0 * ao + 31.0 * sfour) * satrec.cc1;
      satrec.t3cof = satrec.d2 + 2.0 * cc1sq;
      satrec.t4cof = 0.25 * (3.0 * satrec.d3 + satrec.cc1 * (12.0 * satrec.d2 + 10.0 * cc1sq));
      satrec.t5cof = 0.2 * (3.0 * satrec.d4 + 12.0 * satrec.cc1 * satrec.d3 + 6.0 * satrec.d2 * satrec.d2 + 15.0 * cc1sq * (2.0 * satrec.d2 + cc1sq));
    }
    /* finally propogate to zero epoch to initialize all others. */
    // sgp4fix take out check to let satellites process until they are actually below earth surface
    // if(satrec.error == 0)
  }

  sgp4(satrec, 0);
  satrec.init = 'n';
  /* eslint-enable no-param-reassign */
}

/* -----------------------------------------------------------------------------
 *
 *                           function twoline2rv
 *
 *  this function converts the two line element set character string data to
 *    variables and initializes the sgp4 variables. several intermediate varaibles
 *    and quantities are determined. note that the result is a structure so multiple
 *    satellites can be processed simultaneously without having to reinitialize. the
 *    verification mode is an important option that permits quick checks of any
 *    changes to the underlying technical theory. this option works using a
 *    modified tle file in which the start, stop, and delta time values are
 *    included at the end of the second line of data. this only works with the
 *    verification mode. the catalog mode simply propagates from -1440 to 1440 min
 *    from epoch and is useful when performing entire catalog runs.
 *
 *  author        : david vallado                  719-573-2600    1 mar 2001
 *
 *  inputs        :
 *    longstr1    - first line of the tle
 *    longstr2    - second line of the tle
 *    typerun     - type of run                    verification 'v', catalog 'c',
 *                                                 manual 'm'
 *    typeinput   - type of manual input           mfe 'm', epoch 'e', dayofyr 'd'
 *    opsmode     - mode of operation afspc or improved 'a', 'i'
 *    whichconst  - which set of constants to use  72, 84
 *
 *  outputs       :
 *    satrec      - structure containing all the sgp4 satellite information
 *
 *  coupling      :
 *    getgravconst-
 *    days2mdhms  - conversion of days to month, day, hour, minute, second
 *    jday        - convert day month year hour minute second into julian date
 *    sgp4init    - initialize the sgp4 variables
 *
 *  references    :
 *    norad spacetrack report #3
 *    vallado, crawford, hujsak, kelso  2006
 --------------------------------------------------------------------------- */

/**
 * Return a Satellite imported from two lines of TLE data.
 *
 * Provide the two TLE lines as strings `longstr1` and `longstr2`,
 * and select which standard set of gravitational constants you want
 * by providing `gravity_constants`:
 *
 * `sgp4.propagation.wgs72` - Standard WGS 72 model
 * `sgp4.propagation.wgs84` - More recent WGS 84 model
 * `sgp4.propagation.wgs72old` - Legacy support for old SGP4 behavior
 *
 * Normally, computations are made using letious recent improvements
 * to the algorithm.  If you want to turn some of these off and go
 * back into "afspc" mode, then set `afspc_mode` to `True`.
 */

function twoline2satrec(longstr1, longstr2) {
  var opsmode = 'i';
  var xpdotp = 1440.0 / (2.0 * pi); // 229.1831180523293;

  var year = 0;
  var satrec = {};
  satrec.error = 0;
  satrec.satnum = longstr1.substring(2, 7);
  satrec.epochyr = parseInt(longstr1.substring(18, 20), 10);
  satrec.epochdays = parseFloat(longstr1.substring(20, 32));
  satrec.ndot = parseFloat(longstr1.substring(33, 43));
  satrec.nddot = parseFloat(".".concat(parseInt(longstr1.substring(44, 50), 10), "E").concat(longstr1.substring(50, 52)));
  satrec.bstar = parseFloat("".concat(longstr1.substring(53, 54), ".").concat(parseInt(longstr1.substring(54, 59), 10), "E").concat(longstr1.substring(59, 61))); // satrec.satnum = longstr2.substring(2, 7);

  satrec.inclo = parseFloat(longstr2.substring(8, 16));
  satrec.nodeo = parseFloat(longstr2.substring(17, 25));
  satrec.ecco = parseFloat(".".concat(longstr2.substring(26, 33)));
  satrec.argpo = parseFloat(longstr2.substring(34, 42));
  satrec.mo = parseFloat(longstr2.substring(43, 51));
  satrec.no = parseFloat(longstr2.substring(52, 63)); // ---- find no, ndot, nddot ----

  satrec.no /= xpdotp; //   rad/min
  // satrec.nddot= satrec.nddot * Math.pow(10.0, nexp);
  // satrec.bstar= satrec.bstar * Math.pow(10.0, ibexp);
  // ---- convert to sgp4 units ----

  satrec.a = Math.pow(satrec.no * tumin, -2.0 / 3.0);
  satrec.ndot /= xpdotp * 1440.0; // ? * minperday

  satrec.nddot /= xpdotp * 1440.0 * 1440; // ---- find standard orbital elements ----

  satrec.inclo *= deg2rad;
  satrec.nodeo *= deg2rad;
  satrec.argpo *= deg2rad;
  satrec.mo *= deg2rad;
  satrec.alta = satrec.a * (1.0 + satrec.ecco) - 1.0;
  satrec.altp = satrec.a * (1.0 - satrec.ecco) - 1.0; // ----------------------------------------------------------------
  // find sgp4epoch time of element set
  // remember that sgp4 uses units of days from 0 jan 1950 (sgp4epoch)
  // and minutes from the epoch (time)
  // ----------------------------------------------------------------
  // ---------------- temp fix for years from 1957-2056 -------------------
  // --------- correct fix will occur when year is 4-digit in tle ---------

  if (satrec.epochyr < 57) {
    year = satrec.epochyr + 2000;
  } else {
    year = satrec.epochyr + 1900;
  }
  var mdhmsResult = days2mdhms(year, satrec.epochdays);
  var mon = mdhmsResult.mon,
    day = mdhmsResult.day,
    hr = mdhmsResult.hr,
    minute = mdhmsResult.minute,
    sec = mdhmsResult.sec;
  satrec.jdsatepoch = jday(year, mon, day, hr, minute, sec); //  ---------------- initialize the orbit at sgp4epoch -------------------

  sgp4init(satrec, {
    opsmode: opsmode,
    satn: satrec.satnum,
    epoch: satrec.jdsatepoch - 2433281.5,
    xbstar: satrec.bstar,
    xecco: satrec.ecco,
    xargpo: satrec.argpo,
    xinclo: satrec.inclo,
    xmo: satrec.mo,
    xno: satrec.no,
    xnodeo: satrec.nodeo
  });
  return satrec;
}
function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
}
function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) return _arrayLikeToArray(arr);
}
function _iterableToArray(iter) {
  if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter);
}
function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}
function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
  return arr2;
}
function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function propagate() {
  for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  // Return a position and velocity vector for a given date and time.
  var satrec = args[0];
  var date = Array.prototype.slice.call(args, 1);
  var j = jday.apply(void 0, _toConsumableArray(date));
  var m = (j - satrec.jdsatepoch) * minutesPerDay;
  return sgp4(satrec, m);
}
function dopplerFactor(location, position, velocity) {
  var mfactor = 7.292115E-5;
  var c = 299792.458; // Speed of light in km/s

  var range = {
    x: position.x - location.x,
    y: position.y - location.y,
    z: position.z - location.z
  };
  range.w = Math.sqrt(Math.pow(range.x, 2) + Math.pow(range.y, 2) + Math.pow(range.z, 2));
  var rangeVel = {
    x: velocity.x + mfactor * location.y,
    y: velocity.y - mfactor * location.x,
    z: velocity.z
  };
  function sign(value) {
    return value >= 0 ? 1 : -1;
  }
  var rangeRate = (range.x * rangeVel.x + range.y * rangeVel.y + range.z * rangeVel.z) / range.w;
  return 1 + rangeRate / c * sign(rangeRate);
}
function radiansToDegrees(radians) {
  return radians * rad2deg;
}
function degreesToRadians(degrees) {
  return degrees * deg2rad;
}
function degreesLat(radians) {
  if (radians < -pi / 2 || radians > pi / 2) {
    throw new RangeError('Latitude radians must be in range [-pi/2; pi/2].');
  }
  return radiansToDegrees(radians);
}
function degreesLong(radians) {
  if (radians < -pi || radians > pi) {
    throw new RangeError('Longitude radians must be in range [-pi; pi].');
  }
  return radiansToDegrees(radians);
}
function radiansLat(degrees) {
  if (degrees < -90 || degrees > 90) {
    throw new RangeError('Latitude degrees must be in range [-90; 90].');
  }
  return degreesToRadians(degrees);
}
function radiansLong(degrees) {
  if (degrees < -180 || degrees > 180) {
    throw new RangeError('Longitude degrees must be in range [-180; 180].');
  }
  return degreesToRadians(degrees);
}
function geodeticToEcf(geodetic) {
  var longitude = geodetic.longitude,
    latitude = geodetic.latitude,
    height = geodetic.height;
  var a = 6378.137;
  var b = 6356.7523142;
  var f = (a - b) / a;
  var e2 = 2 * f - f * f;
  var normal = a / Math.sqrt(1 - e2 * (Math.sin(latitude) * Math.sin(latitude)));
  var x = (normal + height) * Math.cos(latitude) * Math.cos(longitude);
  var y = (normal + height) * Math.cos(latitude) * Math.sin(longitude);
  var z = (normal * (1 - e2) + height) * Math.sin(latitude);
  return {
    x: x,
    y: y,
    z: z
  };
}
function eciToGeodetic(eci, gmst) {
  // http://www.celestrak.com/columns/v02n03/
  var a = 6378.137;
  var b = 6356.7523142;
  var R = Math.sqrt(eci.x * eci.x + eci.y * eci.y);
  var f = (a - b) / a;
  var e2 = 2 * f - f * f;
  var longitude = Math.atan2(eci.y, eci.x) - gmst;
  while (longitude < -pi) {
    longitude += twoPi;
  }
  while (longitude > pi) {
    longitude -= twoPi;
  }
  var kmax = 20;
  var k = 0;
  var latitude = Math.atan2(eci.z, Math.sqrt(eci.x * eci.x + eci.y * eci.y));
  var C;
  while (k < kmax) {
    C = 1 / Math.sqrt(1 - e2 * (Math.sin(latitude) * Math.sin(latitude)));
    latitude = Math.atan2(eci.z + a * C * e2 * Math.sin(latitude), R);
    k += 1;
  }
  var height = R / Math.cos(latitude) - a * C;
  return {
    longitude: longitude,
    latitude: latitude,
    height: height
  };
}
function ecfToEci(ecf, gmst) {
  // ccar.colorado.edu/ASEN5070/handouts/coordsys.doc
  //
  // [X]     [C -S  0][X]
  // [Y]  =  [S  C  0][Y]
  // [Z]eci  [0  0  1][Z]ecf
  //
  var X = ecf.x * Math.cos(gmst) - ecf.y * Math.sin(gmst);
  var Y = ecf.x * Math.sin(gmst) + ecf.y * Math.cos(gmst);
  var Z = ecf.z;
  return {
    x: X,
    y: Y,
    z: Z
  };
}
function eciToEcf(eci, gmst) {
  // ccar.colorado.edu/ASEN5070/handouts/coordsys.doc
  //
  // [X]     [C -S  0][X]
  // [Y]  =  [S  C  0][Y]
  // [Z]eci  [0  0  1][Z]ecf
  //
  //
  // Inverse:
  // [X]     [C  S  0][X]
  // [Y]  =  [-S C  0][Y]
  // [Z]ecf  [0  0  1][Z]eci
  var x = eci.x * Math.cos(gmst) + eci.y * Math.sin(gmst);
  var y = eci.x * -Math.sin(gmst) + eci.y * Math.cos(gmst);
  var z = eci.z;
  return {
    x: x,
    y: y,
    z: z
  };
}
function topocentric(observerGeodetic, satelliteEcf) {
  // http://www.celestrak.com/columns/v02n02/
  // TS Kelso's method, except I'm using ECF frame
  // and he uses ECI.
  var longitude = observerGeodetic.longitude,
    latitude = observerGeodetic.latitude;
  var observerEcf = geodeticToEcf(observerGeodetic);
  var rx = satelliteEcf.x - observerEcf.x;
  var ry = satelliteEcf.y - observerEcf.y;
  var rz = satelliteEcf.z - observerEcf.z;
  var topS = Math.sin(latitude) * Math.cos(longitude) * rx + Math.sin(latitude) * Math.sin(longitude) * ry - Math.cos(latitude) * rz;
  var topE = -Math.sin(longitude) * rx + Math.cos(longitude) * ry;
  var topZ = Math.cos(latitude) * Math.cos(longitude) * rx + Math.cos(latitude) * Math.sin(longitude) * ry + Math.sin(latitude) * rz;
  return {
    topS: topS,
    topE: topE,
    topZ: topZ
  };
}
/**
 * @param {Object} tc
 * @param {Number} tc.topS Positive horizontal vector S due south.
 * @param {Number} tc.topE Positive horizontal vector E due east.
 * @param {Number} tc.topZ Vector Z normal to the surface of the earth (up).
 * @returns {Object}
 */

function topocentricToLookAngles(tc) {
  var topS = tc.topS,
    topE = tc.topE,
    topZ = tc.topZ;
  var rangeSat = Math.sqrt(topS * topS + topE * topE + topZ * topZ);
  var El = Math.asin(topZ / rangeSat);
  var Az = Math.atan2(-topE, topS) + pi;
  return {
    azimuth: Az,
    elevation: El,
    rangeSat: rangeSat // Range in km
  };
}

function ecfToLookAngles(observerGeodetic, satelliteEcf) {
  var topocentricCoords = topocentric(observerGeodetic, satelliteEcf);
  return topocentricToLookAngles(topocentricCoords);
}
},{}],"../node_modules/tle.js/dist/tlejs.umd.js":[function(require,module,exports) {
var define;
var global = arguments[3];
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, defineProperty = Object.defineProperty || function (obj, key, desc) { obj[key] = desc.value; }, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return defineProperty(generator, "_invoke", { value: makeInvokeMethod(innerFn, self, context) }), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == _typeof(value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; defineProperty(this, "_invoke", { value: function value(method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; } function maybeInvokeDelegate(delegate, context) { var method = delegate.iterator[context.method]; if (undefined === method) { if (context.delegate = null, "throw" === context.method) { if (delegate.iterator.return && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method)) return ContinueSentinel; context.method = "throw", context.arg = new TypeError("The iterator does not provide a 'throw' method"); } return ContinueSentinel; } var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) { if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; } return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), defineProperty(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (val) { var object = Object(val), keys = []; for (var key in object) { keys.push(key); } return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) { "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); } }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, catch: function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }
function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
(function (global, factory) {
  (typeof exports === "undefined" ? "undefined" : _typeof(exports)) === 'object' && typeof module !== 'undefined' ? factory(exports, require('satellite.js')) : typeof define === 'function' && define.amd ? define(['exports', 'satellite.js'], factory) : (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.tlejs = {}, global.satellite));
})(this, function (exports, satellite_js) {
  'use strict';

  var _marked = /*#__PURE__*/_regeneratorRuntime().mark(getNextPosition);
  var _MS_IN_A_DAY = 86400000;
  var _MS_IN_A_SECOND = 1000;
  var _MS_IN_A_MINUTE = 60000;

  // Data formats for TLE orbital elements.
  var _TLE_DATA_TYPES = {
    _INT: Symbol(),
    _FLOAT: Symbol(),
    _CHAR: Symbol(),
    _DECIMAL_ASSUMED: Symbol(),
    // 12345 -> 0.12345
    _DECIMAL_ASSUMED_E: Symbol() // 12345-2 -> 0.0012345
  };

  var _DATA_TYPES = {
    _ARRAY: "array",
    _STRING: "string",
    _OBJECT: "object",
    _DATE: "date",
    _NAN: "NaN"
  };

  /**
   * General helper that provides more useful info than JavaScript's built-in "typeof" operator.
   *
   * Example:
   * getType([]);
   * -> 'array'
   */
  function getType(input) {
    var type = _typeof(input);
    if (Array.isArray(input)) {
      return _DATA_TYPES._ARRAY;
    }
    if (input instanceof Date) {
      return _DATA_TYPES._DATE;
    }
    if (Number.isNaN(input)) {
      return _DATA_TYPES._NAN;
    }
    return type;
  }

  /**
   * Determines if a number is positive.
   */
  var _isPositive = function _isPositive(num) {
    return num >= 0;
  };

  /**
   * Determines the amount of digits in a number.  Used for converting a TLE's "leading decimal
   * assumed" notation.
   *
   * Example:
   * getDigitCount(12345);
   * -> 5
   */
  var _getDigitCount = function _getDigitCount(num) {
    var absVal = Math.abs(num);
    return absVal.toString().length;
  };

  /**
   * Converts a TLE's "leading decimal assumed" notation to a float representation.
   *
   * Example:
   * toLeadingDecimal(12345);
   * -> 0.12345
   */
  var _toLeadingDecimal = function _toLeadingDecimal(num) {
    var numDigits = _getDigitCount(num);
    var zeroes = "0".repeat(numDigits - 1);
    return parseFloat(num * "0.".concat(zeroes, "1"));
  };

  /**
   * Converts a TLE's "leading decimal assumed" notation with leading zeroes to a float
   * representation.
   *
   * Example:
   * decimalAssumedEToFloat('12345-4');
   * -> 0.000012345
   */
  var _decimalAssumedEToFloat = function _decimalAssumedEToFloat(str) {
    var numWithAssumedLeadingDecimal = str.substr(0, str.length - 2);
    var num = _toLeadingDecimal(numWithAssumedLeadingDecimal);
    var leadingDecimalPoints = parseInt(str.substr(str.length - 2, 2), 10);
    var float = num * Math.pow(10, leadingDecimalPoints);
    return parseFloat(float.toPrecision(5));
  };

  /**
   * Converts a fractional day of the year to a timestamp.  Used for parsing the TLE epoch.
   */
  var _dayOfYearToTimeStamp = function _dayOfYearToTimeStamp(dayOfYear) {
    var year = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : new Date().getFullYear();
    var yearStart = new Date("1/1/".concat(year, " 0:0:0 Z"));
    var yearStartMS = yearStart.getTime();
    return Math.floor(yearStartMS + (dayOfYear - 1) * _MS_IN_A_DAY);
  };

  /**
   * Converts radians (0 to 2π) to degrees (0 to 360).
   */
  var _radiansToDegrees = function _radiansToDegrees(radians) {
    return radians * (180 / Math.PI);
  };

  /**
   * Converts degrees (0 to 360) to radians (0 to 2π).
   */
  var _degreesToRadians = function _degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
  };

  /**
   * Determines if a pair of longitude points crosses over the antemeridian, which is a
   * pain point for mapping software.
   */
  var _crossesAntemeridian = function _crossesAntemeridian(longitude1, longitude2) {
    if (!longitude1 || !longitude2) return false;
    var isLong1Positive = _isPositive(longitude1);
    var isLong2Positive = _isPositive(longitude2);
    var haveSameSigns = isLong1Positive === isLong2Positive;
    if (haveSameSigns) return false;

    // Signs don't match, so check if we're reasonably near the antemeridian (just to be sure it's
    // not the prime meridian).
    var isNearAntemeridian = Math.abs(longitude1) > 100;
    return isNearAntemeridian;
  };

  /**
   * Note: TLEs have a year 2000 style problem in 2057, because they only represent years in 2
   * characters.  This function doesn't account for that problem.
   *
   * Example:
   * _getFullYear(98);
   * -> 1998
   *
   * @param {Number} twoDigitYear
   */
  function _getFullYear(twoDigitYear) {
    var twoDigitYearInt = parseInt(twoDigitYear, 10);
    return twoDigitYearInt < 100 && twoDigitYearInt > 56 ? twoDigitYearInt + 1900 : twoDigitYearInt + 2000;
  }

  /**
   * Gets a piece of data directly from a TLE line string, and attempts to parse it based on
   * data format.
   *
   * @param {Object} parsedTLE
   * @param {(1|2)} lineNumber TLE line number.
   * @param {Object} definition From line-1-definitions or line-2-definitions.
   */
  function getFromTLE(parsedTLE, lineNumber, definition) {
    var tle = parsedTLE.tle;
    var line = lineNumber === 1 ? tle[0] : tle[1];
    var start = definition.start,
      length = definition.length,
      type = definition.type;
    var val = line.substr(start, length);
    var output;
    switch (type) {
      case _TLE_DATA_TYPES._INT:
        output = parseInt(val, 10);
        break;
      case _TLE_DATA_TYPES._FLOAT:
        output = parseFloat(val);
        break;
      case _TLE_DATA_TYPES._DECIMAL_ASSUMED:
        output = parseFloat("0.".concat(val));
        break;
      case _TLE_DATA_TYPES._DECIMAL_ASSUMED_E:
        output = _decimalAssumedEToFloat(val);
        break;
      case _TLE_DATA_TYPES._CHAR:
      default:
        output = val.trim();
        break;
    }
    return output;
  }

  /**
   * Returns the length of the keys in an object, ignoring the size of the values.
   *
   * @param {Object} obj
   */
  var _getObjLength = function _getObjLength(obj) {
    return Object.keys(obj).length;
  };
  var _ERRORS = {
    _TYPE: function _TYPE() {
      var context = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
      var expected = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
      var got = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "";
      return "".concat(context, " must be of type [").concat(expected.join(", "), "], but got ").concat(got, ".");
    },
    _NOT_PARSED_OBJECT: "Input object is malformed (should have name and tle properties)."
  };
  function isTLEObj(obj) {
    return _typeof(obj) === _DATA_TYPES._OBJECT && obj.tle && getType(obj.tle) === _DATA_TYPES._ARRAY && obj.tle.length === 2;
  }
  var getTLECacheKey = function getTLECacheKey(type, sourceTLE) {
    if (type === _DATA_TYPES._ARRAY) {
      // Use TLE line 1 in 2 and 3-line TLE variants.
      return sourceTLE.length === 3 ? sourceTLE[1] : sourceTLE[0];
    }

    // Use the entire string as a key.
    return sourceTLE;
  };

  // For TLE parsing memoization.
  var tleCache = {};
  var clearTLEParseCache = function clearTLEParseCache() {
    return tleCache = {};
  };

  /**
   * Converts string and array TLE formats into a "parsed" TLE in a consistent object format.
   * Accepts 2 and 3-line (with satellite name) TLE variants in string (\n-delimited) and array
   * forms.
   *
   * Example:
   * parseTLE(`ISS (ZARYA)
   * 1 25544U 98067A   19285.67257269  .00001247  00000-0  29690-4 0  9993
   * 2 25544  51.6439 138.6866 0007415 141.2524 326.3533 15.50194187193485`);
   * ->
   * {
   *   name: 'ISS (ZARYA)',
   *   tle: [
   *     '1 25544U 98067A   19285.67257269  .00001247  00000-0  29690-4 0  9993',
   *     '2 25544  51.6439 138.6866 0007415 141.2524 326.3533 15.50194187193485'
   *   ]
   * }
   */
  var acceptedTLETypes = [_DATA_TYPES._ARRAY, _DATA_TYPES._STRING, _DATA_TYPES._OBJECT];
  function parseTLE(sourceTLE) {
    var fastParse = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    var type = getType(sourceTLE);
    var output = {};
    var tleArray = [];
    var alreadyParsed = isTLEObj(sourceTLE);
    if (alreadyParsed) {
      // This TLE has already been parsed, so there's nothing left to do.
      return sourceTLE;
    }
    var isUnexpectedObject = !alreadyParsed && type === _DATA_TYPES._OBJECT;
    if (isUnexpectedObject) {
      throw new Error(_ERRORS._NOT_PARSED_OBJECT);
    }

    // Note: only strings and arrays will make it past this point.

    // Check if the TLE exists in the cache.
    var cacheKey = getTLECacheKey(type, sourceTLE);
    if (tleCache[cacheKey]) {
      return tleCache[cacheKey];
    }
    if (!acceptedTLETypes.includes(type)) {
      throw new Error(_ERRORS._TYPE("Source TLE", acceptedTLETypes, type));
    }

    // Convert to array.
    if (type === _DATA_TYPES._STRING) {
      tleArray = sourceTLE.split("\n");
    } else if (type === _DATA_TYPES._ARRAY) {
      // Already an array, so make a copy so we don't mutate the input.
      tleArray = Array.from(sourceTLE);
    }

    // 3-line variant: remove name from array for consistency.
    if (tleArray.length === 3) {
      var name = tleArray[0].trim();
      tleArray = tleArray.slice(1);

      // Strip off line number, if present.
      if (name.startsWith('0 ')) {
        name = name.substr(2);
      }

      // Preserve original name string for use in the getSatelliteName() getter.
      output.name = name;
    }
    output.tle = tleArray.map(function (line) {
      return line.trim();
    });

    // Check TLE validity.
    if (!fastParse) {
      var isValid = isValidTLE(output.tle);
      if (!isValid) {
        output.error = "TLE parse error: bad TLE";
      }
    }

    // Update cache.
    tleCache[cacheKey] = output;
    return output;
  }

  /**
   * Determines the checksum for a single line of a TLE.
   *
   * Checksum = modulo 10 of sum of all numbers (including line number) + 1 for each negative
   * sign (-).  Everything else is ignored.
   */
  function computeChecksum(tleLineStr) {
    var charArr = tleLineStr.split("");

    // Remove trailing checksum.
    charArr.splice(charArr.length - 1, 1);
    if (charArr.length === 0) {
      throw new Error("Character array empty!", tleLineStr);
    }
    var checksum = charArr.reduce(function (sum, val) {
      var parsedVal = parseInt(val, 10);
      var parsedSum = parseInt(sum, 10);
      if (Number.isInteger(parsedVal)) {
        return parsedSum + parsedVal;
      }
      if (val === "-") {
        return parsedSum + 1;
      }
      return parsedSum;
    }, 0);
    return checksum % 10;
  }
  function lineNumberIsValid(tleObj, lineNumber) {
    var tle = tleObj.tle;
    return lineNumber === parseInt(tle[lineNumber - 1][0], 10);
  }
  function checksumIsValid(tleObj, lineNumber) {
    var tle = tleObj.tle;
    var tleLine = tle[lineNumber - 1];
    var checksumInTLE = parseInt(tleLine[tleLine.length - 1], 10);
    var computedChecksum = computeChecksum(tle[lineNumber - 1]);
    return computedChecksum === checksumInTLE;
  }

  /**
   * Determines if a TLE is structurally valid.
   */
  function isValidTLE(rawTLE) {
    var tleObj;
    try {
      tleObj = parseTLE(rawTLE);
    } catch (e) {
      return false;
    }

    // Fast line number checks.
    var line1NumberIsValid = lineNumberIsValid(tleObj, 1);
    var line2NumberIsValid = lineNumberIsValid(tleObj, 2);
    if (!line1NumberIsValid || !line2NumberIsValid) {
      return false;
    }

    // Checksum checks.
    var line1ChecksumIsValid = checksumIsValid(tleObj, 1);
    var line2ChecksumIsValid = checksumIsValid(tleObj, 2);
    if (!line1ChecksumIsValid || !line2ChecksumIsValid) {
      return false;
    }
    return true;
  }

  /**
   * Two-Line Element Set (TLE) format definitions, Line 1
   * See https://en.wikipedia.org/wiki/Two-line_element_set and https://celestrak.com/columns/v04n03/
   */

  /* TLE line number. Will always return 1 for valid TLEs. */
  var lineNumber1 = {
    start: 0,
    length: 1,
    type: _TLE_DATA_TYPES._INT
  };

  /**
   * NORAD satellite catalog number (e.g. Sputnik's rocket was number 00001).
   * See https://en.wikipedia.org/wiki/Satellite_Catalog_Number
   * 
   * NOTE: This will not handle Alpha-5 satellites.
   * See https://www.space-track.org/documentation#tle-alpha5
   *
   * Range: 0 to 99999
   * Example: 25544
   */
  var catalogNumber1 = {
    start: 2,
    length: 5,
    type: _TLE_DATA_TYPES._INT
  };

  /**
   * Satellite classification.
   * 'U' = unclassified
   * 'C' = confidential
   * 'S' = secret
   *
   * Example: 'U'
   */
  var classification = {
    start: 7,
    length: 1,
    type: _TLE_DATA_TYPES._CHAR
  };

  /**
   * International Designator (COSPAR ID): Last 2 digits of launch year.
   * 57 to 99 = 1900s, 00-56 = 2000s
   * See https://en.wikipedia.org/wiki/International_Designator
   *
   * Range: 00 to 99
   * Example: 98
   */
  var intDesignatorYear = {
    start: 9,
    length: 2,
    type: _TLE_DATA_TYPES._INT
  };

  /**
   * International Designator (COSPAR ID): Launch number of the year.
   * See https://en.wikipedia.org/wiki/International_Designator
   *
   * Range: 1 to 999
   * Example: 67
   */
  var intDesignatorLaunchNumber = {
    start: 11,
    length: 3,
    type: _TLE_DATA_TYPES._INT
  };

  /**
   * International Designator  (COSPAR ID): Piece of the launch.
   * See https://en.wikipedia.org/wiki/International_Designator
   *
   * Range: A to ZZZ
   * Example: 'A'
   */
  var intDesignatorPieceOfLaunch = {
    start: 14,
    length: 3,
    type: _TLE_DATA_TYPES._CHAR
  };

  /**
   * Year when the TLE was generated (TLE epoch), last two digits.
   * 
   * 57 to 99 = 1900s, 00-56 = 2000s
   *
   * Range: 00 to 99
   * Example: 17
   */
  var epochYear = {
    start: 18,
    length: 2,
    type: _TLE_DATA_TYPES._INT
  };

  /**
   * Fractional day of the year when the TLE was generated (TLE epoch).
   *
   * Range: 1 to 365.99999999
   * Example: 206.18396726
   */
  var epochDay = {
    start: 20,
    length: 12,
    type: _TLE_DATA_TYPES._FLOAT
  };

  /**
   * First Time Derivative of the Mean Motion divided by two.  Defines how mean motion changes
   * from day to day, so TLE propagators can still be used to make reasonable guesses when
   * times are distant from the original TLE epoch.
   *
   * Units: Orbits / day ^ 2
   * Example: 0.00001961
   */
  var firstTimeDerivative = {
    start: 33,
    length: 11,
    type: _TLE_DATA_TYPES._FLOAT
  };

  /**
   * Second Time Derivative of Mean Motion divided by six (decimal point assumed). Measures rate
   * of change in the Mean Motion Dot so software can make reasonable guesses when times are
   * distant from the original TLE epoch.
   *
   * Usually zero, unless the satellite is manuevering or in a decaying orbit.
   *
   * Units: Orbits / day ^ 3.
   * Example: 0 ('00000-0' in the original TLE [= 0.00000 * 10 ^ 0])
   */
  var secondTimeDerivative = {
    start: 44,
    length: 8,
    type: _TLE_DATA_TYPES._DECIMAL_ASSUMED_E
  };

  /**
   * BSTAR drag term (decimal point assumed).  Estimates the effects of
   * atmospheric drag on the satellite's motion.
   *
   * Units: EarthRadii ^ -1
   * Example: 0.000036771 ('36771-4' in the original TLE [= 0.36771 * 10 ^ -4])
   */
  var bstarDrag = {
    start: 53,
    length: 8,
    type: _TLE_DATA_TYPES._DECIMAL_ASSUMED_E
  };

  /**
   * Private value - used by United States Space Force to reference the orbit model used to
   * generate the TLE.  Will always be seen as zero externally (e.g. by "us", unless you are
   * "them" - in which case, hello!).
   *
   * Example: 0
   */
  var orbitModel = {
    start: 62,
    length: 1,
    type: _TLE_DATA_TYPES._INT
  };

  /**
   * TLE element set number, incremented for each new TLE generated. 999 seems to mean the TLE
   * has maxed out.
   *
   * Range: Technically 1 to 9999, though in practice the maximum number seems to be 999.
   * Example: 999
   */
  var tleSetNumber = {
    start: 64,
    length: 4,
    type: _TLE_DATA_TYPES._INT
  };

  /*
   * TLE line 1 checksum (modulo 10), for verifying the integrity of this line of the TLE.
   *
   * Range: 0 to 9
   * Example: 3
   */
  var checksum1 = {
    start: 68,
    length: 1,
    type: _TLE_DATA_TYPES._INT
  };

  /**
   * General helper to get a piece of data from the first line of a TLE.
   *
   * @param {String|Array} tle Two or three line TLE
   * @param {Object} definition From `line-1-definitions.js`
   * @param {Boolean} isTLEParsed Skips TLE parsing when true.
   */
  function getFromLine1(tle, definition) {
    var isTLEParsed = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    var parsedTLE = isTLEParsed ? tle : parseTLE(tle);
    return getFromTLE(parsedTLE, 1, definition);
  }

  /**
   * Returns the line number from line 1.  Should always return "1" for valid TLEs.
   *
   * @param {String|Array} tle Two or three line TLE
   * @param {Boolean} isTLEParsed Skips TLE parsing when true.
   */
  function getLineNumber1(tle, isTLEParsed) {
    return getFromLine1(tle, lineNumber1, isTLEParsed);
  }

  /**
   * Returns the Space Catalog Number (aka NORAD Catalog Number).
   * See https://en.wikipedia.org/wiki/Satellite_Catalog_Number
   *
   * @param {String|Array} tle Two or three line TLE
   * @param {Boolean} isTLEParsed Skips TLE parsing when true.
   */
  function getCatalogNumber1(tle, isTLEParsed) {
    return getFromLine1(tle, catalogNumber1, isTLEParsed);
  }

  /**
   * Returns the satellite classification.  For example, an unclassified satellite will return `U`.
   *
   * @param {String|Array} tle Two or three line TLE
   * @param {Boolean} isTLEParsed Skips TLE parsing when true.
   */
  function getClassification(tle, isTLEParsed) {
    return getFromLine1(tle, classification, isTLEParsed);
  }

  /**
   * Returns the launch year (last two digits), which makes up part of the COSPAR id
   * (international designator).  For example, a satellite launched in 1999 will return "99".
   * See https://en.wikipedia.org/wiki/International_Designator
   *
   * @param {String|Array} tle Two or three line TLE
   * @param {Boolean} isTLEParsed Skips TLE parsing when true.
   */
  function getIntDesignatorYear(tle, isTLEParsed) {
    return getFromLine1(tle, intDesignatorYear, isTLEParsed);
  }

  /**
   * Returns the launch number of the year, which makes up part of the COSPAR id
   * (international designator).  For example, the 50th launch of the year will return "50".
   * See https://en.wikipedia.org/wiki/International_Designator
   *
   * @param {String|Array} tle Two or three line TLE
   * @param {Boolean} isTLEParsed Skips TLE parsing when true.
   */
  function getIntDesignatorLaunchNumber(tle, isTLEParsed) {
    return getFromLine1(tle, intDesignatorLaunchNumber, isTLEParsed);
  }

  /**
   * Returns the piece of the launch, which makes up part of the COSPAR id (international designator).
   * For example, the first piece of the launch will return "A".
   * See https://en.wikipedia.org/wiki/International_Designator
   *
   * @param {String|Array} tle Two or three line TLE
   * @param {Boolean} isTLEParsed Skips TLE parsing when true.
   */
  function getIntDesignatorPieceOfLaunch(tle, isTLEParsed) {
    return getFromLine1(tle, intDesignatorPieceOfLaunch, isTLEParsed);
  }

  /**
   * Returns the TLE epoch year (last two digits) when the TLE was generated.  For example, a TLE
   * generated in 2022 will return `22`.
   *
   * @param {String|Array} tle Two or three line TLE
   * @param {Boolean} isTLEParsed Skips TLE parsing when true.
   */
  function getEpochYear(tle, isTLEParsed) {
    return getFromLine1(tle, epochYear, isTLEParsed);
  }

  /**
   * Returns the TLE epoch day of the year (day of year with fractional portion of the day) when the
   * TLE was generated.  For example, a TLE generated on January 1 will return something like
   * `1.18396726`.
   *
   * @param {String|Array} tle Two or three line TLE
   * @param {Boolean} isTLEParsed Skips TLE parsing when true.
   */
  function getEpochDay(tle, isTLEParsed) {
    return getFromLine1(tle, epochDay, isTLEParsed);
  }

  /**
   * First Time Derivative of the Mean Motion divided by two, measured in orbits per day per day
   * (orbits/day2). Defines how mean motion changes from day to day, so TLE propagators can still be
   * used to make reasonable guesses when distant from the original TLE epoch.
   * See https://en.wikipedia.org/wiki/Mean_Motion
   *
   * @param {String|Array} tle Two or three line TLE
   * @param {Boolean} isTLEParsed Skips TLE parsing when true.
   */
  function getFirstTimeDerivative(tle, isTLEParsed) {
    return getFromLine1(tle, firstTimeDerivative, isTLEParsed);
  }

  /**
   * Second Time Derivative of Mean Motion divided by six, measured in orbits per day per day per day
   * (orbits/day3). Similar to the first time derivative, it measures rate of change in the Mean
   * Motion Dot so software can make reasonable guesses when distant from the original TLE epoch.
   * See https://en.wikipedia.org/wiki/Mean_Motion and http://castor2.ca/03_Mechanics/03_TLE/Mean_Mot_Dot.html
   *
   * @param {String|Array} tle Two or three line TLE
   * @param {Boolean} isTLEParsed Skips TLE parsing when true.
   */
  function getSecondTimeDerivative(tle, isTLEParsed) {
    return getFromLine1(tle, secondTimeDerivative, isTLEParsed);
  }

  /**
   * BSTAR drag term. This estimates the effects of atmospheric drag on the satellite's motion.
   * See https://en.wikipedia.org/wiki/BSTAR
   *
   * @param {String|Array} tle Two or three line TLE
   * @param {Boolean} isTLEParsed Skips TLE parsing when true.
   */
  function getBstarDrag(tle, isTLEParsed) {
    return getFromLine1(tle, bstarDrag, isTLEParsed);
  }

  /**
   * Private value - used by Air Force Space Command to reference the orbit model used to generate the
   * TLE (e.g. SGP, SGP4).  Distributed TLES will always return `0` for this value.  Note that all
   * distributed TLEs are generated with SGP4/SDP4.
   * See https://celestrak.com/columns/v04n03/
   *
   * @param {String|Array} tle Two or three line TLE
   * @param {Boolean} isTLEParsed Skips TLE parsing when true.
   */
  function getOrbitModel(tle, isTLEParsed) {
    return getFromLine1(tle, orbitModel, isTLEParsed);
  }

  /**
   * TLE element set number, incremented for each new TLE generated since launch. 999 seems to mean
   * the TLE has maxed out.
   *
   * @param {String|Array} tle Two or three line TLE
   * @param {Boolean} isTLEParsed Skips TLE parsing when true.
   */
  function getTleSetNumber(tle, isTLEParsed) {
    return getFromLine1(tle, tleSetNumber, isTLEParsed);
  }

  /**
   * TLE line 1 checksum (modulo 10), for verifying the integrity of this line of the TLE. Note that
   * letters, blanks, periods, and plus signs are counted as 0, while minus signs are counted as 1.
   *
   * @param {String|Array} tle Two or three line TLE
   * @param {Boolean} isTLEParsed Skips TLE parsing when true.
   */
  function getChecksum1(tle, isTLEParsed) {
    return getFromLine1(tle, checksum1, isTLEParsed);
  }

  /**
   * Two-Line Element Set (TLE) format definitions, Line 2
   * See https://en.wikipedia.org/wiki/Two-line_element_set and https://celestrak.com/columns/v04n03/
   */

  /* TLE line number. Will always return 2 for valid TLEs. */
  var lineNumber2 = {
    start: 0,
    length: 1,
    type: _TLE_DATA_TYPES._INT
  };

  /**
   * NORAD satellite catalog number (Sputnik's rocket was 00001).  Should match the satellite
   * number on line 1.
   *
   * Range: 0 to 99999
   * Example: 25544
   */
  var catalogNumber2 = {
    start: 2,
    length: 5,
    type: _TLE_DATA_TYPES._INT
  };

  /**
   * Inclination relative to the Earth's equatorial plane in degrees. 0 to 90 degrees is a
   * prograde orbit and 90 to 180 degrees is a retrograde orbit.
   *
   * Units: degrees
   * Range: 0 to 180
   * Example: 51.6400
   */
  var inclination = {
    start: 8,
    length: 8,
    type: _TLE_DATA_TYPES._FLOAT
  };

  /**
   * Right ascension of the ascending node in degrees. Essentially, this is the angle of the
   * satellite as it crosses northward (ascending) across the Earth's equator (equatorial
   * plane).
   *
   * Units: degrees
   * Range: 0 to 359.9999
   * Example: 208.9163
   */
  var rightAscension = {
    start: 17,
    length: 8,
    type: _TLE_DATA_TYPES._FLOAT
  };

  /**
   * Orbital eccentricity, decimal point assumed. All artificial Earth satellites have an
   * eccentricity between 0 (perfect circle) and 1 (parabolic orbit).
   *
   * Range: 0 to 1
   * Example: 0.0006317 (`0006317` in the original TLE)
   */
  var eccentricity = {
    start: 26,
    length: 7,
    type: _TLE_DATA_TYPES._DECIMAL_ASSUMED
  };

  /**
   * Argument of perigee. See https://en.wikipedia.org/wiki/Argument_of_perigee
   * Units: degrees
   * Range: 0 to 359.9999
   * Example: 69.9862
   */
  var perigee = {
    start: 34,
    length: 8,
    type: _TLE_DATA_TYPES._FLOAT
  };

  /**
   * Mean anomaly. Indicates where the satellite was located within its orbit at the time of the
   * TLE epoch.
   * See https://en.wikipedia.org/wiki/Mean_Anomaly
   *
   * Units: degrees
   * Range: 0 to 359.9999
   * Example: 25.2906
   */
  var meanAnomaly = {
    start: 43,
    length: 8,
    type: _TLE_DATA_TYPES._FLOAT
  };

  /**
   * Revolutions around the Earth per day (mean motion).
   * See https://en.wikipedia.org/wiki/Mean_Motion
   *
   * Range: 0 to 17 (theoretically)
   * Example: 15.54225995
   */
  var meanMotion = {
    start: 52,
    length: 11,
    type: _TLE_DATA_TYPES._FLOAT
  };

  /**
   * Total satellite revolutions when this TLE was generated. This number rolls over
   * (e.g. 99999 -> 0).
   *
   * Range: 0 to 99999
   * Example: 6766
   */
  var revNumberAtEpoch = {
    start: 63,
    length: 5,
    type: _TLE_DATA_TYPES._INT
  };

  /*
   * TLE line 2 checksum (modulo 10), for verifying the integrity of this line of the TLE.
   *
   * Range: 0 to 9
   * Example: 0
   */
  var checksum2 = {
    start: 68,
    length: 1,
    type: _TLE_DATA_TYPES._INT
  };

  /**
   * General helper to get a piece of data from the second line of a TLE.
   *
   * @param {String|Array} tle Two or three line TLE
   * @param {Object} definition From `line-1-definitions.js`
   * @param {Boolean} isTLEParsed Skips TLE parsing when true.
   */
  function getFromLine2(tle, definition) {
    var isTLEParsed = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    var parsedTLE = isTLEParsed ? tle : parseTLE(tle);
    return getFromTLE(parsedTLE, 2, definition);
  }

  /**
   * Returns the line number from line 2.  Should always return "2" for valid TLEs.
   *
   * @param {String|Array} tle Two or three line TLE
   * @param {Boolean} isTLEParsed Skips TLE parsing when true.
   */
  function getLineNumber2(tle, isTLEParsed) {
    return getFromLine2(tle, lineNumber2, isTLEParsed);
  }

  /**
   * Returns the line number from line 1.  Should always return "1" for valid TLEs.
   *
   * @param {String|Array} tle Two or three line TLE
   * @param {Boolean} isTLEParsed Skips TLE parsing when true.
   */
  function getCatalogNumber2(tle, isTLEParsed) {
    return getFromLine2(tle, catalogNumber2, isTLEParsed);
  }

  /**
   * Returns the inclination relative to the Earth's equatorial plane in degrees. 0 to 90 degrees is a
   * prograde orbit and 90 to 180 degrees is a retrograde orbit.
   * See https://en.wikipedia.org/wiki/Orbital_inclination
   *
   * @param {String|Array} tle Two or three line TLE
   * @param {Boolean} isTLEParsed Skips TLE parsing when true.
   */
  function getInclination(tle, isTLEParsed) {
    return getFromLine2(tle, inclination, isTLEParsed);
  }

  /**
   * Returns the right ascension of the ascending node in degrees. Essentially, this is the angle of
   * the satellite as it crosses northward (ascending) across the Earth's equator (equatorial plane).
   * See https://en.wikipedia.org/wiki/Right_ascension_of_the_ascending_node
   *
   * @param {String|Array} tle Two or three line TLE
   * @param {Boolean} isTLEParsed Skips TLE parsing when true.
   */
  function getRightAscension(tle, isTLEParsed) {
    return getFromLine2(tle, rightAscension, isTLEParsed);
  }

  /**
   * Returns the orbital eccentricity. All artificial Earth satellites have an eccentricity between 0
   * (perfect circle) and 1 (parabolic orbit).
   * See https://en.wikipedia.org/wiki/Orbital_eccentricity
   *
   * @param {String|Array} tle Two or three line TLE
   * @param {Boolean} isTLEParsed Skips TLE parsing when true.
   */
  function getEccentricity(tle, isTLEParsed) {
    return getFromLine2(tle, eccentricity, isTLEParsed);
  }

  /**
   * Returns the argument of perigee.
   * See https://en.wikipedia.org/wiki/Argument_of_perigee
   *
   * @param {String|Array} tle Two or three line TLE
   * @param {Boolean} isTLEParsed Skips TLE parsing when true.
   */
  function getPerigee(tle, isTLEParsed) {
    return getFromLine2(tle, perigee, isTLEParsed);
  }

  /**
   * Returns the Mean Anomaly. Indicates where the satellite was located within its orbit at the time
   * of the TLE epoch.
   * See https://en.wikipedia.org/wiki/Mean_Anomaly
   *
   * @param {String|Array} tle Two or three line TLE
   * @param {Boolean} isTLEParsed Skips TLE parsing when true.
   */
  function getMeanAnomaly(tle, isTLEParsed) {
    return getFromLine2(tle, meanAnomaly, isTLEParsed);
  }

  /**
   * Returns the revolutions around the Earth per day (mean motion).
   * See https://en.wikipedia.org/wiki/Mean_Motion
   *
   * @param {String|Array} tle Two or three line TLE
   * @param {Boolean} isTLEParsed Skips TLE parsing when true.
   */
  function getMeanMotion(tle, isTLEParsed) {
    return getFromLine2(tle, meanMotion, isTLEParsed);
  }

  /**
   * Returns the total satellite revolutions when this TLE was generated. This number seems to roll
   * over (e.g. 99999 -> 0).
   *
   * @param {String|Array} tle Two or three line TLE
   * @param {Boolean} isTLEParsed Skips TLE parsing when true.
   */
  function getRevNumberAtEpoch(tle, isTLEParsed) {
    return getFromLine2(tle, revNumberAtEpoch, isTLEParsed);
  }

  /**
   * TLE line 2 checksum (modulo 10), for verifying the integrity of this line of the TLE. Note that
   * letters, blanks, periods, and plus signs are counted as 0, while minus signs are counted as 1.
   *
   * @param {String|Array} tle Two or three line TLE
   * @param {Boolean} isTLEParsed Skips TLE parsing when true.
   */
  function getChecksum2(tle, isTLEParsed) {
    return getFromLine2(tle, checksum2, isTLEParsed);
  }

  /**
   * Determines COSPAR ID.
   * See https://en.wikipedia.org/wiki/International_Designator
   */
  function getCOSPAR(tle, tleIsParsed) {
    var partialYear = getIntDesignatorYear(tle, tleIsParsed);
    var fullYear = _getFullYear(partialYear);
    var launchNum = getIntDesignatorLaunchNumber(tle, tleIsParsed);
    var launchNumWithPadding = launchNum.toString().padStart(3, 0);
    var launchPiece = getIntDesignatorPieceOfLaunch(tle, tleIsParsed);
    return "".concat(fullYear, "-").concat(launchNumWithPadding).concat(launchPiece);
  }

  /**
   * Determines the name of a satellite, if present in the first line of a 3-line TLE.  If not found,
   * returns "Unknown" by default, or the COSPAR id when fallbackToCOSPAR is true.
   *
   * Example:
   * getSatelliteName(tleStr);
   * -> 'ISS (ZARYA)'
   *
   * @param {String|Array} rawTLE Input TLE.
   * @param {Boolean} fallbackToCOSPAR Returns COSPAR id when satellite name isn't found.
   */
  function getSatelliteName(rawTLE) {
    var fallbackToCOSPAR = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    var parsedTLE = parseTLE(rawTLE);
    var name = parsedTLE.name;
    if (fallbackToCOSPAR) {
      return name || getCOSPAR(parsedTLE, true);
    } else {
      return name || "Unknown";
    }
  }

  /**
   * Determines the Unix timestamp (in ms) of a TLE epoch (the time a TLE was generated).
   *
   * Example:
   * getEpochTimestamp(tleStr);
   * -> 1500956694771
   */
  function getEpochTimestamp(rawTLE) {
    var epochDay = getEpochDay(rawTLE);
    var epochYear = getEpochYear(rawTLE);
    return _dayOfYearToTimeStamp(epochDay, epochYear);
  }

  /**
   * Determines the average amount of milliseconds in one orbit.
   */
  function getAverageOrbitTimeMS(tle) {
    return parseInt(_MS_IN_A_DAY / getMeanMotion(tle), 10);
  }

  /**
   * Determines the average amount of minutes in one orbit.
   */
  function getAverageOrbitTimeMins(tle) {
    return getAverageOrbitTimeMS(tle) / _MS_IN_A_MINUTE;
  }

  /**
   * Determines the average amount of seconds in one orbit.
   */
  function getAverageOrbitTimeS(tle) {
    return getAverageOrbitTimeMS(tle) / _MS_IN_A_SECOND;
  }
  var _SAT_REC_ERRORS = {
    _DEFAULT: "Problematic TLE with unknown error.",
    1: "Mean elements, ecc >= 1.0 or ecc < -0.001 or a < 0.95 er",
    2: "Mean motion less than 0.0",
    3: "Pert elements, ecc < 0.0  or  ecc > 1.0",
    4: "Semi-latus rectum < 0.0",
    5: "Epoch elements are sub-orbital",
    6: "Satellite has decayed"
  };
  var cachedSatelliteInfo = {};
  var cachedAntemeridianCrossings = {};
  var cachedOrbitTracks = {};
  var cachedGroundTrack = {};
  var caches = [cachedSatelliteInfo, cachedAntemeridianCrossings, cachedOrbitTracks, cachedGroundTrack];

  /**
   * Returns the current size of SGP caches.
   */
  function getCacheSizes() {
    return caches.map(_getObjLength);
  }

  /**
   * Clears SGP caches to free up memory for long-running apps.
   */
  function clearCache() {
    caches.forEach(function (_cache, idx) {
      caches[idx] = {};
    });
  }

  /**
   * Determines satellite position and look angles from an earth observer.
   *
   * Example:
   * const satInfo = getSatelliteInfo(
   *   tleStr,          // Satellite TLE string or array (2 or 3 line variants).
   *   1501039265000,   // Unix timestamp (ms)
   *   34.243889,       // Observer latitude (degrees)
   *   -116.911389,     // Observer longitude (degrees)
   *   0                // Observer elevation (km)
   * );
   *
   * ->
   * {
   *   // satellite compass heading from observer in degrees (0 = north, 180 = south)
   *   azimuth: 294.5780478624994,
   *
   *   // satellite elevation from observer in degrees (90 is directly overhead)
   *   elevation: 81.63903620330046,
   *
   *   // km distance from observer to spacecraft
   *   range: 406.60211015810074,
   *
   *   // spacecraft altitude in km
   *   height: 402.9082788620108,
    *   // spacecraft latitude in degrees
   *   lat: 34.45112876592785,
    *   // spacecraft longitude in degrees
   *   lng: -117.46176597710809,
   *
   *   // spacecraft velocity in km/s
   *   velocity: 7.675627442183371
   * }
   * TODO: default to 0,0.
   * TODO: return error instead of throwing?
   */
  function getSatelliteInfo(rawTLE, rawTimestamp, observerLat, observerLng, observerHeight) {
    var timestamp = rawTimestamp || Date.now();
    var _parseTLE = parseTLE(rawTLE),
      tle = _parseTLE.tle,
      parseError = _parseTLE.error;
    if (parseError) {
      throw new Error(parseError);
    }
    var defaultObserverPosition = {
      lat: 36.9613422,
      lng: -122.0308,
      height: 0.37
    };
    var obsLat = observerLat || defaultObserverPosition.lat;
    var obsLng = observerLng || defaultObserverPosition.lng;
    var obsHeight = observerHeight || defaultObserverPosition.height;

    // Memoization
    var cacheKey = "".concat(tle[0], "-").concat(timestamp, "-").concat(observerLat, "-").concat(observerLng, "\n-").concat(observerHeight);
    if (cachedSatelliteInfo[cacheKey]) {
      return cachedSatelliteInfo[cacheKey];
    }

    // Initialize a satellite record
    var satrec = satellite_js.twoline2satrec(tle[0], tle[1]);
    if (satrec.error) {
      throw new Error(_SAT_REC_ERRORS[satrec.error] || _SAT_REC_ERRORS._DEFAULT);
    }
    var dateObj = new Date(timestamp);

    // Propagate SGP4.
    var positionAndVelocity = satellite_js.propagate(satrec, dateObj);

    // The position_velocity result is a key-value pair of ECI coordinates.
    // These are the base results from which all other coordinates are derived.
    var positionEci = positionAndVelocity.position;
    var velocityEci = positionAndVelocity.velocity;

    // Set the observer position (in radians).
    var observerGd = {
      latitude: _degreesToRadians(obsLat),
      longitude: _degreesToRadians(obsLng),
      height: obsHeight
    };

    // Get GMST for some coordinate transforms.
    // http://en.wikipedia.org/wiki/Sidereal_time#Definition
    var gmst = satellite_js.gstime(dateObj);

    // Get ECF, Geodetic, Look Angles, and Doppler Factor.
    var positionEcf = satellite_js.eciToEcf(positionEci, gmst);
    var positionGd = satellite_js.eciToGeodetic(positionEci, gmst);
    var lookAngles = satellite_js.ecfToLookAngles(observerGd, positionEcf);
    var velocityKmS = Math.sqrt(Math.pow(velocityEci.x, 2) + Math.pow(velocityEci.y, 2) + Math.pow(velocityEci.z, 2));

    // Azimuth: is simply the compass heading from the observer's position.
    var azimuth = lookAngles.azimuth,
      elevation = lookAngles.elevation,
      rangeSat = lookAngles.rangeSat;

    // Geodetic coords are accessed via `longitude`, `latitude`, `height`.
    var longitude = positionGd.longitude,
      latitude = positionGd.latitude,
      height = positionGd.height;
    var output = {
      lng: satellite_js.degreesLong(longitude),
      lat: satellite_js.degreesLat(latitude),
      elevation: _radiansToDegrees(elevation),
      azimuth: _radiansToDegrees(azimuth),
      range: rangeSat,
      height: height,
      velocity: velocityKmS
    };

    // Memoization
    cachedSatelliteInfo[cacheKey] = output;
    return output;
  }

  /**
   * Determines if the last antemeridian crossing has been cached.  If it has, the time (in ms)
   * is returned, otherwise it returns false.
   */
  function getCachedLastAntemeridianCrossingTimeMS(tleObj, timeMS) {
    var tle = tleObj.tle;
    var orbitLengthMS = getAverageOrbitTimeMins(tle) * 60 * 1000;
    var tleStr = tle[0].substr(0, 30);
    var cachedCrossingTimes = cachedAntemeridianCrossings[tleStr];
    if (!cachedCrossingTimes) return false;
    if (cachedCrossingTimes === -1) return cachedCrossingTimes;
    var cachedTime = cachedCrossingTimes.filter(function (val) {
      if (_typeof(val) === "object" && val.tle === tle) return -1;
      var diff = timeMS - val;
      var isDiffPositive = diff > 0;
      var isWithinOrbit = isDiffPositive && diff < orbitLengthMS;
      return isWithinOrbit;
    });
    return cachedTime[0] || false;
  }

  /**
   * Determines the last time the satellite crossed the antemeridian.  For mapping convenience
   * and to avoid headaches, we want to avoid plotting ground tracks that cross the antemeridian.
   */
  function getLastAntemeridianCrossingTimeMS(tle, timeMS) {
    var parsedTLE = parseTLE(tle);
    var tleArr = parsedTLE.tle;
    var cachedVal = getCachedLastAntemeridianCrossingTimeMS(parsedTLE, timeMS);
    if (cachedVal) {
      return cachedVal;
    }
    var time = timeMS || Date.now();
    var step = 1000 * 60 * 3;
    var curLngLat = [];
    var lastLngLat = [];
    var curTimeMS = time;
    var didCrossAntemeridian = false;
    var tries = 0;
    var isDone = false;
    var maxTries = 1000;
    while (!isDone) {
      curLngLat = getLngLat(tleArr, curTimeMS);
      var _curLngLat = curLngLat,
        _curLngLat2 = _slicedToArray(_curLngLat, 1),
        curLng = _curLngLat2[0];
      didCrossAntemeridian = _crossesAntemeridian(lastLngLat[0], curLng);
      if (didCrossAntemeridian) {
        // Back up to before we crossed the line.
        curTimeMS += step;

        // Keep narrowing by halving increments.
        step = step / 2;
      } else {
        // Didn't cross yet, so keep incrementing.
        curTimeMS -= step;
        lastLngLat = curLngLat;
      }
      isDone = step < 500 || tries >= maxTries;
      tries++;
    }
    var couldNotFindCrossing = tries - 1 === maxTries;
    var crossingTime = couldNotFindCrossing ? -1 : parseInt(curTimeMS, 10);
    var tleStr = tleArr[0];
    if (!cachedAntemeridianCrossings[tleStr]) {
      cachedAntemeridianCrossings[tleStr] = [];
    }
    if (couldNotFindCrossing) {
      cachedAntemeridianCrossings[tleStr] = -1;
    } else {
      cachedAntemeridianCrossings[tleStr].push(crossingTime);
    }
    return crossingTime;
  }

  /**
   * Determines current satellite position, or position at time of timestamp (optional).
   *
   * @param {Array|String} tle
   * @param {Number} optionalTimestamp Unix timestamp in milliseconds.
   */
  function getLatLngObj(tle) {
    var optionalTimestamp = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : Date.now();
    var _getSatelliteInfo = getSatelliteInfo(tle, optionalTimestamp),
      lat = _getSatelliteInfo.lat,
      lng = _getSatelliteInfo.lng;
    return {
      lat: lat,
      lng: lng
    };
  }

  /**
   * Determines current satellite position, or position at time of timestamp (optional).
   *
   * @param {Array|String} tle
   * @param {Number} optionalTimestamp Unix timestamp in milliseconds.
   */
  function getLngLat(tle) {
    var optionalTimestamp = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : Date.now();
    var _getSatelliteInfo2 = getSatelliteInfo(tle, optionalTimestamp),
      lat = _getSatelliteInfo2.lat,
      lng = _getSatelliteInfo2.lng;
    return [lng, lat];
  }

  /**
   * Determines the position of the satellite at the time the TLE was generated.
   *
   * @param {Array|String} tle
   */
  function getLngLatAtEpoch(tle) {
    return getLngLat(tle, getEpochTimestamp(tle));
  }

  // TODO: cache geosync and erroring satellites and don't recompute on next pass.
  function getVisibleSatellites(_ref) {
    var observerLat = _ref.observerLat,
      observerLng = _ref.observerLng,
      _ref$observerHeight = _ref.observerHeight,
      observerHeight = _ref$observerHeight === void 0 ? 0 : _ref$observerHeight,
      _ref$tles = _ref.tles,
      tles = _ref$tles === void 0 ? [] : _ref$tles,
      _ref$elevationThresho = _ref.elevationThreshold,
      elevationThreshold = _ref$elevationThresho === void 0 ? 0 : _ref$elevationThresho,
      _ref$timestampMS = _ref.timestampMS,
      timestampMS = _ref$timestampMS === void 0 ? Date.now() : _ref$timestampMS;
    return tles.reduce(function (visibleSats, tleArr) {
      var info;
      try {
        info = getSatelliteInfo(tleArr, timestampMS, observerLat, observerLng, observerHeight);
      } catch (e) {
        // Don't worry about decayed sats, just move on.
        // TODO cache error

        return visibleSats;
      }
      var _info = info,
        elevation = _info.elevation,
        velocity = _info.velocity,
        range = _info.range;
      return elevation >= elevationThreshold ? visibleSats.concat({
        tleArr: tleArr,
        info: info
      }) : visibleSats;
    }, []);
  }
  function getNextPosition(tleArr, startTimeMS, stepMS) {
    var curTimeMS;
    return _regeneratorRuntime().wrap(function getNextPosition$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            curTimeMS = startTimeMS - stepMS;
          case 1:
            if (!true) {
              _context.next = 7;
              break;
            }
            curTimeMS += stepMS;
            _context.next = 5;
            return {
              curTimeMS: curTimeMS,
              lngLat: getLngLat(tleArr, curTimeMS)
            };
          case 5:
            _context.next = 1;
            break;
          case 7:
          case "end":
            return _context.stop();
        }
      }
    }, _marked);
  }
  function sleep(ms) {
    return new Promise(function (resolve) {
      return setTimeout(resolve, ms);
    });
  }

  /**
   * Generates an array of lng/lat pairs representing a ground track (orbit track), starting
   * from startTimeMS and continuing until just before crossing the antemeridian, which is considered the end
   * of the orbit for convenience.
   *
   * Consider pairing this with getLastAntemeridianCrossingTimeMS() to create a full orbit path (see usage
   * in getGroundTracks()).
   */
  function getOrbitTrack(_x) {
    return _getOrbitTrack.apply(this, arguments);
  }
  /**
   *
   */
  function _getOrbitTrack() {
    _getOrbitTrack = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(_ref2) {
      var tle, _ref2$startTimeMS, startTimeMS, _ref2$stepMS, stepMS, _ref2$sleepMS, sleepMS, _ref2$jobChunkSize, jobChunkSize, _ref2$maxTimeMS, maxTimeMS, _ref2$isLngLatFormat, isLngLatFormat, _parseTLE3, tleArr, startS, cacheKey, generator, step, isDone, coords, lastLng, _generator$next$value, curTimeMS, lngLat, _lngLat, curLng, curLat, doesCrossAntemeridian, doesExceedTime;
      return _regeneratorRuntime().wrap(function _callee$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              tle = _ref2.tle, _ref2$startTimeMS = _ref2.startTimeMS, startTimeMS = _ref2$startTimeMS === void 0 ? Date.now() : _ref2$startTimeMS, _ref2$stepMS = _ref2.stepMS, stepMS = _ref2$stepMS === void 0 ? 1000 : _ref2$stepMS, _ref2$sleepMS = _ref2.sleepMS, sleepMS = _ref2$sleepMS === void 0 ? 0 : _ref2$sleepMS, _ref2$jobChunkSize = _ref2.jobChunkSize, jobChunkSize = _ref2$jobChunkSize === void 0 ? 1000 : _ref2$jobChunkSize, _ref2$maxTimeMS = _ref2.maxTimeMS, maxTimeMS = _ref2$maxTimeMS === void 0 ? 6000000 : _ref2$maxTimeMS, _ref2$isLngLatFormat = _ref2.isLngLatFormat, isLngLatFormat = _ref2$isLngLatFormat === void 0 ? true : _ref2$isLngLatFormat;
              _parseTLE3 = parseTLE(tle), tleArr = _parseTLE3.tle;
              startS = (startTimeMS / 1000).toFixed();
              cacheKey = "".concat(tleArr[0], "-").concat(startS, "-").concat(stepMS, "-").concat(isLngLatFormat);
              if (!cachedOrbitTracks[cacheKey]) {
                _context2.next = 6;
                break;
              }
              return _context2.abrupt("return", cachedOrbitTracks[cacheKey]);
            case 6:
              generator = getNextPosition(tleArr, startTimeMS, stepMS);
              step = 0;
              isDone = false;
              coords = [];
            case 10:
              if (isDone) {
                _context2.next = 26;
                break;
              }
              _generator$next$value = generator.next().value, curTimeMS = _generator$next$value.curTimeMS, lngLat = _generator$next$value.lngLat;
              _lngLat = _slicedToArray(lngLat, 2), curLng = _lngLat[0], curLat = _lngLat[1];
              doesCrossAntemeridian = _crossesAntemeridian(lastLng, curLng);
              doesExceedTime = maxTimeMS && curTimeMS - startTimeMS > maxTimeMS;
              isDone = doesCrossAntemeridian || doesExceedTime;
              if (!isDone) {
                _context2.next = 18;
                break;
              }
              return _context2.abrupt("break", 26);
            case 18:
              if (isLngLatFormat) {
                coords.push(lngLat);
              } else {
                coords.push([curLat, curLng]);
              }
              if (!(sleepMS && step % jobChunkSize === 0)) {
                _context2.next = 22;
                break;
              }
              _context2.next = 22;
              return sleep(sleepMS);
            case 22:
              lastLng = curLng;
              step++;
              _context2.next = 10;
              break;
            case 26:
              cachedOrbitTracks[cacheKey] = coords;
              return _context2.abrupt("return", coords);
            case 28:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee);
    }));
    return _getOrbitTrack.apply(this, arguments);
  }
  function getOrbitTrackSync(_ref3) {
    var tle = _ref3.tle,
      _ref3$startTimeMS = _ref3.startTimeMS,
      startTimeMS = _ref3$startTimeMS === void 0 ? Date.now() : _ref3$startTimeMS,
      _ref3$stepMS = _ref3.stepMS,
      stepMS = _ref3$stepMS === void 0 ? 1000 : _ref3$stepMS,
      _ref3$maxTimeMS = _ref3.maxTimeMS,
      maxTimeMS = _ref3$maxTimeMS === void 0 ? 6000000 : _ref3$maxTimeMS,
      _ref3$isLngLatFormat = _ref3.isLngLatFormat,
      isLngLatFormat = _ref3$isLngLatFormat === void 0 ? true : _ref3$isLngLatFormat;
    var _parseTLE2 = parseTLE(tle),
      tleArr = _parseTLE2.tle;
    var startS = (startTimeMS / 1000).toFixed();
    var cacheKey = "".concat(tleArr[0], "-").concat(startS, "-").concat(stepMS, "-").concat(isLngLatFormat);
    if (cachedOrbitTracks[cacheKey]) {
      return cachedOrbitTracks[cacheKey];
    }
    var isDone = false;
    var coords = [];
    var lastLng;
    var curTimeMS = startTimeMS;
    while (!isDone) {
      var curLngLat = getLngLat(tleArr, curTimeMS);
      var _curLngLat3 = _slicedToArray(curLngLat, 2),
        curLng = _curLngLat3[0],
        curLat = _curLngLat3[1];
      var doesCrossAntemeridian = _crossesAntemeridian(lastLng, curLng);
      var doesExceedTime = maxTimeMS && curTimeMS - startTimeMS > maxTimeMS;
      isDone = doesCrossAntemeridian || doesExceedTime;
      if (isDone) break;
      if (isLngLatFormat) {
        coords.push(curLngLat);
      } else {
        coords.push([curLat, curLng]);
      }
      lastLng = curLng;
      curTimeMS += stepMS;
    }
    cachedOrbitTracks[cacheKey] = coords;
    return coords;
  }

  /**
   * Calculates three orbit arrays of latitude/longitude pairs.
   * TODO: just calculate future orbits
   *
   * @param {Array|String} options.tle
   * @param {Number} startTimeMS Unix timestamp in milliseconds.
   * @param {Number} stepMS Time in milliseconds between points on the ground track.
   * @param {Boolean} isLngLatFormat Whether coords are in [lng, lat] format.
   *
   *
   * Example:
   * const threeOrbitsArr = await getGroundTracks({ tle: tleStr });
   * ->
   * [
   *   // previous orbit
   *   [
   *     [ 45.85524291891481, -179.93297540317567 ],
   *     ...
   *   ],
   *
   *   // current orbit
   *   [
   *     [ 51.26165992503701, -179.9398612198045 ],
   *     ...
   *   ],
   *
   *   // next orbit
   *   [
   *     [ 51.0273714070371, -179.9190165549038 ],
   *     ...
   *   ]
   * ]
   */
  function getGroundTracks(_ref4) {
    var tle = _ref4.tle,
      _ref4$startTimeMS = _ref4.startTimeMS,
      startTimeMS = _ref4$startTimeMS === void 0 ? Date.now() : _ref4$startTimeMS,
      _ref4$stepMS = _ref4.stepMS,
      stepMS = _ref4$stepMS === void 0 ? 1000 : _ref4$stepMS,
      _ref4$isLngLatFormat = _ref4.isLngLatFormat,
      isLngLatFormat = _ref4$isLngLatFormat === void 0 ? true : _ref4$isLngLatFormat;
    var parsedTLE = parseTLE(tle);
    var orbitTimeMS = getAverageOrbitTimeMS(parsedTLE);
    var curOrbitStartMS = getLastAntemeridianCrossingTimeMS(parsedTLE, startTimeMS);
    var foundCrossing = curOrbitStartMS !== -1;
    if (!foundCrossing) {
      // Geosync or unusual orbit, so just return a Promise for a partial orbit track.

      return Promise.all([getOrbitTrack({
        tle: parsedTLE,
        startTimeMS: startTimeMS,
        stepMS: _MS_IN_A_MINUTE,
        maxTimeMS: _MS_IN_A_DAY / 4,
        isLngLatFormat: isLngLatFormat
      })]);
    }

    /**
     * Buffer time that will be sure to place us well within the previous or next orbit.
     */
    var bufferMS = orbitTimeMS / 5;
    var lastOrbitStartMS = getLastAntemeridianCrossingTimeMS(parsedTLE, curOrbitStartMS - bufferMS);
    var nextOrbitStartMS = getLastAntemeridianCrossingTimeMS(parsedTLE, curOrbitStartMS + orbitTimeMS + bufferMS);
    var groundTrackPromises = [getOrbitTrack({
      tle: parsedTLE,
      startTimeMS: lastOrbitStartMS,
      stepMS: stepMS,
      isLngLatFormat: isLngLatFormat
    }), getOrbitTrack({
      tle: parsedTLE,
      startTimeMS: curOrbitStartMS,
      stepMS: stepMS,
      isLngLatFormat: isLngLatFormat
    }), getOrbitTrack({
      tle: parsedTLE,
      startTimeMS: nextOrbitStartMS,
      stepMS: stepMS,
      isLngLatFormat: isLngLatFormat
    })];
    return Promise.all(groundTrackPromises);
  }

  /**
   * Calculates three orbit arrays of latitude/longitude pairs.
   *
   * Example:
   * const threeOrbitsArr = getGroundTrackSync({ tle: tleStr });
   * ->
   * [
   *   // previous orbit
   *   [
   *     [ 45.85524291891481, -179.93297540317567 ],
   *     ...
   *   ],
   *
   *   // current orbit
   *   [
   *     [ 51.26165992503701, -179.9398612198045 ],
   *     ...
   *   ],
   *
   *   // next orbit
   *   [
   *     [ 51.0273714070371, -179.9190165549038 ],
   *     ...
   *   ]
   * ]
   */
  function getGroundTracksSync(_ref5) {
    var tle = _ref5.tle,
      _ref5$stepMS = _ref5.stepMS,
      stepMS = _ref5$stepMS === void 0 ? 1000 : _ref5$stepMS,
      _ref5$optionalTimeMS = _ref5.optionalTimeMS,
      optionalTimeMS = _ref5$optionalTimeMS === void 0 ? Date.now() : _ref5$optionalTimeMS,
      _ref5$isLngLatFormat = _ref5.isLngLatFormat,
      isLngLatFormat = _ref5$isLngLatFormat === void 0 ? true : _ref5$isLngLatFormat;
    var parsedTLE = parseTLE(tle);
    var tleArr = parsedTLE.tle;
    var orbitTimeMS = getAverageOrbitTimeMS(tleArr);
    var curOrbitStartMS = getLastAntemeridianCrossingTimeMS(parsedTLE, optionalTimeMS);
    var foundCrossing = curOrbitStartMS !== -1;
    if (!foundCrossing) {
      // Geosync or unusual orbit, so just return a partial orbit track.

      var partialGroundTrack = getOrbitTrackSync({
        tle: parsedTLE,
        startTimeMS: optionalTimeMS,
        stepMS: _MS_IN_A_MINUTE,
        maxTimeMS: _MS_IN_A_DAY / 4
      });
      return partialGroundTrack;
    }

    /**
     * Buffer time that will be sure to place us well within the previous or next orbit.
     */
    var bufferMS = orbitTimeMS / 5;
    var lastOrbitStartMS = getLastAntemeridianCrossingTimeMS(parsedTLE, curOrbitStartMS - bufferMS);
    var nextOrbitStartMS = getLastAntemeridianCrossingTimeMS(parsedTLE, curOrbitStartMS + orbitTimeMS + bufferMS);
    var orbitStartTimes = [lastOrbitStartMS, curOrbitStartMS, nextOrbitStartMS];
    var orbitLatLons = orbitStartTimes.map(function (orbitStartMS) {
      return getOrbitTrackSync({
        tle: parsedTLE,
        startTimeMS: orbitStartMS,
        stepMS: stepMS,
        isLngLatFormat: isLngLatFormat
      });
    });
    return orbitLatLons;
  }

  /**
   * Determines the compass bearing from the perspective of the satellite.  Useful for 3D / pitched
   * map perspectives.
   *
   * TODO: a bit buggy at extreme parts of orbits, where latitude hardly changes.
   */
  function getSatBearing(tle) {
    var timeMS = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : Date.now();
    var parsedTLE = this.parseTLE(tle);
    var latLon1 = this.getLatLonArr(parsedTLE.arr, timeMS);
    var latLon2 = this.getLatLonArr(parsedTLE.arr, timeMS + 10000);
    var doesCrossAntemeridian = _crossesAntemeridian(latLon1[1], latLon2[1]);
    if (doesCrossAntemeridian) {
      // TODO: fix
      return {};
      // return this.getSatBearing(tle, customTimeMS + 10000);
    }

    var lat1 = _degreesToRadians(latLon1[0]);
    var lat2 = _degreesToRadians(latLon2[0]);
    var lon1 = _degreesToRadians(latLon1[1]);
    var lon2 = _degreesToRadians(latLon2[1]);
    var NS = lat1 >= lat2 ? "S" : "N";
    var EW = lon1 >= lon2 ? "W" : "E";
    var y = Math.sin(lon2 - lon1) * Math.cos(lat2);
    var x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
    var degrees = _radiansToDegrees(Math.atan2(y, x));
    return {
      degrees: degrees,
      compass: "".concat(NS).concat(EW)
    };
  }
  exports.clearCache = clearCache;
  exports.clearTLEParseCache = clearTLEParseCache;
  exports.computeChecksum = computeChecksum;
  exports.getAverageOrbitTimeMS = getAverageOrbitTimeMS;
  exports.getAverageOrbitTimeMins = getAverageOrbitTimeMins;
  exports.getAverageOrbitTimeS = getAverageOrbitTimeS;
  exports.getBstarDrag = getBstarDrag;
  exports.getCOSPAR = getCOSPAR;
  exports.getCacheSizes = getCacheSizes;
  exports.getCatalogNumber = getCatalogNumber1;
  exports.getCatalogNumber1 = getCatalogNumber1;
  exports.getCatalogNumber2 = getCatalogNumber2;
  exports.getChecksum1 = getChecksum1;
  exports.getChecksum2 = getChecksum2;
  exports.getClassification = getClassification;
  exports.getEccentricity = getEccentricity;
  exports.getEpochDay = getEpochDay;
  exports.getEpochTimestamp = getEpochTimestamp;
  exports.getEpochYear = getEpochYear;
  exports.getFirstTimeDerivative = getFirstTimeDerivative;
  exports.getGroundTracks = getGroundTracks;
  exports.getGroundTracksSync = getGroundTracksSync;
  exports.getInclination = getInclination;
  exports.getIntDesignatorLaunchNumber = getIntDesignatorLaunchNumber;
  exports.getIntDesignatorPieceOfLaunch = getIntDesignatorPieceOfLaunch;
  exports.getIntDesignatorYear = getIntDesignatorYear;
  exports.getLastAntemeridianCrossingTimeMS = getLastAntemeridianCrossingTimeMS;
  exports.getLatLngObj = getLatLngObj;
  exports.getLineNumber1 = getLineNumber1;
  exports.getLineNumber2 = getLineNumber2;
  exports.getLngLatAtEpoch = getLngLatAtEpoch;
  exports.getMeanAnomaly = getMeanAnomaly;
  exports.getMeanMotion = getMeanMotion;
  exports.getOrbitModel = getOrbitModel;
  exports.getOrbitTrack = getOrbitTrack;
  exports.getOrbitTrackSync = getOrbitTrackSync;
  exports.getPerigee = getPerigee;
  exports.getRevNumberAtEpoch = getRevNumberAtEpoch;
  exports.getRightAscension = getRightAscension;
  exports.getSatBearing = getSatBearing;
  exports.getSatelliteInfo = getSatelliteInfo;
  exports.getSatelliteName = getSatelliteName;
  exports.getSecondTimeDerivative = getSecondTimeDerivative;
  exports.getTleSetNumber = getTleSetNumber;
  exports.getVisibleSatellites = getVisibleSatellites;
  exports.isValidTLE = isValidTLE;
  exports.parseTLE = parseTLE;
  Object.defineProperty(exports, '__esModule', {
    value: true
  });
});
},{"satellite.js":"../node_modules/satellite.js/dist/satellite.es.js"}],"../node_modules/parcel-bundler/src/builtins/bundle-url.js":[function(require,module,exports) {
var bundleURL = null;
function getBundleURLCached() {
  if (!bundleURL) {
    bundleURL = getBundleURL();
  }
  return bundleURL;
}
function getBundleURL() {
  // Attempt to find the URL of the current script and use that as the base URL
  try {
    throw new Error();
  } catch (err) {
    var matches = ('' + err.stack).match(/(https?|file|ftp|chrome-extension|moz-extension):\/\/[^)\n]+/g);
    if (matches) {
      return getBaseURL(matches[0]);
    }
  }
  return '/';
}
function getBaseURL(url) {
  return ('' + url).replace(/^((?:https?|file|ftp|chrome-extension|moz-extension):\/\/.+)?\/[^/]+(?:\?.*)?$/, '$1') + '/';
}
exports.getBundleURL = getBundleURLCached;
exports.getBaseURL = getBaseURL;
},{}],"../node_modules/parcel-bundler/src/builtins/css-loader.js":[function(require,module,exports) {
var bundle = require('./bundle-url');
function updateLink(link) {
  var newLink = link.cloneNode();
  newLink.onload = function () {
    link.remove();
  };
  newLink.href = link.href.split('?')[0] + '?' + Date.now();
  link.parentNode.insertBefore(newLink, link.nextSibling);
}
var cssTimeout = null;
function reloadCSS() {
  if (cssTimeout) {
    return;
  }
  cssTimeout = setTimeout(function () {
    var links = document.querySelectorAll('link[rel="stylesheet"]');
    for (var i = 0; i < links.length; i++) {
      if (bundle.getBaseURL(links[i].href) === bundle.getBundleURL()) {
        updateLink(links[i]);
      }
    }
    cssTimeout = null;
  }, 50);
}
module.exports = reloadCSS;
},{"./bundle-url":"../node_modules/parcel-bundler/src/builtins/bundle-url.js"}],"../node_modules/material-icons/iconfont/material-icons.css":[function(require,module,exports) {

        var reloadCSS = require('_css_loader');
        module.hot.dispose(reloadCSS);
        module.hot.accept(reloadCSS);
      
},{"./material-icons.woff2":[["material-icons.18de6fe3.woff2","../node_modules/material-icons/iconfont/material-icons.woff2"],"../node_modules/material-icons/iconfont/material-icons.woff2"],"./material-icons.woff":[["material-icons.743d9943.woff","../node_modules/material-icons/iconfont/material-icons.woff"],"../node_modules/material-icons/iconfont/material-icons.woff"],"./material-icons-outlined.woff2":[["material-icons-outlined.76502e3b.woff2","../node_modules/material-icons/iconfont/material-icons-outlined.woff2"],"../node_modules/material-icons/iconfont/material-icons-outlined.woff2"],"./material-icons-outlined.woff":[["material-icons-outlined.7ce931a0.woff","../node_modules/material-icons/iconfont/material-icons-outlined.woff"],"../node_modules/material-icons/iconfont/material-icons-outlined.woff"],"./material-icons-round.woff2":[["material-icons-round.e6ddcaa7.woff2","../node_modules/material-icons/iconfont/material-icons-round.woff2"],"../node_modules/material-icons/iconfont/material-icons-round.woff2"],"./material-icons-round.woff":[["material-icons-round.75a52932.woff","../node_modules/material-icons/iconfont/material-icons-round.woff"],"../node_modules/material-icons/iconfont/material-icons-round.woff"],"./material-icons-sharp.woff2":[["material-icons-sharp.8b78e143.woff2","../node_modules/material-icons/iconfont/material-icons-sharp.woff2"],"../node_modules/material-icons/iconfont/material-icons-sharp.woff2"],"./material-icons-sharp.woff":[["material-icons-sharp.5bc9d0f4.woff","../node_modules/material-icons/iconfont/material-icons-sharp.woff"],"../node_modules/material-icons/iconfont/material-icons-sharp.woff"],"./material-icons-two-tone.woff2":[["material-icons-two-tone.ec88da63.woff2","../node_modules/material-icons/iconfont/material-icons-two-tone.woff2"],"../node_modules/material-icons/iconfont/material-icons-two-tone.woff2"],"./material-icons-two-tone.woff":[["material-icons-two-tone.899f8b2a.woff","../node_modules/material-icons/iconfont/material-icons-two-tone.woff"],"../node_modules/material-icons/iconfont/material-icons-two-tone.woff"],"_css_loader":"../node_modules/parcel-bundler/src/builtins/css-loader.js"}],"../node_modules/leaflet-easybutton/src/easy-button.js":[function(require,module,exports) {
(function(){

// This is for grouping buttons into a bar
// takes an array of `L.easyButton`s and
// then the usual `.addTo(map)`
L.Control.EasyBar = L.Control.extend({

  options: {
    position:       'topleft',  // part of leaflet's defaults
    id:             null,       // an id to tag the Bar with
    leafletClasses: true        // use leaflet classes?
  },


  initialize: function(buttons, options){

    if(options){
      L.Util.setOptions( this, options );
    }

    this._buildContainer();
    this._buttons = [];

    for(var i = 0; i < buttons.length; i++){
      buttons[i]._bar = this;
      buttons[i]._container = buttons[i].button;
      this._buttons.push(buttons[i]);
      this.container.appendChild(buttons[i].button);
    }

  },


  _buildContainer: function(){
    this._container = this.container = L.DomUtil.create('div', '');
    this.options.leafletClasses && L.DomUtil.addClass(this.container, 'leaflet-bar easy-button-container leaflet-control');
    this.options.id && (this.container.id = this.options.id);
  },


  enable: function(){
    L.DomUtil.addClass(this.container, 'enabled');
    L.DomUtil.removeClass(this.container, 'disabled');
    this.container.setAttribute('aria-hidden', 'false');
    return this;
  },


  disable: function(){
    L.DomUtil.addClass(this.container, 'disabled');
    L.DomUtil.removeClass(this.container, 'enabled');
    this.container.setAttribute('aria-hidden', 'true');
    return this;
  },


  onAdd: function () {
    return this.container;
  },

  addTo: function (map) {
    this._map = map;

    for(var i = 0; i < this._buttons.length; i++){
      this._buttons[i]._map = map;
    }

    var container = this._container = this.onAdd(map),
        pos = this.getPosition(),
        corner = map._controlCorners[pos];

    L.DomUtil.addClass(container, 'leaflet-control');

    if (pos.indexOf('bottom') !== -1) {
      corner.insertBefore(container, corner.firstChild);
    } else {
      corner.appendChild(container);
    }

    return this;
  }

});

L.easyBar = function(){
  var args = [L.Control.EasyBar];
  for(var i = 0; i < arguments.length; i++){
    args.push( arguments[i] );
  }
  return new (Function.prototype.bind.apply(L.Control.EasyBar, args));
};

// L.EasyButton is the actual buttons
// can be called without being grouped into a bar
L.Control.EasyButton = L.Control.extend({

  options: {
    position:  'topleft',       // part of leaflet's defaults

    id:        null,            // an id to tag the button with

    type:      'replace',       // [(replace|animate)]
                                // replace swaps out elements
                                // animate changes classes with all elements inserted

    states:    [],              // state names look like this
                                // {
                                //   stateName: 'untracked',
                                //   onClick: function(){ handle_nav_manually(); };
                                //   title: 'click to make inactive',
                                //   icon: 'fa-circle',    // wrapped with <a>
                                // }

    leafletClasses:   true,     // use leaflet styles for the button
    tagName:          'button',
  },



  initialize: function(icon, onClick, title, id){

    // clear the states manually
    this.options.states = [];

    // add id to options
    if(id != null){
      this.options.id = id;
    }

    // storage between state functions
    this.storage = {};

    // is the last item an object?
    if( typeof arguments[arguments.length-1] === 'object' ){

      // if so, it should be the options
      L.Util.setOptions( this, arguments[arguments.length-1] );
    }

    // if there aren't any states in options
    // use the early params
    if( this.options.states.length === 0 &&
        typeof icon  === 'string' &&
        typeof onClick === 'function'){

      // turn the options object into a state
      this.options.states.push({
        icon: icon,
        onClick: onClick,
        title: typeof title === 'string' ? title : ''
      });
    }

    // curate and move user's states into
    // the _states for internal use
    this._states = [];

    for(var i = 0; i < this.options.states.length; i++){
      this._states.push( new State(this.options.states[i], this) );
    }

    this._buildButton();

    this._activateState(this._states[0]);

  },

  _buildButton: function(){

    this.button = L.DomUtil.create(this.options.tagName, '');

    if (this.options.tagName === 'button') {
        this.button.setAttribute('type', 'button');
    }

    if (this.options.id ){
      this.button.id = this.options.id;
    }

    if (this.options.leafletClasses){
      L.DomUtil.addClass(this.button, 'easy-button-button leaflet-bar-part leaflet-interactive');
    }

    // don't let double clicks and mousedown get to the map
    L.DomEvent.addListener(this.button, 'dblclick', L.DomEvent.stop);
    L.DomEvent.addListener(this.button, 'mousedown', L.DomEvent.stop);
    L.DomEvent.addListener(this.button, 'mouseup', L.DomEvent.stop);

    // take care of normal clicks
    L.DomEvent.addListener(this.button,'click', function(e){
      L.DomEvent.stop(e);
      this._currentState.onClick(this, this._map ? this._map : null );
      this._map && this._map.getContainer().focus();
    }, this);

    // prep the contents of the control
    if(this.options.type == 'replace'){
      this.button.appendChild(this._currentState.icon);
    } else {
      for(var i=0;i<this._states.length;i++){
        this.button.appendChild(this._states[i].icon);
      }
    }
  },


  _currentState: {
    // placeholder content
    stateName: 'unnamed',
    icon: (function(){ return document.createElement('span'); })()
  },



  _states: null, // populated on init



  state: function(newState){

    // when called with no args, it's a getter
    if (arguments.length === 0) {
      return this._currentState.stateName;
    }

    // activate by name
    if(typeof newState == 'string'){

      this._activateStateNamed(newState);

    // activate by index
    } else if (typeof newState == 'number'){

      this._activateState(this._states[newState]);
    }

    return this;
  },


  _activateStateNamed: function(stateName){
    for(var i = 0; i < this._states.length; i++){
      if( this._states[i].stateName == stateName ){
        this._activateState( this._states[i] );
      }
    }
  },

  _activateState: function(newState){

    if( newState === this._currentState ){

      // don't touch the dom if it'll just be the same after
      return;

    } else {

      // swap out elements... if you're into that kind of thing
      if( this.options.type == 'replace' ){
        this.button.appendChild(newState.icon);
        this.button.removeChild(this._currentState.icon);
      }

      if( newState.title ){
        this.button.title = newState.title;
      } else {
        this.button.removeAttribute('title');
      }

      // update classes for animations
      for(var i=0;i<this._states.length;i++){
        L.DomUtil.removeClass(this._states[i].icon, this._currentState.stateName + '-active');
        L.DomUtil.addClass(this._states[i].icon, newState.stateName + '-active');
      }

      // update classes for animations
      L.DomUtil.removeClass(this.button, this._currentState.stateName + '-active');
      L.DomUtil.addClass(this.button, newState.stateName + '-active');

      // update the record
      this._currentState = newState;

    }
  },

  enable: function(){
    L.DomUtil.addClass(this.button, 'enabled');
    L.DomUtil.removeClass(this.button, 'disabled');
    this.button.setAttribute('aria-hidden', 'false');
    return this;
  },

  disable: function(){
    L.DomUtil.addClass(this.button, 'disabled');
    L.DomUtil.removeClass(this.button, 'enabled');
    this.button.setAttribute('aria-hidden', 'true');
    return this;
  },

  onAdd: function(map){
    var bar = L.easyBar([this], {
      position: this.options.position,
      leafletClasses: this.options.leafletClasses
    });
    this._anonymousBar = bar;
    this._container = bar.container;
    return this._anonymousBar.container;
  },

  removeFrom: function (map) {
    if (this._map === map)
      this.remove();
    return this;
  },

});

L.easyButton = function(/* args will pass automatically */){
  var args = Array.prototype.concat.apply([L.Control.EasyButton],arguments);
  return new (Function.prototype.bind.apply(L.Control.EasyButton, args));
};

/*************************
 *
 * util functions
 *
 *************************/

// constructor for states so only curated
// states end up getting called
function State(template, easyButton){

  this.title = template.title;
  this.stateName = template.stateName ? template.stateName : 'unnamed-state';

  // build the wrapper
  this.icon = L.DomUtil.create('span', '');

  L.DomUtil.addClass(this.icon, 'button-state state-' + this.stateName.replace(/(^\s*|\s*$)/g,''));
  this.icon.innerHTML = buildIcon(template.icon);
  this.onClick = L.Util.bind(template.onClick?template.onClick:function(){}, easyButton);
}

function buildIcon(ambiguousIconString) {

  var tmpIcon;

  // does this look like html? (i.e. not a class)
  if( ambiguousIconString.match(/[&;=<>"']/) ){

    // if so, the user should have put in html
    // so move forward as such
    tmpIcon = ambiguousIconString;

  // then it wasn't html, so
  // it's a class list, figure out what kind
  } else {
      ambiguousIconString = ambiguousIconString.replace(/(^\s*|\s*$)/g,'');
      tmpIcon = L.DomUtil.create('span', '');

      if( ambiguousIconString.indexOf('fa-') === 0 ){
        L.DomUtil.addClass(tmpIcon, 'fa '  + ambiguousIconString)
      } else if ( ambiguousIconString.indexOf('glyphicon-') === 0 ) {
        L.DomUtil.addClass(tmpIcon, 'glyphicon ' + ambiguousIconString)
      } else {
        L.DomUtil.addClass(tmpIcon, /*rollwithit*/ ambiguousIconString)
      }

      // make this a string so that it's easy to set innerHTML below
      tmpIcon = tmpIcon.outerHTML;
  }

  return tmpIcon;
}

})();

},{}],"script/main.js":[function(require,module,exports) {
'use strict';

var _tle = require("tle.js");
require("material-icons/iconfont/material-icons.css");
require("leaflet-easybutton");
var url = "https://tle.ivanstanojevic.me/api/tle/36508";
var RAGGIO_TERRA = 6371;
var PI = Math.PI;
var tle = "ISS (ZARYA)\n1 25544U 98067A   22328.36313807  .00010194  00000+0  18509-3 0  9998\n2 25544  51.6442 263.0928 0007089 108.6360  35.9223 15.50181965370029";
var SudEst = L.latLng(-90, 180),
  NordOvest = L.latLng(90, -180),
  confini = L.latLngBounds(SudEst, NordOvest);
var OSM = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  noWrap: true,
  attribution: '© OpenStreetMap'
});
var MAPBOX = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=pk.eyJ1Ijoic2dhbWJlIiwiYSI6ImNsYWRvdzlqeTBseHozdmxkM21ndG9kbzkifQ.BsiPWaIBggyVoE98kvU5aQ", {
  id: 'mapbox/streets-v11',
  tileSize: 512,
  zoomOffset: -1,
  attribution: '© MapBox'
});
var map = L.map('map', {
  zoomSnap: 0.25,
  minZoom: 3,
  maxBounds: confini,
  maxBoundsViscosity: 1.0,
  layers: [OSM, MAPBOX]
}).setView([0, 0], 1);
var layersMappa = {
  "OpenStreetMap": OSM,
  "MapBox": MAPBOX
};
var controlloLayer = L.control.layers(layersMappa).addTo(map);
var barraLaterale = L.control.sidebar('sidebar').addTo(map);
var scalaMappa = L.control.scale().addTo(map);
var isUserLocalized = false;
var latlang = [];
var multiPolyLineOptions = {
  color: 'red'
};
var multipolyline = L.polyline(latlang, multiPolyLineOptions);
function counter() {
  setInterval(function () {
    var latLonObj = (0, _tle.getLatLngObj)(tle);
  }, 2000);
}

//counter();

//setInterval(drawLine, 5000)
function drawLine() {
  fetch(url).then(function (response) {
    return response.json();
  }).then(function (data) {
    var line1 = data.line1,
      line2 = data.line2;
    console.log(line1, line2);
    var ALPHA = Math.asin(Math.sqrt(Math.pow(EARTH_RADIUS + altitude, 2) - Math.pow(EARTH_RADIUS, 2)) / EARTH_RADIUS) * (180 / PI); //radiant to degrees conversion

    var horizonRadius = 2 * PI * EARTH_RADIUS * (ALPHA / 360);
    latlang.push([latitude, longitude]);
    pulisciMappa();
    var multipolyline = L.polyline(latlang, multiPolyLineOptions);
    multipolyline.addTo(map);
    var circle = L.circle([latitude, longitude], {
      color: 'white',
      fillColor: 'white',
      fillOpacity: 0.25,
      radius: horizonRadius * 1000
    }).addTo(map);
    var waypoint = L.marker([latitude, longitude]).addTo(map).bindPopup("".concat(latitude, "<br>").concat(longitude)).openPopup();
  });
}
function pulisciMappa() {
  var i;
  for (i in map._layers) {
    if (map._layers[i]._path != undefined) {
      try {
        map.removeLayer(map._layers[i]);
      } catch (e) {
        console.log("Problema con layer:" + e + map._layers[i]);
      }
    }
  }
}
var iconaBrutta = "https://img.icons8.com/ios-filled/50/null/exterior.png";
var greenIcon = L.icon({
  iconUrl: iconaBrutta,
  iconSize: [24, 24],
  // size of the icon
  iconAnchor: [12, 12],
  // point of the icon which will correspond to marker's location
  popupAnchor: [0, -12] // point from which the popup should open relative to the iconAnchor
});

document.getElementById("gps-button").addEventListener("click", geoLocalizzaUtente);
function geoLocalizzaUtente() {
  if (!isUserLocalized) {
    map.locate({
      setView: true,
      maxZoom: 5
    });
    map.on("locationfound", function (ev) {
      isUserLocalized = true;
      var waypoint = L.marker(ev.latlng, {
        icon: greenIcon
      }).addTo(map);
      waypoint.bindPopup("Sei qui giusto?").openPopup();
    });
  } else {
    alert("Sei già stato localizzato!");
  }
}
function openNav() {
  document.getElementById("mySidenav").style.width = "250px";
}
function closeNav() {
  document.getElementById("mySidenav").style.width = "0";
}
},{"tle.js":"../node_modules/tle.js/dist/tlejs.umd.js","material-icons/iconfont/material-icons.css":"../node_modules/material-icons/iconfont/material-icons.css","leaflet-easybutton":"../node_modules/leaflet-easybutton/src/easy-button.js"}],"../node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;
function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}
module.bundle.Module = Module;
var checkedAssets, assetsToAccept;
var parent = module.bundle.parent;
if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "51560" + '/');
  ws.onmessage = function (event) {
    checkedAssets = {};
    assetsToAccept = [];
    var data = JSON.parse(event.data);
    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);
          if (didAccept) {
            handled = true;
          }
        }
      });

      // Enable HMR for CSS by default.
      handled = handled || data.assets.every(function (asset) {
        return asset.type === 'css' && asset.generated.js;
      });
      if (handled) {
        console.clear();
        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });
        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else if (location.reload) {
        // `location` global exists in a web worker context but lacks `.reload()` function.
        location.reload();
      }
    }
    if (data.type === 'reload') {
      ws.close();
      ws.onclose = function () {
        location.reload();
      };
    }
    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }
    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}
function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);
  if (overlay) {
    overlay.remove();
  }
}
function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;

  // html encode message and stack trace
  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}
function getParents(bundle, id) {
  var modules = bundle.modules;
  if (!modules) {
    return [];
  }
  var parents = [];
  var k, d, dep;
  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];
      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }
  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }
  return parents;
}
function hmrApply(bundle, asset) {
  var modules = bundle.modules;
  if (!modules) {
    return;
  }
  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}
function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;
  if (!modules) {
    return;
  }
  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }
  if (checkedAssets[id]) {
    return;
  }
  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);
  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }
  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id);
  });
}
function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};
  if (cached) {
    cached.hot.data = bundle.hotData;
  }
  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }
  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];
  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });
    return true;
  }
}
},{}]},{},["../node_modules/parcel-bundler/src/builtins/hmr-runtime.js","script/main.js"], null)
//# sourceMappingURL=/main.0ab05bb7.js.map