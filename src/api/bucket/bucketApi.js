import MyRequest from '../config/config'

const getBucketListApi = () => {
    return MyRequest({
        url: 'ns-web/bucket/list',
        method: 'get'
    })
}
const updateBucketApi = (data) => {
    return MyRequest({
        url: 'ns-web/bucket/update',
        method: 'post',
        data: data
    })
}

const getBucketInfoApi = (bucketId) => {
    return MyRequest({
        url: `ns-web/bucket/${bucketId}`,
        method: 'get'
    })
}

const createBucketApi = (data) => {
    return MyRequest({
        url: 'ns-web/bucket/create',
        method: 'post',
        data: data
    })
}
const bucketApi = {
    getBucketListApi,
    getBucketInfoApi,
    createBucketApi,
    updateBucketApi
}

export default bucketApi

export {
    getBucketListApi,
    getBucketInfoApi,
    createBucketApi,
    updateBucketApi
}


