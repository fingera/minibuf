const minibuf = require("./minibuf");
const assert = require("assert");
const fs = require("fs");


function run_test(file) {
  const mini = new minibuf();
  const obj = JSON.parse(fs.readFileSync(`${__dirname}/test/${file}`), (key, value) => {
    if ((typeof value).toLowerCase() === "string") {
      if (value.indexOf("minibuf_test_tag:") === 0) {
        if (value === "minibuf_test_tag:NaN") {
          return NaN;
        } else if (value === "minibuf_test_tag:Infinity") {
          return Infinity
        } else if (value === "minibuf_test_tag:-Infinity") {
          return -Infinity;
        }
      }
    }
    return value;
  });
  mini.add_object_set(obj.load);
  for (let ok of obj.ok) {
    const buf = {
      bytes: ok.bytes,
      cursor: 0,
    };
    assert.deepStrictEqual(buf.bytes, mini.encode(ok.type, ok.value));
    if ((typeof ok.value).toLowerCase() === "object" && ok.value !== null) {
      assert.deepStrictEqual(ok.compare || ok.value, mini.decode(ok.type, buf));
    } else {
      assert.strictEqual(ok.compare || ok.value, mini.decode(ok.type, buf));
    }
    assert.strictEqual(buf.cursor, ok.bytes.length);
  }
  for (let fail of obj.fail) {
    if (fail.value !== undefined) {
      assert.throws(mini.encode.bind(mini, fail.type, fail.value));
    }
    if (fail.bytes !== undefined) {
      assert.throws(mini.decode.bind(mini, fail.type, fail.bytes));
    }
  }
  console.log(`run ${file} passed`);
}

run_test("byte.json");
run_test("uint.json");
run_test("int.json");
run_test("double.json");
run_test("string.json");
run_test("object.json");

// Special string
const mini = new minibuf();
assert.throws(mini.encode.bind(mini, "string", String.fromCharCode.apply(null, [0xD800])));
assert.throws(mini.encode.bind(mini, "string", String.fromCharCode.apply(null, [0xD800, 0xE000])));
assert.throws(mini.encode.bind(mini, "string", String.fromCharCode.apply(null, [0xD800, 0xDBFF])));
// Special objects
const objs = {
  A: "B",
  B: "C",
  C: "A",
};
assert.throws(mini.add_object_set.bind(mini, objs));