import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const service = axios.create({
  // baseURL: 'https://rrewuq.com',
  baseURL: 'http://localhost:8076',
  timeout: 60000,
  /*   withCredentials:true, */
  /* crossDomain:true, */
  headers: {
    'Content-Type': 'application/json; charset=utf-8'
  }
})

service.interceptors.request.use(config => {
  // 如果是分享页面的请求，不需要添加token
  if (config.url.includes('/share')) {
    return config
  }
  config.headers.token = localStorage.getItem('token')
  return config
})

service.interceptors.response.use((res) => { // 成功的请求返回处理
  if (res.data.status === 100) { // 未登录code为100
    router.push('/')
  } else if (res.data.status !== 200) {
    // 如果请求是下载文件，则不弹出错误信息
    if (res.config.responseType === 'blob') {
      return res
    } else {
      if (res.data.status === 401) {
        console.log('401')
        router.push('/')
      } else {
        ElMessage.error('操作失败: ' + res.data.message)
      }
    }
  }
  return res
},
  (err) => { // 异常的请求返回处理
    ElMessage.error('请求异常')
    return Promise.reject(err)
  })

export default service
