const SMSClient = require('@alicloud/sms-sdk');//用户调用阿里短信平台的框架

const accessKeyId = '******';//短信平台获取accessKeyId
const secretAccessKey = '******';//短信平台获取accessKeySecret

let smsClient = new SMSClient({ accessKeyId, secretAccessKey });//实例一个发送短信的实例

let sendcode = async (phone, verCode, template) => {//发送短信功能封装为函数供其它需要发送短信的地方调用
  try {
    //参数校验
    if (!phone) throw ('缺少号码');
    if (!verCode) throw ('缺少验证码');
    //构造请求参数：
    var dataToSend = {
      PhoneNumbers: phone,
      SignName: '心想心向',
      TemplateCode: template,
      TemplateParam: JSON.stringify({ code: verCode }),
    };

    let res = await smsClient.sendSMS(dataToSend);//调用smsClient实例的方法：sendSMS，发送验证码
    let { Code } = res;
    // 处理状态：
    if (Code === 'OK') {
      //处理返回参数
      return res;
    }
    throw '短信发送失败!'
  } catch (error) {
    throw ('发送短信验证码失败,您的操作可能过于频繁,请稍微再试!');
  }
}
module.exports = sendcode;