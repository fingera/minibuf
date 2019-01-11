/**
 * Copyright liuyujun@fingera.cn
 * null byte uint int double string
 */

const MIN_BYTE = 0;
const MAX_BYTE = 255;
const MIN_UINT = 0;
const MAX_UINT = 9007199254740991;
const MIN_INT = -4503599627370495;
const MAX_INT = 4503599627370495;
const MIN_DOUBLE = 2.2250738585072014e-308;
const MAX_DOUBLE = 1.7976931348623157e+308;

const DEFAULT_BYTE = 0;
const DEFAULT_UINT = 0;
const DEFAULT_INT = 0;
const DEFAULT_DOUBLE = 0;
const DEFAULT_STRING = "";

function parse_name(value) {
  let is_name_mode = true;
  let last_idx = 0;
  let name;
  let is_open = false;
  const arr = [];
  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i);
    if (c >= 0x80) {
      throw new Error(`bad name ${value} ${i}:${c}`);
    }
    if (c === 0x5B) { // [
      if (is_name_mode) {
        is_name_mode = false;
        name = value.slice(last_idx, i);
        last_idx = i;
        is_open = true;
      } else {
        throw new Error(`bad name ${value} ${i}:${c}`);
      }
    } else if (is_name_mode) {
      if (!(c >= 0x30 && c <= 0x39) &&
          !(c >= 0x41 && c <= 0x5A) &&
          !(c >= 0x61 && c <= 0x7A) && c !== 0x2E) {
        throw new Error(`bad name ${value} ${i}:${c}`);
      }
    } else {
      if (c === 0x5D) { // ]
        if ((last_idx + 1) >= i) {
          arr.push(0);
        } else {
          arr.push(Number.parseInt(value.slice(last_idx + 1, i)));
        }
        if ((i + 1) < value.length) {
          const c = value.charCodeAt(++i);
          if (c !== 0x5B) {
            throw new Error(`bad name ${value} ${i}:${c}`);
          }
          last_idx = i;
        } else {
          is_open = false;
        }
      } else if (!(c >= 0x30 && c <= 0x39)) {
        throw new Error(`bad name ${value} ${i}:${c}`);
      }
    }
  }
  if (is_open) {
    throw new Error(`bad name ${value} unexpected ]`);
  } else if (name === undefined) {
    name = value;
  }
  return {
    name,
    arr,
  };
}
function check_name(name) {
  const info = parse_name(name);
  if (info.arr.length !== 0) {
    throw new Error(`bad name ${name}`);
  }
}
function check_buf(length, cursor, count) {
  if (cursor + count > length) {
    throw new Error(`end of buffer: ${cursor}+${count}/${length}`);
  }
}
function throw_if(condition, message) {
  if (condition) {
    throw new Error(message);
  }
}
function write_uint32(arr, value) {
  arr.push((value >>> 0) & 0xFF);
  arr.push((value >>> 8) & 0xFF);
  arr.push((value >>> 16) & 0xFF);
  arr.push((value >>> 24) & 0xFF);
}
function read_uint32(bytes, cursor) {
  var a = bytes[cursor + 0];
  var b = bytes[cursor + 1];
  var c = bytes[cursor + 2];
  var d = bytes[cursor + 3];
  return ((a << 0) | (b << 8) | (c << 16) | (d << 24)) >>> 0;
}
///////////////////////////////////// byte ////////////////////////////////////
function enc_byte(arr, value) {
  if (value === undefined) {
    value = DEFAULT_BYTE;
  }
  if (value != Math.floor(value) || value < MIN_BYTE || value > MAX_BYTE ||
      !Number.isInteger(value)) {
    throw new Error("invalid byte: " + value);
  }
  arr.push(value);
}
function dec_byte(buf) {
  const { cursor, bytes } = buf;
  const { length } = bytes;
  check_buf(length, cursor, 1);
  buf.cursor++;
  return bytes[cursor];
}
///////////////////////////////////// uint ////////////////////////////////////
function enc_uint(arr, value) {
  if (value === undefined) {
    value = DEFAULT_UINT;
  }
  if (value != Math.floor(value) || value < MIN_UINT || value > MAX_UINT ||
      !Number.isInteger(value)) {
    throw new Error("invalid uint: " + value);
  }
  let low = value >>> 0;
  let high = Math.floor((value - low) / 0x100000000) >>> 0;
  while (high > 0 || low > 127) {
    arr.push((low & 0x7f) | 0x80);
    low = ((low >>> 7) | (high << 25)) >>> 0;
    high = high >>> 7;
  }
  arr.push(low);
}
function dec_uint(buf) {
  const { cursor, bytes } = buf;
  const { length } = bytes;
  let r = 0;
  let i = 0;
  for (; i < 8; i++) {
    const byte = bytes[cursor + i];
    r += Math.floor((byte & 0x7F) * Math.pow(2, i * 7));
    if (byte < 0x80) {
      i++;
      break;
    }
  }
  check_buf(length, cursor, i);
  buf.cursor += i;
  return r;
}
///////////////////////////////////// int /////////////////////////////////////
function enc_int(arr, value) {
  if (value === undefined) {
    value = DEFAULT_INT;
  }
  if (value != Math.floor(value) || value < MIN_INT || value > MAX_INT ||
      !Number.isInteger(value)) {
    throw new Error("invalid int: " + value);
  }
  let first;
  if (value < 0) {
    value = -value;
    first = ((value & 0x3F) << 1) | 1;
  } else {
    first = ((value & 0x3F) << 1);
  }
  value = Math.floor(value / 64);
  if (value <= 0) {
    arr.push(first);
    return;
  }
  arr.push(first | 0x80);
  enc_uint(arr, value);
}
function dec_int(buf) {
  let value = dec_uint(buf);
  if ((value & 1) === 1) {
    value = -Math.floor(value / 2);
  } else {
    value = Math.floor(value / 2);
  }
  return value;
}
//////////////////////////////////// double ///////////////////////////////////
function enc_double(arr, value) {
  if (value === undefined) {
    value = DEFAULT_DOUBLE;
  } else if ((typeof value).toLowerCase() !== "number") {
    throw new Error("invalid double: " + value);
  }
  let sign;
  if (value < 0) {
    sign = 1;
    value = -value;
  } else {
    sign = 0;
  }
  if (value === 0) {
    arr.push(0, 0, 0, 0, 0, 0, 0, 0); // +0
  } else if (isNaN(value)) { // NaN
    arr.push(0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x7F);
  } else if (value > MAX_DOUBLE) { // Infinity
    arr.push(0, 0, 0, 0, 0, 0, 0xF0, 0x7F | sign << 7);
  } else if (value < MIN_DOUBLE) {
    const mant = value / Math.pow(2, -1074);
    const mant_high = (mant / 0x100000000);
    write_uint32(arr, mant >>> 0);
    write_uint32(arr, ((sign << 31) | mant_high) >>> 0);
  } else {
    let exp = Math.floor(Math.log(value) / Math.LN2);
    if (exp == 1024) exp = 1023;
    const mant = value * Math.pow(2, -exp);
    const mant_high = (mant * 0x100000) & 0xFFFFF;
    write_uint32(arr, (mant * 0x10000000000000) >>> 0);
    write_uint32(arr, ((sign << 31) | ((exp + 1023) << 20) | mant_high) >>> 0);
  }
}
function dec_double(buf) {
  const { cursor, bytes } = buf;
  const { length } = bytes;

  check_buf(length, cursor, 8);
  const bits_low = read_uint32(bytes, cursor);
  const bits_high = read_uint32(bytes, cursor + 4);
  buf.cursor += 8;

  const sign = ((bits_high >> 31) * 2 + 1);
  const exp = (bits_high >>> 20) & 0x7FF;
  const mant = 0x100000000 * (bits_high & 0xFFFFF) + bits_low;

  if (exp == 0x7FF) {
    if (mant) {
      return NaN;
    } else {
      return sign * Infinity;
    }
  }

  if (exp == 0) {
    return sign * Math.pow(2, -1074) * mant;
  } else {
    return sign * Math.pow(2, exp - 1075) * (mant + 0x10000000000000);
  }
}
//////////////////////////////////// string ///////////////////////////////////
function enc_string(arr, value) {
  if (value === undefined) {
    value = DEFAULT_STRING;
  }
  enc_uint(arr, value.length);
  
  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i);

    if (c < 0x80) {  // 7 [U+0000, U+007F]
      arr.push(c);   // 0xxxxxxx 7
    } else if (c < 0x800) {        // 11 [U+0080, U+07FF]
      arr.push((c >> 6) | 0xC0);   // 110xxxxx 5
      arr.push((c & 0x3F) | 0x80); // 10xxxxxx 6
    } else if (c < 0x10000) {
      if (c >= 0xD800 && c <= 0xDBFF) {
        i++;
        if (i >= value.length) {
          throw new Error("illegal utf8: L overflow");
        }
        const second = value.charCodeAt(i);
        if (second >= 0xDC00 && second <= 0xDFFF) {
          // 10000->110000 c[40, 440) second[0, 400]
          const cc = ((c - 0xD7C0) << 10) + (second - 0xDC00);
                                                 // 21 [U+10000, U+10FFFF]
          arr.push((cc >> 18) | 0xF0);           // 11110xxx 3
          arr.push(((cc >> 12) & 0x3F ) | 0x80); // 10xxxxxx 6
          arr.push(((cc >> 6) & 0x3F) | 0x80);   // 10xxxxxx 6
          arr.push((cc & 0x3F) | 0x80);          // 10xxxxxx 6
        } else {
          throw new Error("illegal utf8: invalid L");
        }
      } else {                              // 16 [U+0800, U+FFFF]
        arr.push((c >> 12) | 0xE0);         // 1110xxxx 4
        arr.push(((c >> 6) & 0x3F) | 0x80); // 10xxxxxx 6
        arr.push((c & 0x3F) | 0x80);        // 10xxxxxx 6
      }
    }
  }
}
function dec_string(buf) {
  const limit = dec_uint(buf);
  const code_units = [];
  let result = "";
  const { bytes } = buf;
  let { cursor } = buf;
  const { length } = bytes;

  while (result.length + code_units.length < limit) {
    const c1 = bytes[cursor++];
    check_buf(length, cursor, 0);
    if (c1 < 0x80) { // 0xxxxxxx
      code_units.push(c1);
    } else if (c1 < 0xC0) { // 10xxxxxx
      throw new Error("illegal utf8: invalid continuation mark");
    } else if (c1 < 0xE0) { // 110xxxxx
      const c2 = bytes[cursor++];
      check_buf(length, cursor, 0);
      code_units.push((c2 & 0x3F) | ((c1 & 0x1F) << 6));
    } else if (c1 < 0xF0) { // 1110xxxx
      const c2 = bytes[cursor++];
      const c3 = bytes[cursor++];
      check_buf(length, cursor, 0);
      code_units.push(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6) | (c3 & 0x3F));
    } else if (c1 < 0xF8) { // 11110xxx
      const c2 = bytes[cursor++];
      const c3 = bytes[cursor++];
      const c4 = bytes[cursor++];
      check_buf(length, cursor, 0);
      const codepoint = (((c1 & 7) << 18) |
                        ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6) |
                        (c4 & 0x3F)) - 0x10000;

      const low = (codepoint & 0x3FF) + 0xDC00;
      const high = ((codepoint >> 10) & 0x3FF) + 0xD800;
      code_units.push(high, low);
    } else {
      throw new Error("illegal utf8: invalid mark");
    }

    if (code_units.length >= 8192) {
      result += String.fromCharCode.apply(null, code_units);
      code_units.length = 0;
    }
  }
  check_buf(length, cursor, 0);
  result += String.fromCharCode.apply(null, code_units);
  buf.cursor = cursor;
  return result;
}
//////////////////////////////////// object ////////////////////////////////////
function array_merge(arr, subarr) {
  for (let i = 0; i < subarr.length; i++) {
    if (arr.indexOf(subarr[i]) < 0) {
      arr.push(subarr[i]);
    }
  }
}

function scan_dep(key, descriptors, cache, parent) {
  check_name(key);

  const value = descriptors[key];
  if (value === undefined) {
    console.error("BUG???");
    return []; // no dep
  }
  if (cache[key] !== undefined) {
    return cache[key]; // already cached
  }
  if (parent === undefined) {
    parent = [];
  }

  let deps = [];
  const scan_string = (str) => {
    const info = parse_name(str);
    if (descriptors[info.name] !== undefined && deps.indexOf(info.name) < 0) {
      parent.push(key);
      throw_if(parent.indexOf(info.name) >= 0, "cyclic dependence");
      array_merge(deps, scan_dep(info.name, descriptors, cache, parent));
      parent.pop();
      deps.push(info.name);
    }
  };
  const scan_object = (obj) => {
    const keys = Object.keys(obj);
    keys.sort();
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const v = obj[k];
      const type = (typeof v).toLowerCase();
      if (type === "string") {
        scan_string(v);
      } else {
        scan_object(v);
      }
    }
  };

  const type = (typeof value).toLowerCase();
  if (type === "string") {
    scan_string(value);
  } else {
    scan_object(value);
  }
  cache[key] = deps;
  return deps;
}
class enc_object {
  constructor() {
    this._encoders = [];
    this._decoders = [];
    this._name2id = {};
    this._id2name = [];

    this.add_type("null", () => {}, () => {});
    this.add_type("byte", enc_byte, dec_byte);
    this.add_type("uint", enc_uint, dec_uint);
    this.add_type("int", enc_int, dec_int);
    this.add_type("double", enc_double, dec_double);
    this.add_type("string", enc_string, dec_string);
  }
  _gen_array_coder(arr, cur, id) {
    if (cur < 0) {
      return [this._encoders[id], this._decoders[id]];
    } else {
      const [encoder, decoder] = this._gen_array_coder(arr, cur - 1, id);
      const fixlen = arr[cur];
      if (fixlen === 0) {
        return [
          (arr, value) => {
            if (value === undefined) {
              value = [];
            }
            if (!Array.isArray(value)) {
              throw new Error("is not array");
            }
            const { length } = value;
            enc_uint(arr, length);
            for (let i = 0; i < length; i++) {
              try {
                encoder(arr, value[i]);
              } catch (e) {
                throw new Error(`array ${i}: ${e.message}`);
              }
            }
          }, (buf) => {
            const ret = [];
            const length = dec_uint(buf);
            for (let i = 0; i < length; i++) {
              try {
                ret.push(decoder(buf));
              } catch (e) {
                throw new Error(`array ${i}: ${e.message}`);
              }
            }
            return ret;
          },
        ];
      } else {
        return [
          (arr, value) => {
            if (value === undefined) {
              value = [];
            }
            if (!Array.isArray(value)) {
              throw new Error("is not array");
            }
            if (value.length !== fixlen) {
              throw new Error(`length diff ${fixlen} != ${value.length}`);
            }
            for (let i = 0; i < fixlen; i++) {
              try {
                encoder(arr, value[i]);
              } catch (e) {
                throw new Error(`array ${i}: ${e.message}`);
              }
            }
          }, (buf) => {
            const ret = [];
            for (let i = 0; i < fixlen; i++) {
              try {
                ret.push(decoder(buf));
              } catch (e) {
                throw new Error(`array ${i}: ${e.message}`);
              }
            }
            return ret;
          },
        ];
      }
    }
  }
  _gen_object_coder(descriptors) {
    if ((typeof descriptors).toLowerCase() === "string") {
      const id = this._name2id[descriptors];
      throw_if(id === undefined, `bad type ${descriptors}`);
      return [
        this._encoders[id],
        this._decoders[id],
      ];
    }
    const keys = Object.keys(descriptors);
    // sort
    keys.sort();
    // gen coder
    const encoders = [];
    const decoders = [];
    const names = [];
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const value = descriptors[key];
      let coder;
      if ((typeof value).toLowerCase() === "string") {
        const info = parse_name(value);
        const id = this._name2id[info.name];
        throw_if(id === undefined, `bad sub type ${info.name}`);
        coder = this._gen_array_coder(info.arr, info.arr.length - 1, id);
      } else {
        coder = this._gen_object_coder(value);
      }
      encoders.push(coder[0]);
      decoders.push(coder[1]);
      names.push(key);
    }
    // merge coder
    const fixlen = names.length;
    return [
      (arr, value) => {
        if (value === undefined) {
          value = {};
        }
        if ((typeof value).toLowerCase() !== "object") {
          throw new Error(`is not object`);
        }
        for (let i = 0; i < fixlen; i++) {
          try {
            encoders[i](arr, value[names[i]]);
          } catch (e) {
            throw new Error(`${names[i]}: ${e.message}`);
          }
        }
      }, (buf) => {
        const ret = {};
        for (let i = 0; i < fixlen; i++) {
          try {
            ret[names[i]] = decoders[i](buf);
          } catch (e) {
            throw new Error(`${names[i]}: ${e.message}`);
          }
        }
        return ret;
      },
    ];
  }
  has_type(name) {
    return this._name2id[name] !== undefined;
  }
  add_type(name, encoder, decoder) {
    check_name(name);
    const id = this._id2name.length;
    throw_if(this._encoders.length !== id, "encoders bad length");
    throw_if(this._decoders.length !== id, "decoders bad length");
    throw_if(this._name2id[name] !== undefined, "type name already exists");
    this._id2name.push(name);
    this._encoders.push(encoder);
    this._decoders.push(decoder);
    this._name2id[name] = id;
  }
  add_object(name, decriptors) {
    check_name(name);
    const [encoder, decoder] = this._gen_object_coder(decriptors);
    this.add_type(name, encoder, decoder);
  }
  add_object_set(objs) {
    const names = Object.keys(objs);
    names.sort();
    const sorted_names = [];
    const cache = {};
    for (let i = 0; i < names.length; i++) {
      const key = names[i];
      if (sorted_names.indexOf(key) >= 0) {
        continue; // already appended
      }
      const dep = scan_dep(key, objs, cache);
      array_merge(sorted_names, dep);
      array_merge(sorted_names, [key]);
    }
    if (sorted_names.length !== names.length) {
      throw new Error("BUG???");
    }
    for (let name of sorted_names) {
      this.add_object(name, objs[name]);
    }
  }
  encode(type_name, value) {
    const info = parse_name(type_name);
    const { arr } = info;
    const id = this._name2id[info.name];
    throw_if(id === undefined, "type non-exists");
    const [encoder] = this._gen_array_coder(arr, arr.length - 1, id);
    const ret = [];
    encoder(ret, value);
    return ret; // new Uint8Array later
  }
  decode(type_name, buf) {
    const info = parse_name(type_name);
    const { arr } = info;
    const id = this._name2id[info.name];
    throw_if(id === undefined, "type non-exists");
    const [,decoder] = this._gen_array_coder(arr, arr.length - 1, id);
    return decoder(buf);
  }
};

module.exports = enc_object;
