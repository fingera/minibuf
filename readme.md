## javascript binary serializer

#### types
1. byte 0 => 255
2. uint 0 => (2^53 - 1)
3. int -(2^52 - 1) => (2^52 - 1)
4. double IEEE 754
5. string utf8
6. array: ex: "byte[]" "string[4]" "double[][]"
7. object: depend on scheme

example:
```
const mini = require("minibuf");

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

console.log(mini.encode("login", demo_login));
console.log(mini.decode("login", {
  bytes: demo_login_bin,
  cursor: 0,
}));

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

console.log(mini.encode("user", demo_user));
console.log(mini.decode("user", {
  bytes: demo_user_bin,
  cursor: 0,
}));
```