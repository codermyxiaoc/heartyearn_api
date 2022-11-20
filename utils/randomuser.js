function randomuser(num) {
  let str = ''
  let strarr = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']
  for (let i = 0; i < num; i++) {
    const r = parseInt(0 + Math.random() * 26 - 1)
    str += strarr[r]
  }
  return str
}
module.exports = randomuser