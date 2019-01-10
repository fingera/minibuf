const minibuf = require("./minibuf");
const assert = require("assert");
const fs = require("fs");

const mini = new minibuf();

mini.encode("null");
mini.decode("null");

console.log("testing byte...");
for (let i = 0; i < 256; i++) {
  const buf = {
    bytes: [i],
    cursor: 0,
  }
  assert.deepStrictEqual(buf.bytes, mini.encode("byte", i));
  assert.strictEqual(i, mini.decode("byte", buf));
  assert.strictEqual(buf.cursor, 1);
}
const test_byte_except = [
  -1,
  256,
  1.1,
  "",
  {},
  [],
  () => {},
];
for (let byte of test_byte_except) {
  assert.throws(mini.encode.bind(mini, "byte", byte));
}
console.log("testing byte... passed");

console.log("testing byte array...");
const test_byte_array = JSON.parse(fs.readFileSync("./byte_array.json"));
const test_byte_array_keys = Object.keys(test_byte_array);
for (let key of test_byte_array_keys) {
  const value = test_byte_array[key];
  const buf = {
    bytes: value.bytes,
    cursor: 0,
  };
  assert.deepStrictEqual(buf.bytes, mini.encode(key, value.value));
  assert.deepStrictEqual(value.value, mini.decode(key, buf));
  assert.strictEqual(buf.cursor, value.bytes.length);
}
const test_byte_array_except = [
  -1,
  256,
  "",
  {},
  () => {},
];
for (let bytes of test_byte_array_except) {
  assert.throws(mini.encode.bind(mini, "byte[]", bytes));
}
console.log("testing byte array... passed");