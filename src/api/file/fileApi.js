import MyRequest from '../config/config'

const uploadSingleFileApi = (data) => {
    return MyRequest({
        url: '/ns-web/file/upload/single',
        method: 'post',
        headers: {
            'Content-Type': 'multipart/form-data'
        },
        data
    })
}

const uploadMultipleFileApi = (data) => {
    return MyRequest({
        url: '/ns-web/file/upload/multiple',
        method: 'post',
        headers: {
            'Content-Type': 'multipart/form-data'
        },
        data
    })
}

const getFileListApi = (data) => {
    return MyRequest({
        url: '/ns-web/file/list',
        method: 'post',
        data: data
    })
}

const getDeleteFileListApi = (data) => {
    return MyRequest({
        url: '/ns-web/file/delete/list',
        method: 'post',
        data: data
    })
}

const getFileInfoApi = (id) => {
    return MyRequest({
        url: `/ns-web/file/info/${id}`,
        method: 'get'
    })
}

const downloadFileApi = (id) => {
    return MyRequest({
        url: `/ns-web/file/download/${id}`,
        method: 'get',
        responseType: 'blob'
    })
}
const updateAuthorityApi = (data) => {
    return MyRequest({
        url: `/ns-web/file/authority/update`,
        method: 'post',
        data: data
    })
}
const deleteFileApi = (id) => {
    return MyRequest({
        url: `/ns-web/file/delete/${id}`,
        method: 'post'
    })
}
const recoverFileApi = (id) => {
    return MyRequest({
        url: `/ns-web/file/recover/${id}`,
        method: 'post'
    })
}
const deleteFilePermanentApi = (id) => {
    return MyRequest({
        url: `/ns-web/file/delete/permanent/${id}`,
        method: 'post'
    })
}
const fileApi = {
    uploadSingleFileApi,
    uploadMultipleFileApi,
    getFileListApi,
    downloadFileApi,
    updateAuthorityApi,
    getFileInfoApi,
    deleteFileApi,
    getDeleteFileListApi,
    recoverFileApi,
    deleteFilePermanentApi
}

export default fileApi

export {
    uploadSingleFileApi,
    uploadMultipleFileApi,
    getFileListApi,
    downloadFileApi,
    updateAuthorityApi,
    getFileInfoApi,
    deleteFileApi,
    getDeleteFileListApi,
    recoverFileApi,
    deleteFilePermanentApi
}
