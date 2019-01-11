
const fs = require("fs");

function empty() {
  return {
    ok: [],
    fail: [],
    load: [],
  };
}

function write(file, data) {
  fs.writeFileSync(
    `${__dirname}/${file}`,
    JSON.stringify(data, (key, value) => {
      if ((typeof value).toLowerCase() === "number") {
        if (value !== value) {
          return "minibuf_test_tag:NaN";
        } else if (value === Infinity) {
          return "minibuf_test_tag:Infinity";
        } else if (value === -Infinity) {
          return "minibuf_test_tag:-Infinity";
        }
      }
      return value;
    }, 2)
  );
}

console.log("generating byte test...");
{
  const byte = empty();
  for (let i = 0; i < 255; i++) {
    byte.ok.push({
      value: i,
      bytes: [i],
      type: "byte",
    });
  }
  [-1, 256, 1.1, "", {}, []].map((val) => {
    byte.fail.push({
      value: val,
      type: "byte",
    });
  });
  write("byte.json", byte);
}

console.log("generating uint test...");
{
  const uint = empty();
  for (let i = 0; i <= 49; i += 7) {
    const len = (i / 7) + 1;
    uint.ok.push({
      value: Math.floor(Math.pow(2, i)),
      bytes: new Array(len).fill(0x80).fill(1, -1),
      type: "uint",
    });
    uint.ok.push({
      value: Math.floor(Math.pow(2, i) - 1),
      bytes: new Array(len === 1 ? 1 : len - 1).fill(0xFF).fill(i === 0 ? 0 : 0x7f, -1),
      type: "uint",
    });
  }
  uint.ok.push({
    value: Number.MAX_SAFE_INTEGER,
    bytes: [255, 255, 255, 255, 255, 255, 255, 15],
    type: "uint",
  });
  [-1, 1.1, "", {}, [], Number.MAX_SAFE_INTEGER + 1].map((val) => {
    uint.fail.push({
      value: val,
      type: "uint",
    });
  });
  write("uint.json", uint);
}

console.log("generating int test...");
{
  const int = empty();
  int.ok.push({ value: -1, bytes: [3], type: "int", });
  int.ok.push({ value: 0, bytes: [0], type: "int", });
  int.ok.push({ value: 1, bytes: [2], type: "int", });
  for (let i = 6; i <= 48; i += 7) {
    const len = ((i - 6) / 7) + 1;
    int.ok.push({
      value: Math.floor(Math.pow(2, i)),
      bytes: new Array(len + 1).fill(0x80).fill(1, -1),
      type: "int",
    });
    int.ok.push({
      value: -Math.floor(Math.pow(2, i)),
      bytes: new Array(len + 1).fill(0x80).fill(1, -1).fill(0x81, 0, 1),
      type: "int",
    });
    int.ok.push({
      value: Math.floor(Math.pow(2, i) - 1),
      bytes: new Array(len).fill(0xFF).fill(0xFE, 0, 1).fill(i === 6 ? 0x7E : 0x7F, -1),
      type: "int",
    });
    int.ok.push({
      value: -Math.floor(Math.pow(2, i) - 1),
      bytes: new Array(len).fill(0xFF).fill(0x7F, -1),
      type: "int",
    });
  }
  const max_int = Math.floor(Number.MAX_SAFE_INTEGER / 2);
  int.ok.push({
    value: max_int,
    bytes: [0xFE, 255, 255, 255, 255, 255, 255, 15],
    type: "int",
  });
  int.ok.push({
    value: -max_int,
    bytes: [255, 255, 255, 255, 255, 255, 255, 15],
    type: "int",
  });
  [1.1, "", {}, [], max_int + 1, -max_int - 1].map((val) => {
    int.fail.push({
      value: val,
      type: "int",
    });
  });
  write("int.json", int);
}

console.log("generating double test...");
{
  const double = empty();
  double.ok.push({ value: NaN, bytes: [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x7F], type: "double", });
  double.ok.push({ value: Infinity, bytes: [0, 0, 0, 0, 0, 0, 0xF0, 0x7F], type: "double", });
  double.ok.push({ value: -Infinity, bytes: [0, 0, 0, 0, 0, 0, 0xF0, 0xFF], type: "double", });
  double.ok.push({ value: 2.2250738585072014e-308, bytes: [0, 0, 0, 0, 0, 0, 16, 0], type: "double", });
  double.ok.push({ value: -2.2250738585072014e-308, bytes: [0, 0, 0, 0, 0, 0, 16, 0x80], type: "double", });
  double.ok.push({ value: 1.7976931348623157e+308, bytes: [255, 255, 255, 255, 255, 255, 239, 127], type: "double", });
  double.ok.push({ value: -1.7976931348623157e+308, bytes: [255, 255, 255, 255, 255, 255, 239, 255], type: "double", });
  double.ok.push({ value: 2.2250738585072014e-309, bytes: [154, 153, 153, 153, 153, 153, 1, 0], type: "double", });
  double.ok.push({ value: 0, bytes: [0, 0, 0, 0, 0, 0, 0, 0], type: "double", });
  double.ok.push({ value: 1, bytes: [0, 0, 0, 0, 0, 0, 0xF0, 0x3F], type: "double", });
  double.ok.push({ value: -1, bytes: [0, 0, 0, 0, 0, 0, 0xF0, 0xBF], type: "double", });
  double.ok.push({ value: -2.2250738585072014e-309, bytes: [154, 153, 153, 153, 153, 153, 1, 0x80], type: "double", });
  double.ok.push({ value: 525432325.23532, bytes: [0xEE, 0x3D, 0x3C, 0x05, 0x76, 0x51, 0xBF, 0x41], type: "double", });
  write("double.json", double);
}

console.log("generating string test...");
{
  const string = empty();
  string.ok.push({ value: "Hello World!", bytes: [12, 72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33], type: "string" });
  string.ok.push({ value: "特朗普宣布取消赴瑞士达沃斯论坛行程", bytes: [17, 231, 137, 185, 230, 156, 151, 230, 153, 174, 229, 174, 163, 229, 184, 131, 229, 143, 150, 230, 182, 136, 232, 181, 180, 231, 145, 158, 229, 163, 171, 232, 190, 190, 230, 178, 131, 230, 150, 175, 232, 174, 186, 229, 157, 155, 232, 161, 140, 231, 168, 139], type: "string" });
  string.ok.push({ value: "❄", bytes: [1, 226, 157, 132], type: "string" });
  string.ok.push({ value: "😁", bytes: [2, 240, 159, 152, 129], type: "string" });
  string.fail.push({ bytes: [0xB0], type: "string" });
  string.fail.push({ bytes: [0xF9], type: "string" });
  write("string.json", string);
}

console.log("generating object test...");
{
  const object = empty();
  object.load = {
    user: {
      detail: {
        age: "uint",
        phone: "uint",
      },
      name: "string",
      password: "byte[4]",
    },
    cls: {
      id: "uint",
      name: "string",
      users: "user[]",
    },
    school: {
      cls: "cls[]",
      detail: {
        address: "string",
        size: "uint"
      },
      master: "string",
      name: "string",
    },
    city: {
      dang: "cls[]",
      schools: "school[]",
      name: "string",
      master: "user",
    },
    simple: {
      cls: {
        id: "uint",
        scores: "uint[]",
      },
      id: "uint",
      person: {
        age: "double",
        name: "string",
      },
    },
    mapsimple: "simple",
  };
  object.ok.push({
    value: {
      cls: {
        id: 2,
        scores: [
          1, 2, 3, 4, 5
        ],
      },
      id: 1,
      person: {
        age: 25,
        name: "goodboy",
      },
    },
    type: "simple",
    bytes: [
      2, // cls.id: uint 2
      5, // cls.scores: array5
      1, 2, 3, 4, 5,
      1, // id: uint 1
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x39, 0x40, // person.age: double 25
      7, // person.name: string "goodboy"
      103, 111, 111, 100, 98, 111, 121
    ],
  });
  object.ok.push({
    value: {
      cls: {
        id: 128,
        scores: [
          8,8,8,128,
        ],
      },
      id: 127,
      person: {
        age: 888999,
        name: "特朗普",
      },
    },
    type: "mapsimple",
    bytes: [
      0x80, 0x01, // cls.id: uint 128
      4, // cls.scores: array4
      8, 8, 8, 0x80, 0x01,
      0x7f, // id: uint 0x7f
      0x00, 0x00, 0x00, 0x00, 0x4E, 0x21, 0x2B, 0x41, // person.age: double 888999
      3, // person.name: string "特朗普"
      231, 137, 185, 230, 156, 151, 230, 153, 174
    ],
  });
  object.ok.push({
    value: {},
    compare: {
      cls: {
        id: 0,
        scores: [],
      },
      id: 0,
      person: {
        age: 0,
        name: "",
      },
    },
    type: "simple",
    bytes: [
      0, // cls.id: uint 0
      0, // cls.scores: array0
      0, // id: uint 0
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // person.age: double 0
      0, // person.name: string ""
    ],
  });
  object.ok.push({
    value: {
      name: "shenzhen",
      master: {
        name: "wangwu",
        password: [2,2,2,2],
        detail: {
          age: 0,
          phone: 0,
        }
      },
      schools: [
        {
          cls: [
            {
              id: 1,
              name: "三年一班",
              users: [
                {
                  name: "李1",
                  password: [0,0,0,0],
                  detail: {
                    age: 33,
                    phone: 1,
                  },
                },
                {
                  name: "李2",
                  password: [1,1,2,3],
                  detail: {
                    age: 55,
                    phone: 1,
                  },
                },
              ],
            },
            {
              id: 2,
              name: "三年二班",
              users: [
                {
                  name: "李1",
                  password: [0,0,0,0],
                  detail: {
                    age: 33,
                    phone: 1,
                  },
                },
                {
                  name: "李2",
                  password: [1,1,2,3],
                  detail: {
                    age: 55,
                    phone: 1,
                  },
                },
              ],
            },
          ],
          detail: {
            address: "shenzhenxxlu",
            size: 100,
          },
          master: "wangwu",
          name: "xxdaxue",
        }
      ],
      dang: [
        {
          id: 1,
          name: "xuexi",
          users: [
            {
              name: "zhangsan",
              detail: {
                age: 20,
                phone: 13300001111,
              },
              password: [1,2,3,4],
            },
            {
              name: "lisi",
              detail: {
                age: 21,
                phone: 13399998888,
              },
              password: [4,3,2,1],
            },
          ]
        }
      ],
    },
    type: "city",
    bytes: [
      1, // dang.length 1
      1, // dang[0].id 1
      5, 120, 117, 101, 120, 105, // dang[0].name "xuexi"
      2, // dang[0].users.length 2
      20, // dang[0].users[0].detail.age 20
      215, 210, 247, 197, 49, // dang[0].users[0].detail.phone 13300001111
      8, 122, 104, 97, 110, 103, 115, 97, 110, // dang[0].users[0].name "zhangsan"
      1, 2, 3, 4, // dang[0].users[0].password [1, 2, 3, 4]
      21, // dang[0].users[1].detail.age 21
      168, 131, 207, 245, 49, // dang[0].users[1].detail.phone 13399998888
      4, 108, 105, 115, 105, // dang[0].users[1].name "lisi"
      4, 3, 2, 1, // dang[0].users[1].password [4, 3, 2, 1]
      0,0,6,119,97,110,103,119,117,2,2,2,2,8,115,104,101,110,122,104,101,110,1,2,1,4,228,184,137,229,185,180,228,184,128,231,143,173,2,33,1,2,230,157,142,49,0,0,0,0,55,1,2,230,157,142,50,1,1,2,3,2,4,228,184,137,229,185,180,228,186,140,231,143,173,2,33,1,2,230,157,142,49,0,0,0,0,55,1,2,230,157,142,50,1,1,2,3,12,115,104,101,110,122,104,101,110,120,120,108,117,100,6,119,97,110,103,119,117,7,120,120,100,97,120,117,101
    ],
  })
  write("object.json", object);
}