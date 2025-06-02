import MyRequest from '../config/config'

// 密码登录
const loginByPwdApi = (data) => {
    return MyRequest({
        url: '/login/pwd',
        method: 'post',
        data: data
    })
}

// 手机验证码登录
const loginByPhoneApi = (data) => {
    return MyRequest({
        url: '/login/code',
        method: 'post',
        data: data
    })
}

// 发送手机验证码
const sendPhoneCodeApi = (data) => {
    return MyRequest({
        url: '/msg/send',
        method: 'post',
        data: data
    })
}

// 退出登录
const logoutApi = () => {
    return MyRequest({
        url: '/logout',
        method: 'post'
    })
}

const loginApi = {
    loginByPwdApi,
    loginByPhoneApi,
    sendPhoneCodeApi,
    logoutApi
}

export default loginApi

export {
    loginByPwdApi,
    loginByPhoneApi,
    sendPhoneCodeApi,
    logoutApi
}
