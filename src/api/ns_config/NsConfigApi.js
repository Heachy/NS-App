import MyRequest from '../config/config'

const getNsConfigApi = () => {
    return MyRequest({
        url: '/ns-web/config/get',
        method: 'get'
    })
}

const updateNsConfigApi = (data) => {
    return MyRequest({
        url: '/ns-web/config/update',
        method: 'post',
        data
    })
}

const nsConfigApi = {
    getNsConfigApi,
    updateNsConfigApi
}

export default nsConfigApi

export {
    getNsConfigApi,
    updateNsConfigApi
}
