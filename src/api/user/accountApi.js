import MyRequest from '../config/config'

// 获取用户信息
const getUserInfoApi = () => {
    return MyRequest({
        url: '/user/info',
        method: 'get'
    })
}

const updateAvatarApi = (data) => {
    return MyRequest({
        url: '/ns-web/user/update/avatar',
        method: 'post',
        headers: {
            'Content-Type': 'multipart/form-data'
        },
        data
    })
}

const updateUserInfoApi = (data) => {
    return MyRequest({
        url: '/user/update/info',
        method: 'post',
        data: data
    })
}

const updateUserPwdApi = (data) => {
    return MyRequest({
        url: '/user/update/pwd',
        method: 'post',
        data: data
    })
}

const updateUserPhoneApi = (data) => {
    return MyRequest({
        url: '/user/update/phone',
        method: 'post',
        data: data
    })
}

// 用户注册
const registerApi = (data) => {
    return MyRequest({
        url: '/user/register',
        method: 'post',
        data: data
    })
}

const accountApi = {
    getUserInfoApi,
    registerApi,
    updateAvatarApi,
    updateUserInfoApi,
    updateUserPwdApi,
    updateUserPhoneApi
}

export default accountApi

export {
    getUserInfoApi,
    registerApi,
    updateAvatarApi,
    updateUserInfoApi,
    updateUserPwdApi,
    updateUserPhoneApi
}
