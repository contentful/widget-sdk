(function(){
function f(a) {
  throw a;
}
var h = void 0, j = true, k = null, o = false;
function aa() {
  return function() {
  }
}
function p(a) {
  return function(b) {
    this[a] = b
  }
}
function ba(a) {
  return function() {
    return this[a]
  }
}
function ca(a) {
  return function() {
    return a
  }
}
var q, da = da || {}, r = this;
function ea(a) {
  for(var a = a.split("."), b = r, c;c = a.shift();) {
    if(b[c] != k) {
      b = b[c]
    }else {
      return k
    }
  }
  return b
}
function fa() {
}
function ga(a) {
  var b = typeof a;
  if(b == "object") {
    if(a) {
      if(a instanceof Array) {
        return"array"
      }else {
        if(a instanceof Object) {
          return b
        }
      }
      var c = Object.prototype.toString.call(a);
      if(c == "[object Window]") {
        return"object"
      }
      if(c == "[object Array]" || typeof a.length == "number" && typeof a.splice != "undefined" && typeof a.propertyIsEnumerable != "undefined" && !a.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(c == "[object Function]" || typeof a.call != "undefined" && typeof a.propertyIsEnumerable != "undefined" && !a.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(b == "function" && typeof a.call == "undefined") {
      return"object"
    }
  }
  return b
}
function s(a) {
  return ga(a) == "array"
}
function ha(a) {
  var b = ga(a);
  return b == "array" || b == "object" && typeof a.length == "number"
}
function t(a) {
  return typeof a == "string"
}
function ia(a) {
  return a[ja] || (a[ja] = ++ka)
}
var ja = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36), ka = 0;
function la(a, b, c) {
  return a.call.apply(a.bind, arguments)
}
function ma(a, b, c) {
  a || f(Error());
  if(arguments.length > 2) {
    var d = Array.prototype.slice.call(arguments, 2);
    return function() {
      var c = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(c, d);
      return a.apply(b, c)
    }
  }else {
    return function() {
      return a.apply(b, arguments)
    }
  }
}
function u(a, b, c) {
  u = Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1 ? la : ma;
  return u.apply(k, arguments)
}
var v = Date.now || function() {
  return+new Date
};
function y(a, b) {
  function c() {
  }
  c.prototype = b.prototype;
  a.ka = b.prototype;
  a.prototype = new c
}
;function na(a, b) {
  for(var c = 1;c < arguments.length;c++) {
    var d = String(arguments[c]).replace(/\$/g, "$$$$"), a = a.replace(/\%s/, d)
  }
  return a
}
function oa(a) {
  if(!pa.test(a)) {
    return a
  }
  a.indexOf("&") != -1 && (a = a.replace(qa, "&amp;"));
  a.indexOf("<") != -1 && (a = a.replace(ra, "&lt;"));
  a.indexOf(">") != -1 && (a = a.replace(sa, "&gt;"));
  a.indexOf('"') != -1 && (a = a.replace(ta, "&quot;"));
  return a
}
var qa = /&/g, ra = /</g, sa = />/g, ta = /\"/g, pa = /[&<>\"]/;
function ua(a, b) {
  if(a < b) {
    return-1
  }else {
    if(a > b) {
      return 1
    }
  }
  return 0
}
;var z, wa, xa, ya;
function za() {
  return r.navigator ? r.navigator.userAgent : k
}
ya = xa = wa = z = o;
var Aa;
if(Aa = za()) {
  var Ba = r.navigator;
  z = Aa.indexOf("Opera") == 0;
  wa = !z && Aa.indexOf("MSIE") != -1;
  xa = !z && Aa.indexOf("WebKit") != -1;
  ya = !z && !xa && Ba.product == "Gecko"
}
var Ca = z, A = wa, Da = ya, B = xa, Ea = r.navigator, Fa = (Ea && Ea.platform || "").indexOf("Mac") != -1, Ga;
a: {
  var Ha = "", Ia;
  if(Ca && r.opera) {
    var Ja = r.opera.version, Ha = typeof Ja == "function" ? Ja() : Ja
  }else {
    if(Da ? Ia = /rv\:([^\);]+)(\)|;)/ : A ? Ia = /MSIE\s+([^\);]+)(\)|;)/ : B && (Ia = /WebKit\/(\S+)/), Ia) {
      var Ka = Ia.exec(za()), Ha = Ka ? Ka[1] : ""
    }
  }
  if(A) {
    var La, Ma = r.document;
    La = Ma ? Ma.documentMode : h;
    if(La > parseFloat(Ha)) {
      Ga = String(La);
      break a
    }
  }
  Ga = Ha
}
var Na = {};
function C(a) {
  var b;
  if(!(b = Na[a])) {
    b = 0;
    for(var c = String(Ga).replace(/^[\s\xa0]+|[\s\xa0]+$/g, "").split("."), d = String(a).replace(/^[\s\xa0]+|[\s\xa0]+$/g, "").split("."), e = Math.max(c.length, d.length), g = 0;b == 0 && g < e;g++) {
      var i = c[g] || "", m = d[g] || "", l = RegExp("(\\d*)(\\D*)", "g"), n = RegExp("(\\d*)(\\D*)", "g");
      do {
        var w = l.exec(i) || ["", "", ""], x = n.exec(m) || ["", "", ""];
        if(w[0].length == 0 && x[0].length == 0) {
          break
        }
        b = ua(w[1].length == 0 ? 0 : parseInt(w[1], 10), x[1].length == 0 ? 0 : parseInt(x[1], 10)) || ua(w[2].length == 0, x[2].length == 0) || ua(w[2], x[2])
      }while(b == 0)
    }
    b = Na[a] = b >= 0
  }
  return b
}
var Oa = {};
function Pa(a) {
  return Oa[a] || (Oa[a] = A && !!document.documentMode && document.documentMode >= a)
}
;function Qa(a) {
  Error.captureStackTrace ? Error.captureStackTrace(this, Qa) : this.stack = Error().stack || "";
  if(a) {
    this.message = String(a)
  }
}
y(Qa, Error);
Qa.prototype.name = "CustomError";
function Ra(a, b) {
  b.unshift(a);
  Qa.call(this, na.apply(k, b));
  b.shift();
  this.vc = a
}
y(Ra, Qa);
Ra.prototype.name = "AssertionError";
function Sa(a, b) {
  f(new Ra("Failure" + (a ? ": " + a : ""), Array.prototype.slice.call(arguments, 1)))
}
;var Ta = RegExp("^(?:([^:/?#.]+):)?(?://(?:([^/?#]*)@)?([\\w\\d\\-\\u0100-\\uffff.%]*)(?::([0-9]+))?)?([^?#]+)?(?:\\?([^#]*))?(?:#(.*))?$");
function Ua(a) {
  var b = E, c;
  for(c in b) {
    a.call(h, b[c], c, b)
  }
}
function Va(a) {
  var b = [], c = 0, d;
  for(d in a) {
    b[c++] = a[d]
  }
  return b
}
function Wa(a) {
  var b = [], c = 0, d;
  for(d in a) {
    b[c++] = d
  }
  return b
}
var Xa = "constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf".split(",");
function Ya(a, b) {
  for(var c, d, e = 1;e < arguments.length;e++) {
    d = arguments[e];
    for(c in d) {
      a[c] = d[c]
    }
    for(var g = 0;g < Xa.length;g++) {
      c = Xa[g], Object.prototype.hasOwnProperty.call(d, c) && (a[c] = d[c])
    }
  }
}
;var F = Array.prototype, Za = F.indexOf ? function(a, b, c) {
  return F.indexOf.call(a, b, c)
} : function(a, b, c) {
  c = c == k ? 0 : c < 0 ? Math.max(0, a.length + c) : c;
  if(t(a)) {
    return!t(b) || b.length != 1 ? -1 : a.indexOf(b, c)
  }
  for(;c < a.length;c++) {
    if(c in a && a[c] === b) {
      return c
    }
  }
  return-1
}, $a = F.forEach ? function(a, b, c) {
  F.forEach.call(a, b, c)
} : function(a, b, c) {
  for(var d = a.length, e = t(a) ? a.split("") : a, g = 0;g < d;g++) {
    g in e && b.call(c, e[g], g, a)
  }
};
function ab(a) {
  return F.concat.apply(F, arguments)
}
function bb(a) {
  var b = a.length;
  if(b > 0) {
    for(var c = Array(b), d = 0;d < b;d++) {
      c[d] = a[d]
    }
    return c
  }
  return[]
}
;function cb(a) {
  if(typeof a.K == "function") {
    return a.K()
  }
  if(t(a)) {
    return a.split("")
  }
  if(ha(a)) {
    for(var b = [], c = a.length, d = 0;d < c;d++) {
      b.push(a[d])
    }
    return b
  }
  return Va(a)
}
function G(a, b, c) {
  if(typeof a.forEach == "function") {
    a.forEach(b, c)
  }else {
    if(ha(a) || t(a)) {
      $a(a, b, c)
    }else {
      var d;
      if(typeof a.ea == "function") {
        d = a.ea()
      }else {
        if(typeof a.K != "function") {
          if(ha(a) || t(a)) {
            d = [];
            for(var e = a.length, g = 0;g < e;g++) {
              d.push(g)
            }
          }else {
            d = Wa(a)
          }
        }else {
          d = h
        }
      }
      for(var e = cb(a), g = e.length, i = 0;i < g;i++) {
        b.call(c, e[i], d && d[i], a)
      }
    }
  }
}
;function db(a, b) {
  this.M = {};
  this.j = [];
  var c = arguments.length;
  if(c > 1) {
    c % 2 && f(Error("Uneven number of arguments"));
    for(var d = 0;d < c;d += 2) {
      this.set(arguments[d], arguments[d + 1])
    }
  }else {
    if(a) {
      a instanceof db ? (c = a.ea(), d = a.K()) : (c = Wa(a), d = Va(a));
      for(var e = 0;e < c.length;e++) {
        this.set(c[e], d[e])
      }
    }
  }
}
q = db.prototype;
q.g = 0;
q.Tb = 0;
q.K = function() {
  eb(this);
  for(var a = [], b = 0;b < this.j.length;b++) {
    a.push(this.M[this.j[b]])
  }
  return a
};
q.ea = function() {
  eb(this);
  return this.j.concat()
};
q.ca = function(a) {
  return H(this.M, a)
};
q.remove = function(a) {
  return H(this.M, a) ? (delete this.M[a], this.g--, this.Tb++, this.j.length > 2 * this.g && eb(this), j) : o
};
function eb(a) {
  if(a.g != a.j.length) {
    for(var b = 0, c = 0;b < a.j.length;) {
      var d = a.j[b];
      H(a.M, d) && (a.j[c++] = d);
      b++
    }
    a.j.length = c
  }
  if(a.g != a.j.length) {
    for(var e = {}, c = b = 0;b < a.j.length;) {
      d = a.j[b], H(e, d) || (a.j[c++] = d, e[d] = 1), b++
    }
    a.j.length = c
  }
}
q.get = function(a, b) {
  return H(this.M, a) ? this.M[a] : b
};
q.set = function(a, b) {
  H(this.M, a) || (this.g++, this.j.push(a), this.Tb++);
  this.M[a] = b
};
q.n = function() {
  return new db(this)
};
function H(a, b) {
  return Object.prototype.hasOwnProperty.call(a, b)
}
;function I(a, b) {
  var c;
  if(a instanceof I) {
    this.B = b !== h ? b : a.B, fb(this, a.ja), c = a.Ta, J(this), this.Ta = c, gb(this, a.da), hb(this, a.wa), c = a.v, J(this), this.v = c, ib(this, a.O.n()), c = a.Ia, J(this), this.Ia = c
  }else {
    if(a && (c = String(a).match(Ta))) {
      this.B = !!b;
      fb(this, c[1] || "", j);
      var d = c[2] || "";
      J(this);
      this.Ta = d ? decodeURIComponent(d) : "";
      gb(this, c[3] || "", j);
      hb(this, c[4]);
      d = c[5] || "";
      J(this);
      this.v = d ? decodeURIComponent(d) : "";
      ib(this, c[6] || "", j);
      c = c[7] || "";
      J(this);
      this.Ia = c ? decodeURIComponent(c) : ""
    }else {
      this.B = !!b, this.O = new jb(k, 0, this.B)
    }
  }
}
q = I.prototype;
q.ja = "";
q.Ta = "";
q.da = "";
q.wa = k;
q.v = "";
q.Ia = "";
q.bc = o;
q.B = o;
q.toString = function() {
  var a = [], b = this.ja;
  b && a.push(kb(b, lb), ":");
  if(b = this.da) {
    a.push("//");
    var c = this.Ta;
    c && a.push(kb(c, lb), "@");
    a.push(encodeURIComponent(String(b)));
    b = this.wa;
    b != k && a.push(":", String(b))
  }
  if(b = this.v) {
    this.da && b.charAt(0) != "/" && a.push("/"), a.push(kb(b, b.charAt(0) == "/" ? mb : nb))
  }
  (b = this.O.toString()) && a.push("?", b);
  (b = this.Ia) && a.push("#", kb(b, ob));
  return a.join("")
};
q.n = function() {
  return new I(this)
};
function fb(a, b, c) {
  J(a);
  a.ja = c ? b ? decodeURIComponent(b) : "" : b;
  if(a.ja) {
    a.ja = a.ja.replace(/:$/, "")
  }
}
function gb(a, b, c) {
  J(a);
  a.da = c ? b ? decodeURIComponent(b) : "" : b
}
function hb(a, b) {
  J(a);
  b ? (b = Number(b), (isNaN(b) || b < 0) && f(Error("Bad port number " + b)), a.wa = b) : a.wa = k
}
function ib(a, b, c) {
  J(a);
  b instanceof jb ? (a.O = b, a.O.kb(a.B)) : (c || (b = kb(b, pb)), a.O = new jb(b, 0, a.B))
}
function K(a, b, c) {
  J(a);
  a.O.set(b, c)
}
function qb(a, b, c) {
  J(a);
  s(c) || (c = [String(c)]);
  rb(a.O, b, c)
}
function L(a) {
  J(a);
  K(a, "zx", Math.floor(Math.random() * 2147483648).toString(36) + Math.abs(Math.floor(Math.random() * 2147483648) ^ v()).toString(36));
  return a
}
function J(a) {
  a.bc && f(Error("Tried to modify a read-only Uri"))
}
q.kb = function(a) {
  this.B = a;
  this.O && this.O.kb(a);
  return this
};
function sb(a, b, c, d) {
  var e = new I(k, h);
  a && fb(e, a);
  b && gb(e, b);
  c && hb(e, c);
  if(d) {
    J(e), e.v = d
  }
  return e
}
function kb(a, b) {
  return t(a) ? encodeURI(a).replace(b, tb) : k
}
function tb(a) {
  a = a.charCodeAt(0);
  return"%" + (a >> 4 & 15).toString(16) + (a & 15).toString(16)
}
var lb = /[#\/\?@]/g, nb = /[\#\?:]/g, mb = /[\#\?]/g, pb = /[\#\?@]/g, ob = /#/g;
function jb(a, b, c) {
  this.A = a || k;
  this.B = !!c
}
function M(a) {
  if(!a.i && (a.i = new db, a.g = 0, a.A)) {
    for(var b = a.A.split("&"), c = 0;c < b.length;c++) {
      var d = b[c].indexOf("="), e = k, g = k;
      d >= 0 ? (e = b[c].substring(0, d), g = b[c].substring(d + 1)) : e = b[c];
      e = decodeURIComponent(e.replace(/\+/g, " "));
      e = N(a, e);
      a.add(e, g ? decodeURIComponent(g.replace(/\+/g, " ")) : "")
    }
  }
}
q = jb.prototype;
q.i = k;
q.g = k;
q.add = function(a, b) {
  M(this);
  this.A = k;
  var a = N(this, a), c = this.i.get(a);
  c || this.i.set(a, c = []);
  c.push(b);
  this.g++;
  return this
};
q.remove = function(a) {
  M(this);
  a = N(this, a);
  return this.i.ca(a) ? (this.A = k, this.g -= this.i.get(a).length, this.i.remove(a)) : o
};
q.ca = function(a) {
  M(this);
  a = N(this, a);
  return this.i.ca(a)
};
q.ea = function() {
  M(this);
  for(var a = this.i.K(), b = this.i.ea(), c = [], d = 0;d < b.length;d++) {
    for(var e = a[d], g = 0;g < e.length;g++) {
      c.push(b[d])
    }
  }
  return c
};
q.K = function(a) {
  M(this);
  var b = [];
  if(a) {
    this.ca(a) && (b = ab(b, this.i.get(N(this, a))))
  }else {
    for(var a = this.i.K(), c = 0;c < a.length;c++) {
      b = ab(b, a[c])
    }
  }
  return b
};
q.set = function(a, b) {
  M(this);
  this.A = k;
  a = N(this, a);
  this.ca(a) && (this.g -= this.i.get(a).length);
  this.i.set(a, [b]);
  this.g++;
  return this
};
q.get = function(a, b) {
  var c = a ? this.K(a) : [];
  return c.length > 0 ? c[0] : b
};
function rb(a, b, c) {
  a.remove(b);
  if(c.length > 0) {
    a.A = k, a.i.set(N(a, b), bb(c)), a.g += c.length
  }
}
q.toString = function() {
  if(this.A) {
    return this.A
  }
  if(!this.i) {
    return""
  }
  for(var a = [], b = this.i.ea(), c = 0;c < b.length;c++) {
    for(var d = b[c], e = encodeURIComponent(String(d)), d = this.K(d), g = 0;g < d.length;g++) {
      var i = e;
      d[g] !== "" && (i += "=" + encodeURIComponent(String(d[g])));
      a.push(i)
    }
  }
  return this.A = a.join("&")
};
q.n = function() {
  var a = new jb;
  a.A = this.A;
  if(this.i) {
    a.i = this.i.n()
  }
  return a
};
function N(a, b) {
  var c = String(b);
  a.B && (c = c.toLowerCase());
  return c
}
q.kb = function(a) {
  if(a && !this.B) {
    M(this), this.A = k, G(this.i, function(a, c) {
      var d = c.toLowerCase();
      c != d && (this.remove(c), rb(this, d, a))
    }, this)
  }
  this.B = a
};
function ub() {
}
ub.prototype.Ca = k;
var vb;
function wb() {
}
y(wb, ub);
function xb(a) {
  return(a = yb(a)) ? new ActiveXObject(a) : new XMLHttpRequest
}
function zb(a) {
  var b = {};
  yb(a) && (b[0] = j, b[1] = j);
  return b
}
wb.prototype.eb = k;
function yb(a) {
  if(!a.eb && typeof XMLHttpRequest == "undefined" && typeof ActiveXObject != "undefined") {
    for(var b = ["MSXML2.XMLHTTP.6.0", "MSXML2.XMLHTTP.3.0", "MSXML2.XMLHTTP", "Microsoft.XMLHTTP"], c = 0;c < b.length;c++) {
      var d = b[c];
      try {
        return new ActiveXObject(d), a.eb = d
      }catch(e) {
      }
    }
    f(Error("Could not create ActiveXObject. ActiveX might be disabled, or MSXML might not be installed"))
  }
  return a.eb
}
vb = new wb;
function Ab() {
}
var Bb = 0;
q = Ab.prototype;
q.key = 0;
q.ha = o;
q.pb = o;
q.Ka = function(a, b, c, d, e, g) {
  ga(a) == "function" ? this.Cb = j : a && a.handleEvent && ga(a.handleEvent) == "function" ? this.Cb = o : f(Error("Invalid listener argument"));
  this.ua = a;
  this.Nb = b;
  this.src = c;
  this.type = d;
  this.capture = !!e;
  this.cb = g;
  this.pb = o;
  this.key = ++Bb;
  this.ha = o
};
q.handleEvent = function(a) {
  return this.Cb ? this.ua.call(this.cb || this.src, a) : this.ua.handleEvent.call(this.ua, a)
};
!A || Pa(9);
var Cb = !A || Pa(9), Db = A && !C("8");
!B || C("528");
Da && C("1.9b") || A && C("8") || Ca && C("9.5") || B && C("528");
Da && !C("8") || A && C("9");
function O() {
}
O.prototype.wb = o;
O.prototype.Da = function() {
  if(!this.wb) {
    this.wb = j, this.z()
  }
};
O.prototype.z = function() {
  this.Xb && Eb.apply(k, this.Xb);
  if(this.Hb) {
    for(;this.Hb.length;) {
      this.Hb.shift()()
    }
  }
};
function Eb(a) {
  for(var b = 0, c = arguments.length;b < c;++b) {
    var d = arguments[b];
    ha(d) ? Eb.apply(k, d) : d && typeof d.Da == "function" && d.Da()
  }
}
;function P(a, b) {
  this.type = a;
  this.currentTarget = this.target = b
}
y(P, O);
q = P.prototype;
q.z = function() {
  delete this.type;
  delete this.target;
  delete this.currentTarget
};
q.ga = o;
q.ub = o;
q.Qa = j;
q.preventDefault = function() {
  this.ub = j;
  this.Qa = o
};
function Fb(a) {
  Fb[" "](a);
  return a
}
Fb[" "] = fa;
function Gb(a, b) {
  a && this.Ka(a, b)
}
y(Gb, P);
q = Gb.prototype;
q.target = k;
q.relatedTarget = k;
q.offsetX = 0;
q.offsetY = 0;
q.clientX = 0;
q.clientY = 0;
q.screenX = 0;
q.screenY = 0;
q.button = 0;
q.keyCode = 0;
q.charCode = 0;
q.ctrlKey = o;
q.altKey = o;
q.shiftKey = o;
q.metaKey = o;
q.lc = o;
q.bb = k;
q.Ka = function(a, b) {
  var c = this.type = a.type;
  P.call(this, c);
  this.target = a.target || a.srcElement;
  this.currentTarget = b;
  var d = a.relatedTarget;
  if(d) {
    if(Da) {
      var e;
      a: {
        try {
          Fb(d.nodeName);
          e = j;
          break a
        }catch(g) {
        }
        e = o
      }
      e || (d = k)
    }
  }else {
    if(c == "mouseover") {
      d = a.fromElement
    }else {
      if(c == "mouseout") {
        d = a.toElement
      }
    }
  }
  this.relatedTarget = d;
  this.offsetX = B || a.offsetX !== h ? a.offsetX : a.layerX;
  this.offsetY = B || a.offsetY !== h ? a.offsetY : a.layerY;
  this.clientX = a.clientX !== h ? a.clientX : a.pageX;
  this.clientY = a.clientY !== h ? a.clientY : a.pageY;
  this.screenX = a.screenX || 0;
  this.screenY = a.screenY || 0;
  this.button = a.button;
  this.keyCode = a.keyCode || 0;
  this.charCode = a.charCode || (c == "keypress" ? a.keyCode : 0);
  this.ctrlKey = a.ctrlKey;
  this.altKey = a.altKey;
  this.shiftKey = a.shiftKey;
  this.metaKey = a.metaKey;
  this.lc = Fa ? a.metaKey : a.ctrlKey;
  this.state = a.state;
  this.bb = a;
  a.ub && this.preventDefault();
  delete this.ga
};
q.preventDefault = function() {
  Gb.ka.preventDefault.call(this);
  var a = this.bb;
  if(a.preventDefault) {
    a.preventDefault()
  }else {
    if(a.returnValue = o, Db) {
      try {
        if(a.ctrlKey || a.keyCode >= 112 && a.keyCode <= 123) {
          a.keyCode = -1
        }
      }catch(b) {
      }
    }
  }
};
q.z = function() {
  Gb.ka.z.call(this);
  this.relatedTarget = this.currentTarget = this.target = this.bb = k
};
var Hb = {}, Q = {}, E = {}, Ib = {};
function Jb(a, b, c, d, e) {
  if(b) {
    if(s(b)) {
      for(var g = 0;g < b.length;g++) {
        Jb(a, b[g], c, d, e)
      }
      return k
    }else {
      var d = !!d, i = Q;
      b in i || (i[b] = {g:0, C:0});
      i = i[b];
      d in i || (i[d] = {g:0, C:0}, i.g++);
      var i = i[d], m = ia(a), l;
      i.C++;
      if(i[m]) {
        l = i[m];
        for(g = 0;g < l.length;g++) {
          if(i = l[g], i.ua == c && i.cb == e) {
            if(i.ha) {
              break
            }
            return l[g].key
          }
        }
      }else {
        l = i[m] = [], i.g++
      }
      g = Kb();
      g.src = a;
      i = new Ab;
      i.Ka(c, g, a, b, d, e);
      c = i.key;
      g.key = c;
      l.push(i);
      Hb[c] = i;
      E[m] || (E[m] = []);
      E[m].push(i);
      a.addEventListener ? (a == r || !a.sb) && a.addEventListener(b, g, d) : a.attachEvent(b in Ib ? Ib[b] : Ib[b] = "on" + b, g);
      return c
    }
  }else {
    f(Error("Invalid event type"))
  }
}
function Kb() {
  var a = Lb, b = Cb ? function(c) {
    return a.call(b.src, b.key, c)
  } : function(c) {
    c = a.call(b.src, b.key, c);
    if(!c) {
      return c
    }
  };
  return b
}
function Mb(a, b, c, d, e) {
  if(s(b)) {
    for(var g = 0;g < b.length;g++) {
      Mb(a, b[g], c, d, e)
    }
  }else {
    d = !!d;
    a: {
      g = Q;
      if(b in g && (g = g[b], d in g && (g = g[d], a = ia(a), g[a]))) {
        a = g[a];
        break a
      }
      a = k
    }
    if(a) {
      for(g = 0;g < a.length;g++) {
        if(a[g].ua == c && a[g].capture == d && a[g].cb == e) {
          Nb(a[g].key);
          break
        }
      }
    }
  }
}
function Nb(a) {
  if(!Hb[a]) {
    return o
  }
  var b = Hb[a];
  if(b.ha) {
    return o
  }
  var c = b.src, d = b.type, e = b.Nb, g = b.capture;
  c.removeEventListener ? (c == r || !c.sb) && c.removeEventListener(d, e, g) : c.detachEvent && c.detachEvent(d in Ib ? Ib[d] : Ib[d] = "on" + d, e);
  c = ia(c);
  e = Q[d][g][c];
  if(E[c]) {
    var i = E[c], m = Za(i, b);
    m >= 0 && F.splice.call(i, m, 1);
    i.length == 0 && delete E[c]
  }
  b.ha = j;
  e.Gb = j;
  Ob(d, g, c, e);
  delete Hb[a];
  return j
}
function Ob(a, b, c, d) {
  if(!d.La && d.Gb) {
    for(var e = 0, g = 0;e < d.length;e++) {
      d[e].ha ? d[e].Nb.src = k : (e != g && (d[g] = d[e]), g++)
    }
    d.length = g;
    d.Gb = o;
    g == 0 && (delete Q[a][b][c], Q[a][b].g--, Q[a][b].g == 0 && (delete Q[a][b], Q[a].g--), Q[a].g == 0 && delete Q[a])
  }
}
function Pb(a) {
  var b, c = 0, d = b == k;
  b = !!b;
  if(a == k) {
    Ua(function(a) {
      for(var e = a.length - 1;e >= 0;e--) {
        var g = a[e];
        if(d || b == g.capture) {
          Nb(g.key), c++
        }
      }
    })
  }else {
    if(a = ia(a), E[a]) {
      for(var a = E[a], e = a.length - 1;e >= 0;e--) {
        var g = a[e];
        if(d || b == g.capture) {
          Nb(g.key), c++
        }
      }
    }
  }
}
function Qb(a, b, c, d, e) {
  var g = 1, b = ia(b);
  if(a[b]) {
    a.C--;
    a = a[b];
    a.La ? a.La++ : a.La = 1;
    try {
      for(var i = a.length, m = 0;m < i;m++) {
        var l = a[m];
        l && !l.ha && (g &= Rb(l, e) !== o)
      }
    }finally {
      a.La--, Ob(c, d, b, a)
    }
  }
  return Boolean(g)
}
function Rb(a, b) {
  a.pb && Nb(a.key);
  return a.handleEvent(b)
}
function Lb(a, b) {
  if(!Hb[a]) {
    return j
  }
  var c = Hb[a], d = c.type, e = Q;
  if(!(d in e)) {
    return j
  }
  var e = e[d], g, i;
  if(!Cb) {
    g = b || ea("window.event");
    var m = j in e, l = o in e;
    if(m) {
      if(g.keyCode < 0 || g.returnValue != h) {
        return j
      }
      a: {
        var n = o;
        if(g.keyCode == 0) {
          try {
            g.keyCode = -1;
            break a
          }catch(w) {
            n = j
          }
        }
        if(n || g.returnValue == h) {
          g.returnValue = j
        }
      }
    }
    n = new Gb;
    n.Ka(g, this);
    g = j;
    try {
      if(m) {
        for(var x = [], va = n.currentTarget;va;va = va.parentNode) {
          x.push(va)
        }
        i = e[j];
        i.C = i.g;
        for(var D = x.length - 1;!n.ga && D >= 0 && i.C;D--) {
          n.currentTarget = x[D], g &= Qb(i, x[D], d, j, n)
        }
        if(l) {
          i = e[o];
          i.C = i.g;
          for(D = 0;!n.ga && D < x.length && i.C;D++) {
            n.currentTarget = x[D], g &= Qb(i, x[D], d, o, n)
          }
        }
      }else {
        g = Rb(c, n)
      }
    }finally {
      if(x) {
        x.length = 0
      }
      n.Da()
    }
    return g
  }
  d = new Gb(b, this);
  try {
    g = Rb(c, d)
  }finally {
    d.Da()
  }
  return g
}
;function Sb() {
}
y(Sb, O);
q = Sb.prototype;
q.sb = j;
q.jb = k;
q.addEventListener = function(a, b, c, d) {
  Jb(this, a, b, c, d)
};
q.removeEventListener = function(a, b, c, d) {
  Mb(this, a, b, c, d)
};
q.dispatchEvent = function(a) {
  var b = a.type || a, c = Q;
  if(b in c) {
    if(t(a)) {
      a = new P(a, this)
    }else {
      if(a instanceof P) {
        a.target = a.target || this
      }else {
        var d = a, a = new P(b, this);
        Ya(a, d)
      }
    }
    var d = 1, e, c = c[b], b = j in c, g;
    if(b) {
      e = [];
      for(g = this;g;g = g.jb) {
        e.push(g)
      }
      g = c[j];
      g.C = g.g;
      for(var i = e.length - 1;!a.ga && i >= 0 && g.C;i--) {
        a.currentTarget = e[i], d &= Qb(g, e[i], a.type, j, a) && a.Qa != o
      }
    }
    if(o in c) {
      if(g = c[o], g.C = g.g, b) {
        for(i = 0;!a.ga && i < e.length && g.C;i++) {
          a.currentTarget = e[i], d &= Qb(g, e[i], a.type, o, a) && a.Qa != o
        }
      }else {
        for(e = this;!a.ga && e && g.C;e = e.jb) {
          a.currentTarget = e, d &= Qb(g, e, a.type, o, a) && a.Qa != o
        }
      }
    }
    a = Boolean(d)
  }else {
    a = j
  }
  return a
};
q.z = function() {
  Sb.ka.z.call(this);
  Pb(this);
  this.jb = k
};
function Tb(a, b) {
  this.qa = a || 1;
  this.za = b || Ub;
  this.Xa = u(this.pc, this);
  this.ib = v()
}
y(Tb, Sb);
Tb.prototype.enabled = o;
var Ub = r.window;
q = Tb.prototype;
q.P = k;
q.setInterval = function(a) {
  this.qa = a;
  this.P && this.enabled ? (this.stop(), this.start()) : this.P && this.stop()
};
q.pc = function() {
  if(this.enabled) {
    var a = v() - this.ib;
    if(a > 0 && a < this.qa * 0.8) {
      this.P = this.za.setTimeout(this.Xa, this.qa - a)
    }else {
      if(this.dispatchEvent(Vb), this.enabled) {
        this.P = this.za.setTimeout(this.Xa, this.qa), this.ib = v()
      }
    }
  }
};
q.start = function() {
  this.enabled = j;
  if(!this.P) {
    this.P = this.za.setTimeout(this.Xa, this.qa), this.ib = v()
  }
};
q.stop = function() {
  this.enabled = o;
  if(this.P) {
    this.za.clearTimeout(this.P), this.P = k
  }
};
q.z = function() {
  Tb.ka.z.call(this);
  this.stop();
  delete this.za
};
var Vb = "tick";
function Wb(a) {
  this.c = a;
  this.j = []
}
y(Wb, O);
var Xb = [];
function Yb(a, b, c, d, e, g) {
  s(c) || (Xb[0] = c, c = Xb);
  for(var i = 0;i < c.length;i++) {
    a.j.push(Jb(b, c[i], d || a, e || o, g || a.c || a))
  }
}
Wb.prototype.z = function() {
  Wb.ka.z.call(this);
  $a(this.j, Nb);
  this.j.length = 0
};
Wb.prototype.handleEvent = function() {
  f(Error("EventHandler.handleEvent not implemented"))
};
function R(a, b, c, d, e, g) {
  this.f = a;
  this.a = b;
  this.V = c;
  this.D = d;
  this.xa = e || 1;
  this.ya = Zb;
  this.Ea = new Wb(this);
  this.u = g || k;
  this.Na = new Tb;
  this.Na.setInterval($b)
}
q = R.prototype;
q.t = k;
q.G = o;
q.na = k;
q.mb = k;
q.ia = k;
q.Aa = k;
q.R = k;
q.s = k;
q.T = k;
q.q = k;
q.Ba = 0;
q.I = k;
q.la = k;
q.l = k;
q.h = -1;
q.Qb = j;
q.aa = o;
var Zb = 45E3, $b = 250;
function ac(a, b) {
  switch(a) {
    case 0:
      return"Non-200 return code (" + b + ")";
    case 1:
      return"XMLHTTP failure (no data)";
    case 2:
      return"HttpConnection timeout";
    default:
      return"Unknown error"
  }
}
var bc = {}, cc = {};
function dc() {
  return!A || Pa(10)
}
q = R.prototype;
q.U = p("t");
q.setTimeout = p("ya");
function ec(a, b, c) {
  a.Aa = 1;
  a.R = L(b.n());
  a.T = c;
  a.tb = j;
  fc(a, k)
}
function gc(a, b, c, d, e) {
  a.Aa = 1;
  a.R = L(b.n());
  a.T = k;
  a.tb = c;
  if(e) {
    a.Qb = o
  }
  fc(a, d)
}
function fc(a, b) {
  a.ia = v();
  hc(a);
  a.s = a.R.n();
  qb(a.s, "t", a.xa);
  if(ic(a)) {
    a.Ba = 0;
    a.q = a.f.$a(a.f.Ra() ? b : k);
    Yb(a.Ea, a.q, "readystatechange", a.rc, o, a);
    var c;
    if(a.t) {
      c = a.t;
      var d = {}, e;
      for(e in c) {
        d[e] = c[e]
      }
      c = d
    }else {
      c = {}
    }
    a.T ? (a.la = "POST", c["Content-Type"] = "application/x-www-form-urlencoded", a.q.send(a.s, a.la, a.T, c)) : (a.la = "GET", a.Qb && !B && (c.Connection = "close"), a.q.send(a.s, a.la, k, c));
    if(d = a.T) {
      c = "";
      d = d.split("&");
      for(e = 0;e < d.length;e++) {
        var g = d[e].split("=");
        if(g.length > 1) {
          var i = g[0], g = g[1], m = i.split("_");
          c += m.length >= 2 && m[1] == "type" ? i + "=" + g + "&" : i + "=redacted&"
        }
      }
    }else {
      c = k
    }
    a.a.info("XMLHTTP REQ (" + a.D + ") [attempt " + a.xa + "]: " + a.la + "\n" + a.s + "\n" + c)
  }
}
q.rc = function(a) {
  a = a.target;
  try {
    if(a == this.q) {
      a: {
        var b = S(this.q);
        if(!dc() || B && !C("420+")) {
          if(b < 4) {
            break a
          }
        }else {
          if(b < 3 || b == 3 && !Ca && !jc(this.q)) {
            break a
          }
        }
        kc(this);
        var c = lc(this.q);
        this.h = c;
        var d = jc(this.q);
        d || this.a.info("No response text for uri " + this.s + " status " + c);
        this.G = c == 200;
        this.a.info("XMLHTTP RESP (" + this.D + ") [ attempt " + this.xa + "]: " + this.la + "\n" + this.s + "\n" + b + " " + c);
        if(this.G) {
          if(b == 4 && T(this), this.tb ? (mc(this, b, d), Ca && b == 3 && (Yb(this.Ea, this.Na, Vb, this.mc), this.Na.start())) : (nc(this.a, this.D, d, k), oc(this, d)), this.G && !this.aa) {
            b == 4 ? this.f.fa(this) : (this.G = o, hc(this))
          }
        }else {
          c == 400 && d.indexOf("Unknown SID") > 0 ? (this.l = 3, U(pc)) : (this.l = 0, U(qc)), nc(this.a, this.D, d), T(this), rc(this)
        }
      }
    }else {
      this.a.ma("Called back with an unexpected xmlhttp")
    }
  }catch(e) {
    this.a.info("Failed call to OnXmlHttpReadyStateChanged_"), this.q && jc(this.q) ? sc(this.a, e, "ResponseText: " + jc(this.q)) : sc(this.a, e, "No response text")
  }finally {
  }
};
function mc(a, b, c) {
  for(var d = j;!a.aa && a.Ba < c.length;) {
    var e = tc(a, c);
    if(e == cc) {
      if(b == 4) {
        a.l = 4, U(uc), d = o
      }
      nc(a.a, a.D, k, "[Incomplete Response]");
      break
    }else {
      if(e == bc) {
        a.l = 4;
        U(vc);
        nc(a.a, a.D, c, "[Invalid Chunk]");
        d = o;
        break
      }else {
        nc(a.a, a.D, e, k), oc(a, e)
      }
    }
  }
  if(b == 4 && c.length == 0) {
    a.l = 1, U(wc), d = o
  }
  a.G = a.G && d;
  d || (nc(a.a, a.D, c, "[Invalid Chunked Response]"), T(a), rc(a))
}
q.mc = function() {
  var a = S(this.q), b = jc(this.q);
  this.Ba < b.length && (kc(this), mc(this, a, b), this.G && a != 4 && hc(this))
};
function ic(a) {
  return!a.u ? j : a.u.ac() ? (Yb(a.Ea, a.u, "offline", a.qb), j) : (a.qb(), o)
}
q.qb = function() {
  this.G && this.a.F("Received browser offline event even though request completed successfully");
  this.a.info("BROWSER_OFFLINE: " + this.s);
  T(this);
  this.l = 6;
  U(xc);
  rc(this)
};
function tc(a, b) {
  var c = a.Ba, d = b.indexOf("\n", c);
  if(d == -1) {
    return cc
  }
  c = Number(b.substring(c, d));
  if(isNaN(c)) {
    return bc
  }
  d += 1;
  if(d + c > b.length) {
    return cc
  }
  var e = b.substr(d, c);
  a.Ba = d + c;
  return e
}
function yc(a, b) {
  a.ia = v();
  hc(a);
  var c = b ? window.location.hostname : "";
  a.s = a.R.n();
  K(a.s, "DOMAIN", c);
  K(a.s, "t", a.xa);
  if(ic(a)) {
    try {
      a.I = new ActiveXObject("htmlfile")
    }catch(d) {
      a.a.F("ActiveX blocked");
      T(a);
      a.l = 7;
      U(zc);
      rc(a);
      return
    }
    var e = "<html><body>";
    b && (e += '<script>document.domain="' + c + '"<\/script>');
    e += "</body></html>";
    a.I.open();
    a.I.write(e);
    a.I.close();
    a.I.parentWindow.m = u(a.jc, a);
    a.I.parentWindow.d = u(a.Mb, a, j);
    a.I.parentWindow.rpcClose = u(a.Mb, a, o);
    c = a.I.createElement("div");
    a.I.parentWindow.document.body.appendChild(c);
    c.innerHTML = '<iframe src="' + a.s + '"></iframe>';
    a.a.info("TRIDENT REQ (" + a.D + ") [ attempt " + a.xa + "]: GET\n" + a.s)
  }
}
q.jc = function(a) {
  V(u(this.ic, this, a), 0)
};
q.ic = function(a) {
  if(!this.aa) {
    var b = this.a;
    b.info("TRIDENT TEXT (" + this.D + "): " + Ac(b, a));
    kc(this);
    oc(this, a);
    hc(this)
  }
};
q.Mb = function(a) {
  V(u(this.hc, this, a), 0)
};
q.hc = function(a) {
  if(!this.aa) {
    this.a.info("TRIDENT TEXT (" + this.D + "): " + a ? "success" : "failure"), T(this), this.G = a, this.f.fa(this)
  }
};
q.$b = function() {
  kc(this);
  this.f.fa(this)
};
q.cancel = function() {
  this.aa = j;
  T(this)
};
function hc(a) {
  a.mb = v() + a.ya;
  Bc(a, a.ya)
}
function Bc(a, b) {
  a.na != k && f(Error("WatchDog timer not null"));
  a.na = V(u(a.kc, a), b)
}
function kc(a) {
  if(a.na) {
    r.clearTimeout(a.na), a.na = k
  }
}
q.kc = function() {
  this.na = k;
  var a = v();
  a - this.mb >= 0 ? (this.G && this.a.F("Received watchdog timeout even though request loaded successfully"), this.a.info("TIMEOUT: " + this.s), T(this), this.l = 2, U(Cc), rc(this)) : (this.a.ma("WatchDog timer called too early"), Bc(this, this.mb - a))
};
function rc(a) {
  !a.f.Bb() && !a.aa && a.f.fa(a)
}
function T(a) {
  kc(a);
  a.Na.stop();
  var b = a.Ea;
  $a(b.j, Nb);
  b.j.length = 0;
  if(a.q) {
    b = a.q, a.q = k, b.abort()
  }
  if(a.I) {
    a.I = k
  }
  a.u = k
}
q.zb = ba("l");
function oc(a, b) {
  try {
    a.f.Jb(a, b)
  }catch(c) {
    sc(a.a, c, "Error in httprequest callback")
  }
}
;function Dc(a) {
  return eval("(" + a + ")")
}
function Ec() {
  this.Pa = h
}
function Fc(a) {
  var b = [];
  Gc(new Ec, a, b);
  return b.join("")
}
function Gc(a, b, c) {
  switch(typeof b) {
    case "string":
      Hc(b, c);
      break;
    case "number":
      c.push(isFinite(b) && !isNaN(b) ? b : "null");
      break;
    case "boolean":
      c.push(b);
      break;
    case "undefined":
      c.push("null");
      break;
    case "object":
      if(b == k) {
        c.push("null");
        break
      }
      if(s(b)) {
        var d = b.length;
        c.push("[");
        for(var e = "", g = 0;g < d;g++) {
          c.push(e), e = b[g], Gc(a, a.Pa ? a.Pa.call(b, String(g), e) : e, c), e = ","
        }
        c.push("]");
        break
      }
      c.push("{");
      d = "";
      for(g in b) {
        Object.prototype.hasOwnProperty.call(b, g) && (e = b[g], typeof e != "function" && (c.push(d), Hc(g, c), c.push(":"), Gc(a, a.Pa ? a.Pa.call(b, g, e) : e, c), d = ","))
      }
      c.push("}");
      break;
    case "function":
      break;
    default:
      f(Error("Unknown type: " + typeof b))
  }
}
var Ic = {'"':'\\"', "\\":"\\\\", "/":"\\/", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\u000b":"\\u000b"}, Jc = /\uffff/.test("\uffff") ? /[\\\"\x00-\x1f\x7f-\uffff]/g : /[\\\"\x00-\x1f\x7f-\xff]/g;
function Hc(a, b) {
  b.push('"', a.replace(Jc, function(a) {
    if(a in Ic) {
      return Ic[a]
    }
    var b = a.charCodeAt(0), e = "\\u";
    b < 16 ? e += "000" : b < 256 ? e += "00" : b < 4096 && (e += "0");
    return Ic[a] = e + b.toString(16)
  }), '"')
}
;function Kc(a) {
  return Lc(a || arguments.callee.caller, [])
}
function Lc(a, b) {
  var c = [];
  if(Za(b, a) >= 0) {
    c.push("[...circular reference...]")
  }else {
    if(a && b.length < 50) {
      c.push(Mc(a) + "(");
      for(var d = a.arguments, e = 0;e < d.length;e++) {
        e > 0 && c.push(", ");
        var g;
        g = d[e];
        switch(typeof g) {
          case "object":
            g = g ? "object" : "null";
            break;
          case "string":
            break;
          case "number":
            g = String(g);
            break;
          case "boolean":
            g = g ? "true" : "false";
            break;
          case "function":
            g = (g = Mc(g)) ? g : "[fn]";
            break;
          default:
            g = typeof g
        }
        g.length > 40 && (g = g.substr(0, 40) + "...");
        c.push(g)
      }
      b.push(a);
      c.push(")\n");
      try {
        c.push(Lc(a.caller, b))
      }catch(i) {
        c.push("[exception trying to get caller]\n")
      }
    }else {
      a ? c.push("[...long stack...]") : c.push("[end]")
    }
  }
  return c.join("")
}
function Mc(a) {
  if(Nc[a]) {
    return Nc[a]
  }
  a = String(a);
  if(!Nc[a]) {
    var b = /function ([^\(]+)/.exec(a);
    Nc[a] = b ? b[1] : "[Anonymous]"
  }
  return Nc[a]
}
var Nc = {};
function Oc(a, b, c, d, e) {
  this.reset(a, b, c, d, e)
}
Oc.prototype.nc = 0;
Oc.prototype.yb = k;
Oc.prototype.xb = k;
var Pc = 0;
Oc.prototype.reset = function(a, b, c, d, e) {
  this.nc = typeof e == "number" ? e : Pc++;
  this.Ac = d || v();
  this.ta = a;
  this.cc = b;
  this.uc = c;
  delete this.yb;
  delete this.xb
};
Oc.prototype.Rb = p("ta");
function W(a) {
  this.dc = a
}
W.prototype.Ma = k;
W.prototype.ta = k;
W.prototype.Ya = k;
W.prototype.Ab = k;
function Qc(a, b) {
  this.name = a;
  this.value = b
}
Qc.prototype.toString = ba("name");
var Rc = new Qc("SEVERE", 1E3), Sc = new Qc("WARNING", 900), Tc = new Qc("INFO", 800), Uc = new Qc("CONFIG", 700), Vc = new Qc("FINE", 500);
q = W.prototype;
q.getParent = ba("Ma");
q.Rb = p("ta");
function Wc(a) {
  if(a.ta) {
    return a.ta
  }
  if(a.Ma) {
    return Wc(a.Ma)
  }
  Sa("Root logger has no level set.");
  return k
}
q.log = function(a, b, c) {
  if(a.value >= Wc(this).value) {
    a = this.Zb(a, b, c);
    b = "log:" + a.cc;
    r.console && (r.console.timeStamp ? r.console.timeStamp(b) : r.console.markTimeline && r.console.markTimeline(b));
    r.msWriteProfilerMark && r.msWriteProfilerMark(b);
    for(b = this;b;) {
      var c = b, d = a;
      if(c.Ab) {
        for(var e = 0, g = h;g = c.Ab[e];e++) {
          g(d)
        }
      }
      b = b.getParent()
    }
  }
};
q.Zb = function(a, b, c) {
  var d = new Oc(a, String(b), this.dc);
  if(c) {
    d.yb = c;
    var e;
    var g = arguments.callee.caller;
    try {
      var i;
      var m = ea("window.location.href");
      if(t(c)) {
        i = {message:c, name:"Unknown error", lineNumber:"Not available", fileName:m, stack:"Not available"}
      }else {
        var l, n, w = o;
        try {
          l = c.lineNumber || c.tc || "Not available"
        }catch(x) {
          l = "Not available", w = j
        }
        try {
          n = c.fileName || c.filename || c.sourceURL || m
        }catch(va) {
          n = "Not available", w = j
        }
        i = w || !c.lineNumber || !c.fileName || !c.stack ? {message:c.message, name:c.name, lineNumber:l, fileName:n, stack:c.stack || "Not available"} : c
      }
      e = "Message: " + oa(i.message) + '\nUrl: <a href="view-source:' + i.fileName + '" target="_new">' + i.fileName + "</a>\nLine: " + i.lineNumber + "\n\nBrowser stack:\n" + oa(i.stack + "-> ") + "[end]\n\nJS stack traversal:\n" + oa(Kc(g) + "-> ")
    }catch(D) {
      e = "Exception trying to expose exception! You win, we lose. " + D
    }
    d.xb = e
  }
  return d
};
q.F = function(a, b) {
  this.log(Rc, a, b)
};
q.ma = function(a, b) {
  this.log(Sc, a, b)
};
q.info = function(a, b) {
  this.log(Tc, a, b)
};
function X(a, b) {
  a.log(Vc, b, h)
}
var Xc = {}, Yc = k;
function Zc(a) {
  Yc || (Yc = new W(""), Xc[""] = Yc, Yc.Rb(Uc));
  var b;
  if(!(b = Xc[a])) {
    b = new W(a);
    var c = a.lastIndexOf("."), d = a.substr(c + 1), c = Zc(a.substr(0, c));
    if(!c.Ya) {
      c.Ya = {}
    }
    c.Ya[d] = b;
    b.Ma = c;
    Xc[a] = b
  }
  return b
}
;function $c() {
  this.p = Zc("goog.net.BrowserChannel")
}
function nc(a, b, c, d) {
  a.info("XMLHTTP TEXT (" + b + "): " + Ac(a, c) + (d ? " " + d : ""))
}
function ad(a, b) {
  a.info(b)
}
function sc(a, b, c) {
  a.F((c || "Exception") + b)
}
$c.prototype.info = function(a) {
  this.p.info(a)
};
$c.prototype.ma = function(a) {
  this.p.ma(a)
};
$c.prototype.F = function(a) {
  this.p.F(a)
};
function Ac(a, b) {
  if(!b || b == bd) {
    return b
  }
  try {
    for(var c = Dc(b), d = 0;d < c.length;d++) {
      if(s(c[d])) {
        var e = c[d];
        if(!(e.length < 2)) {
          var g = e[1];
          if(s(g) && !(g.length < 1)) {
            var i = g[0];
            if(i != "noop" && i != "stop") {
              for(var m = 1;m < g.length;m++) {
                g[m] = ""
              }
            }
          }
        }
      }
    }
    return Fc(c)
  }catch(l) {
    return a.info("Exception parsing expected JS array - probably was not JS"), b
  }
}
;function cd(a) {
  this.headers = new db;
  this.oa = a || k
}
y(cd, Sb);
cd.prototype.p = Zc("goog.net.XhrIo");
var dd = /^https?$/i;
q = cd.prototype;
q.Q = o;
q.e = k;
q.Ua = k;
q.hb = "";
q.Db = "";
q.sa = 0;
q.l = "";
q.ab = o;
q.Ja = o;
q.fb = o;
q.Y = o;
q.Sa = 0;
q.Z = k;
q.Pb = "";
q.qc = o;
q.send = function(a, b, c, d) {
  this.e && f(Error("[goog.net.XhrIo] Object is active with another request"));
  b = b ? b.toUpperCase() : "GET";
  this.hb = a;
  this.l = "";
  this.sa = 0;
  this.Db = b;
  this.ab = o;
  this.Q = j;
  this.e = this.oa ? xb(this.oa) : xb(vb);
  this.Ua = this.oa ? this.oa.Ca || (this.oa.Ca = zb(this.oa)) : vb.Ca || (vb.Ca = zb(vb));
  this.e.onreadystatechange = u(this.Ib, this);
  try {
    X(this.p, Y(this, "Opening Xhr")), this.fb = j, this.e.open(b, a, j), this.fb = o
  }catch(e) {
    X(this.p, Y(this, "Error opening Xhr: " + e.message));
    ed(this, e);
    return
  }
  var a = c || "", g = this.headers.n();
  d && G(d, function(a, b) {
    g.set(b, a)
  });
  b == "POST" && !g.ca("Content-Type") && g.set("Content-Type", "application/x-www-form-urlencoded;charset=utf-8");
  G(g, function(a, b) {
    this.e.setRequestHeader(b, a)
  }, this);
  if(this.Pb) {
    this.e.responseType = this.Pb
  }
  if("withCredentials" in this.e) {
    this.e.withCredentials = this.qc
  }
  try {
    if(this.Z) {
      Ub.clearTimeout(this.Z), this.Z = k
    }
    if(this.Sa > 0) {
      X(this.p, Y(this, "Will abort after " + this.Sa + "ms if incomplete")), this.Z = Ub.setTimeout(u(this.ya, this), this.Sa)
    }
    X(this.p, Y(this, "Sending request"));
    this.Ja = j;
    this.e.send(a);
    this.Ja = o
  }catch(i) {
    X(this.p, Y(this, "Send error: " + i.message)), ed(this, i)
  }
};
q.ya = function() {
  if(typeof da != "undefined" && this.e) {
    this.l = "Timed out after " + this.Sa + "ms, aborting", this.sa = 8, X(this.p, Y(this, this.l)), this.dispatchEvent("timeout"), this.abort(8)
  }
};
function ed(a, b) {
  a.Q = o;
  if(a.e) {
    a.Y = j, a.e.abort(), a.Y = o
  }
  a.l = b;
  a.sa = 5;
  fd(a);
  gd(a)
}
function fd(a) {
  if(!a.ab) {
    a.ab = j, a.dispatchEvent("complete"), a.dispatchEvent("error")
  }
}
q.abort = function(a) {
  if(this.e && this.Q) {
    X(this.p, Y(this, "Aborting")), this.Q = o, this.Y = j, this.e.abort(), this.Y = o, this.sa = a || 7, this.dispatchEvent("complete"), this.dispatchEvent("abort"), gd(this)
  }
};
q.z = function() {
  if(this.e) {
    if(this.Q) {
      this.Q = o, this.Y = j, this.e.abort(), this.Y = o
    }
    gd(this, j)
  }
  cd.ka.z.call(this)
};
q.Ib = function() {
  !this.fb && !this.Ja && !this.Y ? this.gc() : hd(this)
};
q.gc = function() {
  hd(this)
};
function hd(a) {
  if(a.Q && typeof da != "undefined") {
    if(a.Ua[1] && S(a) == 4 && lc(a) == 2) {
      X(a.p, Y(a, "Local request error detected and ignored"))
    }else {
      if(a.Ja && S(a) == 4) {
        Ub.setTimeout(u(a.Ib, a), 0)
      }else {
        if(a.dispatchEvent("readystatechange"), S(a) == 4) {
          X(a.p, Y(a, "Request complete"));
          a.Q = o;
          try {
            var b = lc(a), c, d;
            a: {
              switch(b) {
                case 200:
                ;
                case 201:
                ;
                case 202:
                ;
                case 204:
                ;
                case 304:
                ;
                case 1223:
                  d = j;
                  break a;
                default:
                  d = o
              }
            }
            if(!(c = d)) {
              var e;
              if(e = b === 0) {
                var g = String(a.hb).match(Ta)[1] || k;
                if(!g && self.location) {
                  var i = self.location.protocol, g = i.substr(0, i.length - 1)
                }
                e = !dd.test(g ? g.toLowerCase() : "")
              }
              c = e
            }
            if(c) {
              a.dispatchEvent("complete"), a.dispatchEvent("success")
            }else {
              a.sa = 6;
              var m;
              try {
                m = S(a) > 2 ? a.e.statusText : ""
              }catch(l) {
                X(a.p, "Can not get status: " + l.message), m = ""
              }
              a.l = m + " [" + lc(a) + "]";
              fd(a)
            }
          }finally {
            gd(a)
          }
        }
      }
    }
  }
}
function gd(a, b) {
  if(a.e) {
    var c = a.e, d = a.Ua[0] ? fa : k;
    a.e = k;
    a.Ua = k;
    if(a.Z) {
      Ub.clearTimeout(a.Z), a.Z = k
    }
    b || a.dispatchEvent("ready");
    try {
      c.onreadystatechange = d
    }catch(e) {
      a.p.F("Problem encountered resetting onreadystatechange: " + e.message)
    }
  }
}
q.isActive = function() {
  return!!this.e
};
function S(a) {
  return a.e ? a.e.readyState : 0
}
function lc(a) {
  try {
    return S(a) > 2 ? a.e.status : -1
  }catch(b) {
    return a.p.ma("Can not get status: " + b.message), -1
  }
}
function jc(a) {
  try {
    return a.e ? a.e.responseText : ""
  }catch(b) {
    return X(a.p, "Can not get responseText: " + b.message), ""
  }
}
q.zb = function() {
  return t(this.l) ? this.l : String(this.l)
};
function Y(a, b) {
  return b + " [" + a.Db + " " + a.hb + " " + lc(a) + "]"
}
;function id() {
  this.Ob = v()
}
new id;
id.prototype.set = p("Ob");
id.prototype.reset = function() {
  this.set(v())
};
id.prototype.get = ba("Ob");
function jd(a, b, c, d, e) {
  ad(new $c, "TestLoadImageWithRetries: " + e);
  if(d == 0) {
    c(o)
  }else {
    var g = e || 0;
    d--;
    kd(a, b, function(e) {
      e ? c(j) : r.setTimeout(function() {
        jd(a, b, c, d, g)
      }, g)
    })
  }
}
function kd(a, b, c) {
  var d = new $c;
  d.info("TestLoadImage: loading " + a);
  var e = new Image, g = k;
  createHandler = function(a, b) {
    return function() {
      try {
        d.info("TestLoadImage: " + b), e.onload = k, e.onerror = k, e.onabort = k, e.ontimeout = k, r.clearTimeout(g), c(a)
      }catch(l) {
        sc(d, l)
      }
    }
  };
  e.onload = createHandler(j, "loaded");
  e.onerror = createHandler(o, "error");
  e.onabort = createHandler(o, "abort");
  e.ontimeout = createHandler(o, "timeout");
  g = r.setTimeout(function() {
    if(e.ontimeout) {
      e.ontimeout()
    }
  }, b);
  e.src = a
}
;function ld(a, b) {
  this.f = a;
  this.a = b
}
q = ld.prototype;
q.t = k;
q.w = k;
q.Oa = o;
q.Sb = k;
q.Ga = k;
q.gb = k;
q.v = k;
q.b = k;
q.h = -1;
q.L = k;
q.Wa = k;
q.U = p("t");
q.Za = function(a) {
  this.v = a;
  a = md(this.f, this.v);
  U(nd);
  qb(a, "MODE", "init");
  this.w = new R(this, this.a, h, h, h, this.f.u);
  this.w.U(this.t);
  gc(this.w, a, o, k, j);
  this.b = 0;
  this.Sb = v()
};
q.Wb = function(a) {
  a ? (this.b = 2, od(this)) : (U(pd), a = this.f, a.a.info("Test Connection Blocked"), a.h = a.W.h, Z(a, 9))
};
function od(a) {
  a.a.info("TestConnection: starting stage 2");
  a.w = new R(a, a.a, h, h, h, a.f.u);
  a.w.U(a.t);
  var b = qd(a.f, a.L, a.v);
  U(rd);
  if(dc()) {
    qb(b, "TYPE", "xmlhttp"), gc(a.w, b, o, a.L, o)
  }else {
    qb(b, "TYPE", "html");
    var c = a.w, a = Boolean(a.L);
    c.Aa = 3;
    c.R = L(b.n());
    yc(c, a)
  }
}
q.$a = function(a) {
  return this.f.$a(a)
};
q.abort = function() {
  if(this.w) {
    this.w.cancel(), this.w = k
  }
  this.h = -1
};
q.Bb = ca(o);
q.Jb = function(a, b) {
  this.h = a.h;
  if(this.b == 0) {
    if(this.a.info("TestConnection: Got data for stage 1"), b) {
      try {
        var c = Dc(b)
      }catch(d) {
        sc(this.a, d);
        sd(this.f, this);
        return
      }
      this.L = this.f.correctHostPrefix(c[0]);
      this.Wa = c[1]
    }else {
      this.a.info("TestConnection: Null responseText"), sd(this.f, this)
    }
  }else {
    if(this.b == 2) {
      if(this.Oa) {
        U(td), this.gb = v()
      }else {
        if(b == "11111") {
          if(U(ud), this.Oa = j, this.Ga = v(), c = this.Ga - this.Sb, dc() || c < 500) {
            this.h = 200, this.w.cancel(), this.a.info("Test connection succeeded; using streaming connection"), U(vd), wd(this.f, this, j)
          }
        }else {
          U(xd), this.Ga = this.gb = v(), this.Oa = o
        }
      }
    }
  }
};
q.fa = function() {
  this.h = this.w.h;
  if(this.w.G) {
    if(this.b == 0) {
      if(this.a.info("TestConnection: request complete for initial check"), this.Wa) {
        this.b = 1;
        var a = yd(this.f, this.Wa, "/mail/images/cleardot.gif");
        L(a);
        jd(a.toString(), 5E3, u(this.Wb, this), 3, 2E3)
      }else {
        this.b = 2, od(this)
      }
    }else {
      this.b == 2 && (this.a.info("TestConnection: request complete for stage 2"), a = o, (a = dc() ? this.Oa : this.gb - this.Ga < 200 ? o : j) ? (this.a.info("Test connection succeeded; using streaming connection"), U(vd), wd(this.f, this, j)) : (this.a.info("Test connection failed; not using streaming"), U(zd), wd(this.f, this, o)))
    }
  }else {
    this.a.info("TestConnection: request failed, in state " + this.b), this.b == 0 ? U(Ad) : this.b == 2 && U(Bd), sd(this.f, this)
  }
};
q.Ra = function() {
  return this.f.Ra()
};
q.isActive = function() {
  return this.f.isActive()
};
function Cd(a) {
  this.rb = a || k;
  this.b = Dd;
  this.r = [];
  this.N = [];
  this.a = new $c
}
function Ed(a, b) {
  this.Fb = a;
  this.map = b;
  this.sc = k
}
q = Cd.prototype;
q.t = k;
q.pa = k;
q.o = k;
q.k = k;
q.v = k;
q.Ha = k;
q.ob = k;
q.L = k;
q.u = k;
q.Vb = j;
q.va = 0;
q.ec = 0;
q.Fa = o;
q.c = k;
q.H = k;
q.J = k;
q.X = k;
q.W = k;
q.lb = k;
q.Ub = j;
q.ra = -1;
q.Eb = -1;
q.h = -1;
q.S = 0;
q.$ = 0;
q.vb = Dc;
q.ba = 8;
var Dd = 1, Fd = new Sb;
function Gd(a, b) {
  P.call(this, "statevent", a);
  this.zc = b
}
y(Gd, P);
function Hd(a, b, c, d) {
  P.call(this, "timingevent", a);
  this.size = b;
  this.yc = c;
  this.xc = d
}
y(Hd, P);
var nd = 3, pd = 4, rd = 5, ud = 6, td = 7, xd = 8, Ad = 9, Bd = 10, zd = 11, vd = 12, pc = 13, qc = 14, uc = 15, vc = 16, wc = 17, Cc = 18, xc = 21, zc = 22, bd = "y2f%";
q = Cd.prototype;
q.Za = function(a, b, c, d, e) {
  this.a.info("connect()");
  U(0);
  this.v = b;
  this.pa = c || {};
  if(d && e !== h) {
    this.pa.OSID = d, this.pa.OAID = e
  }
  this.a.info("connectTest_()");
  if(Id(this)) {
    this.W = new ld(this, this.a), this.W.U(this.t), this.W.Za(a)
  }
};
function Jd(a) {
  if(a.W) {
    a.W.abort(), a.W = k
  }
  if(a.k) {
    a.k.cancel(), a.k = k
  }
  if(a.J) {
    r.clearTimeout(a.J), a.J = k
  }
  Kd(a);
  if(a.o) {
    a.o.cancel(), a.o = k
  }
  if(a.H) {
    r.clearTimeout(a.H), a.H = k
  }
}
q.U = p("t");
q.Bb = function() {
  return this.b == 0
};
function Ld(a) {
  if(!a.o && !a.H) {
    a.H = V(u(a.Lb, a), 0), a.S = 0
  }
}
q.Lb = function(a) {
  this.H = k;
  this.a.info("startForwardChannel_");
  if(Id(this)) {
    if(this.b == Dd) {
      if(a) {
        this.a.F("Not supposed to retry the open")
      }else {
        this.a.info("open_()");
        this.va = Math.floor(Math.random() * 1E5);
        var a = this.va++, b = new R(this, this.a, "", a, h, this.u);
        b.U(this.t);
        var c = Md(this), d = this.Ha.n();
        K(d, "RID", a);
        this.rb && K(d, "CVER", this.rb);
        Nd(this, d);
        ec(b, d, c);
        this.o = b;
        this.b = 2
      }
    }else {
      this.b == 3 && (a ? Od(this, a) : this.r.length == 0 ? this.a.info("startForwardChannel_ returned: nothing to send") : this.o ? this.a.F("startForwardChannel_ returned: connection already in progress") : (Od(this), this.a.info("startForwardChannel_ finished, sent request")))
    }
  }
};
function Od(a, b) {
  var c, d;
  b ? a.ba > 6 ? (a.r = a.N.concat(a.r), a.N.length = 0, c = a.va - 1, d = Md(a)) : (c = b.D, d = b.T) : (c = a.va++, d = Md(a));
  var e = a.Ha.n();
  K(e, "SID", a.V);
  K(e, "RID", c);
  K(e, "AID", a.ra);
  Nd(a, e);
  c = new R(a, a.a, a.V, c, a.S + 1, a.u);
  c.U(a.t);
  c.setTimeout(Math.round(1E4) + Math.round(1E4 * Math.random()));
  a.o = c;
  ec(c, e, d)
}
function Nd(a, b) {
  if(a.c) {
    var c = a.c.getAdditionalParams(a);
    c && G(c, function(a, c) {
      K(b, c, a)
    })
  }
}
function Md(a) {
  var b = Math.min(a.r.length, 1E3), c = ["count=" + b], d;
  a.ba > 6 && b > 0 ? (d = a.r[0].Fb, c.push("ofs=" + d)) : d = 0;
  for(var e = 0;e < b;e++) {
    var g = a.r[e].Fb, i = a.r[e].map;
    a.ba <= 6 ? g = e : g -= d;
    try {
      G(i, function(a, b) {
        c.push("req" + g + "_" + b + "=" + encodeURIComponent(a))
      })
    }catch(m) {
      c.push("req" + g + "_type=" + encodeURIComponent("_badmap")), a.c && a.c.badMapError(a, i)
    }
  }
  a.N = a.N.concat(a.r.splice(0, b));
  return c.join("&")
}
function Pd(a) {
  if(!a.k && !a.J) {
    a.nb = 1, a.J = V(u(a.Kb, a), 0), a.$ = 0
  }
}
function Qd(a) {
  if(a.k || a.J) {
    return a.a.F("Request already in progress"), o
  }
  if(a.$ >= 3 || !(a.u ? a.u.ac() : 1)) {
    return o
  }
  a.a.info("Going to retry GET");
  a.nb++;
  a.J = V(u(a.Kb, a), Rd(a, a.$));
  a.$++;
  return j
}
q.Kb = function() {
  this.J = k;
  if(Id(this)) {
    this.a.info("Creating new HttpRequest");
    this.k = new R(this, this.a, this.V, "rpc", this.nb, this.u);
    this.k.U(this.t);
    var a = this.ob.n();
    K(a, "RID", "rpc");
    K(a, "SID", this.V);
    K(a, "CI", this.lb ? "0" : "1");
    K(a, "AID", this.ra);
    Nd(this, a);
    if(dc()) {
      K(a, "TYPE", "xmlhttp"), gc(this.k, a, j, this.L, o)
    }else {
      K(a, "TYPE", "html");
      var b = this.k, c = Boolean(this.L);
      b.Aa = 3;
      b.R = L(a.n());
      yc(b, c)
    }
    this.a.info("New Request created")
  }
};
function Id(a) {
  if(a.c) {
    var b = a.c.okToMakeRequest(a);
    if(b != 0) {
      return a.a.info("Handler returned error code from okToMakeRequest"), Z(a, b), o
    }
  }
  return j
}
function wd(a, b, c) {
  a.a.info("Test Connection Finished");
  a.lb = a.Ub && c;
  a.h = b.h;
  a.a.info("connectChannel_()");
  a.Yb(Dd, 0);
  a.Ha = md(a, a.v);
  Ld(a)
}
function sd(a, b) {
  a.a.info("Test Connection Failed");
  a.h = b.h;
  Z(a, 2)
}
q.Jb = function(a, b) {
  if(!(this.b == 0 || this.k != a && this.o != a)) {
    if(this.h = a.h, this.o == a && this.b == 3) {
      if(this.ba > 7) {
        var c;
        try {
          c = this.vb(b)
        }catch(d) {
          c = k
        }
        if(s(c) && c.length == 3) {
          var e = c;
          if(e[0] == 0) {
            a: {
              if(this.a.info("Server claims our backchannel is missing."), this.J) {
                this.a.info("But we are currently starting the request.")
              }else {
                if(this.k) {
                  if(this.k.ia + 3E3 < this.o.ia) {
                    Kd(this), this.k.cancel(), this.k = k
                  }else {
                    break a
                  }
                }else {
                  this.a.ma("We do not have a BackChannel established")
                }
                Qd(this);
                U(19)
              }
            }
          }else {
            if(this.Eb = e[1], c = this.Eb - this.ra, 0 < c && (e = e[2], this.a.info(e + " bytes (in " + c + " arrays) are outstanding on the BackChannel"), e < 37500 && this.lb && this.$ == 0 && !this.X)) {
              this.X = V(u(this.fc, this), 6E3)
            }
          }
        }else {
          this.a.info("Bad POST response data returned"), Z(this, 11)
        }
      }else {
        b != bd && (this.a.info("Bad data returned - missing/invald magic cookie"), Z(this, 11))
      }
    }else {
      if(this.k == a && Kd(this), !/^[\s\xa0]*$/.test(b)) {
        c = this.vb(b);
        for(var e = this.c && this.c.channelHandleMultipleArrays ? [] : k, g = 0;g < c.length;g++) {
          var i = c[g];
          this.ra = i[0];
          i = i[1];
          if(this.b == 2) {
            i[0] == "c" ? (this.V = i[1], this.L = this.correctHostPrefix(i[2]), i = i[3], this.ba = i != k ? i : 6, this.b = 3, this.c && this.c.channelOpened(this), this.ob = qd(this, this.L, this.v), Pd(this)) : i[0] == "stop" && Z(this, 7)
          }else {
            if(this.b == 3) {
              if(i[0] == "stop") {
                if(e && e.length) {
                  this.c.channelHandleMultipleArrays(this, e), e.length = 0
                }
                Z(this, 7)
              }else {
                i[0] != "noop" && (e ? e.push(i) : this.c && this.c.channelHandleArray(this, i))
              }
              this.$ = 0
            }
          }
        }
        e && e.length && this.c.channelHandleMultipleArrays(this, e)
      }
    }
  }
};
q.correctHostPrefix = function(a) {
  return this.Vb ? this.c ? this.c.correctHostPrefix(a) : a : k
};
q.fc = function() {
  if(this.X != k) {
    this.X = k, this.k.cancel(), this.k = k, Qd(this), U(20)
  }
};
function Kd(a) {
  if(a.X != k) {
    r.clearTimeout(a.X), a.X = k
  }
}
q.fa = function(a) {
  this.a.info("Request complete");
  var b;
  if(this.k == a) {
    Kd(this), this.k = k, b = 2
  }else {
    if(this.o == a) {
      this.o = k, b = 1
    }else {
      return
    }
  }
  this.h = a.h;
  if(this.b != 0) {
    if(a.G) {
      b == 1 ? (b = v() - a.ia, Fd.dispatchEvent(new Hd(Fd, a.T ? a.T.length : 0, b, this.S)), Ld(this), this.N.length = 0) : Pd(this)
    }else {
      var c = a.zb();
      if(c == 3 || c == 7 || c == 0 && this.h > 0) {
        this.a.info("Not retrying due to error type")
      }else {
        this.a.info("Maybe retrying, last error: " + ac(c, this.h));
        var d;
        if(d = b == 1) {
          this.o || this.H ? (this.a.F("Request already in progress"), d = o) : this.b == Dd || this.S >= (this.Fa ? 0 : 2) ? d = o : (this.a.info("Going to retry POST"), this.H = V(u(this.Lb, this, a), Rd(this, this.S)), this.S++, d = j)
        }
        if(d) {
          return
        }
        if(b == 2 && Qd(this)) {
          return
        }
        this.a.info("Exceeded max number of retries")
      }
      this.a.info("Error: HTTP request failed");
      switch(c) {
        case 1:
          Z(this, 5);
          break;
        case 4:
          Z(this, 10);
          break;
        case 3:
          Z(this, 6);
          break;
        case 7:
          Z(this, 12);
          break;
        default:
          Z(this, 2)
      }
    }
  }
};
function Rd(a, b) {
  var c = 5E3 + Math.floor(Math.random() * 1E4);
  a.isActive() || (a.a.info("Inactive channel"), c *= 2);
  c *= b;
  return c
}
q.Yb = function(a) {
  Za(arguments, this.b) >= 0 || f(Error("Unexpected channel state: " + this.b))
};
function Z(a, b) {
  a.a.info("Error code " + b);
  if(b == 2 || b == 9) {
    var c = k;
    a.c && (c = a.c.getNetworkTestImageUri(a));
    var d = u(a.oc, a);
    c || (c = new I("//www.google.com/images/cleardot.gif"), L(c));
    kd(c.toString(), 1E4, d)
  }else {
    U(2)
  }
  Sd(a, b)
}
q.oc = function(a) {
  a ? (this.a.info("Successfully pinged google.com"), U(2)) : (this.a.info("Failed to ping google.com"), U(1), Sd(this, 8))
};
function Sd(a, b) {
  a.a.info("HttpChannel: error - " + b);
  a.b = 0;
  a.c && a.c.channelError(a, b);
  Td(a);
  Jd(a)
}
function Td(a) {
  a.b = 0;
  a.h = -1;
  if(a.c) {
    if(a.N.length == 0 && a.r.length == 0) {
      a.c.channelClosed(a)
    }else {
      a.a.info("Number of undelivered maps, pending: " + a.N.length + ", outgoing: " + a.r.length);
      var b = bb(a.N), c = bb(a.r);
      a.N.length = 0;
      a.r.length = 0;
      a.c.channelClosed(a, b, c)
    }
  }
}
function md(a, b) {
  var c = yd(a, k, b);
  a.a.info("GetForwardChannelUri: " + c);
  return c
}
function qd(a, b, c) {
  b = yd(a, a.Ra() ? b : k, c);
  a.a.info("GetBackChannelUri: " + b);
  return b
}
function yd(a, b, c) {
  var d = c instanceof I ? c.n() : new I(c, h);
  if(d.da != "") {
    b && gb(d, b + "." + d.da), hb(d, d.wa)
  }else {
    var e = window.location, d = sb(e.protocol, b ? b + "." + e.hostname : e.hostname, e.port, c)
  }
  a.pa && G(a.pa, function(a, b) {
    K(d, b, a)
  });
  K(d, "VER", a.ba);
  Nd(a, d);
  return d
}
q.$a = function(a) {
  if(a) {
    f(Error("Can't create secondary domain capable XhrIo object."))
  }else {
    return new cd
  }
};
q.isActive = function() {
  return!!this.c && this.c.isActive(this)
};
function V(a, b) {
  ga(a) != "function" && f(Error("Fn must not be null and must be a function"));
  return r.setTimeout(function() {
    a()
  }, b)
}
function U(a) {
  Fd.dispatchEvent(new Gd(Fd, a))
}
q.Ra = function() {
  return!dc()
};
function Ud() {
}
q = Ud.prototype;
q.channelHandleMultipleArrays = k;
q.okToMakeRequest = ca(0);
q.channelOpened = aa();
q.channelHandleArray = aa();
q.channelError = aa();
q.channelClosed = aa();
q.getAdditionalParams = function() {
  return{}
};
q.getNetworkTestImageUri = ca(k);
q.isActive = ca(j);
q.badMapError = aa();
q.correctHostPrefix = function(a) {
  return a
};
var $, Vd;
Vd = {0:"Ok", 4:"User is logging out", 6:"Unknown session ID", 7:"Stopped by server", 8:"General network error", 2:"Request failed", 9:"Blocked by a network administrator", 5:"No data from server", 10:"Got bad data from the server", 11:"Got a bad response from the server"};
$ = function(a, b) {
  var c, d, e, g, i, m, l, n, w;
  l = this;
  a || (a = "channel");
  a.match(/:\/\//) && a.replace(/^ws/, "http");
  b || (b = {});
  if(s(b || typeof b === "string")) {
    b = {}
  }
  i = b.reconnectTime || 3E3;
  w = function(a) {
    l.readyState = l.readyState = a
  };
  w(this.CLOSED);
  n = k;
  e = b.wc;
  c = new Ud;
  c.channelOpened = function() {
    e = n;
    w($.OPEN);
    return typeof l.onopen === "function" ? l.onopen() : h
  };
  d = k;
  c.channelError = function(a, b) {
    var c;
    c = Vd[b];
    d = b;
    w($.Va);
    return typeof l.onerror === "function" ? l.onerror(c, b) : h
  };
  m = k;
  c.channelClosed = function(a, c, e) {
    if(l.readyState !== $.CLOSED) {
      n = k;
      a = d ? Vd[d] : "Closed";
      w($.CLOSED);
      try {
        if(typeof l.onclose === "function") {
          l.onclose(a, c, e)
        }
      }catch(Wd) {
        typeof console !== "undefined" && console !== k && console.error(Wd.stack)
      }
      b.reconnect && d !== 7 && d !== 0 && (c = d === 6 ? 0 : i, clearTimeout(m), m = setTimeout(g, c));
      return d = k
    }
  };
  c.channelHandleArray = function(a, b) {
    return typeof l.onmessage === "function" ? l.onmessage(b) : h
  };
  g = function() {
    n && f(Error("Reconnect() called from invalid state"));
    w($.CONNECTING);
    if(typeof l.onconnecting === "function") {
      l.onconnecting()
    }
    clearTimeout(m);
    n = new Cd(b.appVersion);
    n.c = c;
    d = k;
    if(b.failFast) {
      var g = n;
      g.Fa = j;
      g.a.info("setFailFast: true");
      if((g.o || g.H) && g.S > (g.Fa ? 0 : 2)) {
        g.a.info("Retry count " + g.S + " > new maxRetries " + (g.Fa ? 0 : 2) + ". Fail immediately!"), g.o ? (g.o.cancel(), g.fa(g.o)) : (r.clearTimeout(g.H), g.H = k, Z(g, 2))
      }
    }
    return n.Za("" + a + "/test", "" + a + "/bind", k, e != k ? e.V : h, e != k ? e.ra : h)
  };
  this.open = function() {
    l.readyState !== l.CLOSED && f(Error("Already open"));
    return g()
  };
  this.close = function() {
    clearTimeout(m);
    d = 0;
    if(l.readyState !== $.CLOSED) {
      w($.Va);
      var a = n;
      a.a.info("disconnect()");
      Jd(a);
      if(a.b == 3) {
        var b = a.va++, c = a.Ha.n();
        K(c, "SID", a.V);
        K(c, "RID", b);
        K(c, "TYPE", "terminate");
        Nd(a, c);
        b = new R(a, a.a, a.V, b, h, a.u);
        b.Aa = 2;
        b.R = L(c.n());
        c = new Image;
        c.src = b.R;
        c.onload = c.onerror = u(b.$b, b);
        b.ia = v();
        hc(b)
      }
      Td(a)
    }
  };
  this.sendMap = function(a) {
    var b;
    ((b = l.readyState) === $.Va || b === $.CLOSED) && f(Error("Cannot send to a closed connection"));
    b = n;
    b.b == 0 && f(Error("Invalid operation: sending map when state is closed"));
    b.r.length == 1E3 && b.a.F("Already have 1000 queued maps upon queueing " + Fc(a));
    b.r.push(new Ed(b.ec++, a));
    (b.b == 2 || b.b == 3) && Ld(b)
  };
  this.send = function(a) {
    return this.sendMap({JSON:Fc(a)})
  };
  g();
  return this
};
$.prototype.CONNECTING = $.CONNECTING = $.CONNECTING = 0;
$.prototype.OPEN = $.OPEN = $.OPEN = 1;
$.prototype.CLOSING = $.CLOSING = $.Va = 2;
$.prototype.CLOSED = $.CLOSED = $.CLOSED = 3;
(typeof exports !== "undefined" && exports !== k ? exports : window).BCSocket = $;

})();
