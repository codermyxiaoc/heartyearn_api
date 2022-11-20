function randompwd(num) {
  let password = ''
  for (let i = 0; i < num; i++) {
    password += parseInt(Math.random() * 10) + ''
  }
  return password
}
module.exports = randompwd