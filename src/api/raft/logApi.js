import MyRequest from '../config/config'

const appendLogApi = (data) => {
    return MyRequest({
        url: '/ns-web/log/append',
        method: 'post',
        data: data
    })
}
export default appendLogApi