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

const demo_scheme = {
  login: {
    username: "string",
    password: "byte[6]",
  },
  user: {
    __mini_super: "login",
    age: "uint",
    id: "uint",
    home: {
      address: "string",
      number: "uint",
      scores: "uint[]",
    },
  },
};

mini.add_object_set(demo_scheme);

const demo_login = {
  username: "xxx小行星",
  password: [1,2,3,4,5,6],
};
const demo_login_bin = [ 1, 2, 3, 4, 5, 6, 6, 120, 120, 120, 229, 176, 143, 232, 161, 140, 230, 152, 159 ];

mini.encode("login", demo_login);
mini.decode("login", {
  bytes: demo_login_bin,
  cursor: 0,
});

const demo_user = {
  username: "112233",
  password: [6,5,4,3,2,1],
  age: 18,
  id: 100,
  home: {
    address: "klsjfeiow#@52^@",
    number: 123,
    scores: [2,3,4,5643,653,324],
  },
};
const demo_user_bin = [ 6, 5, 4, 3, 2, 1, 6, 49, 49, 50, 50, 51, 51, 18, 15, 107, 
  108, 115, 106, 102, 101, 105, 111, 119, 35, 64, 53, 50, 94, 64, 123, 6, 2, 3, 
  4, 139, 44, 141, 5, 196, 2, 100 ];

mini.encode("user", demo_user);
mini.decode("user", {
  bytes: demo_user_bin,
  cursor: 0,
});