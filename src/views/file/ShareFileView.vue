<template>
  <div class="share-file-container">
    <div class="header">
      <el-image :src="require('@/assets/logo.png')" class="logo" />
      <span class="app-name">Nebula Storage</span>
    </div>

    <div class="content" v-if="fileInfo">
      <div class="file-card">
        <div class="file-info">
          <el-icon class="file-icon">
            <component :is="getFileIcon(fileInfo.name)" />
          </el-icon>
          <div class="file-details">
            <h2 class="file-name" :title="fileInfo.name">{{ fileInfo.name }}</h2>
            <div class="file-meta">
              <span class="size">大小：{{ formatSize(fileInfo.fileSize) }}</span>
              <span class="divider">|</span>
              <span class="time">上传时间：{{ formatDateTime(fileInfo.createTime) }}</span>
              <span class="divider">|</span>
              <span class="authority">
                权限：
                <el-tag :type="getAuthorityTagType(fileInfo.authority)" size="small" effect="light">
                  {{ getAuthorityText(fileInfo.authority) }}
                </el-tag>
              </span>
            </div>
          </div>
        </div>

        <div class="actions">
          <el-button type="primary" size="large" @click="showDownloadDialog" :loading="downloading">
            <el-icon><Download /></el-icon>
            下载文件
          </el-button>
        </div>
      </div>
    </div>

    <div v-else class="error-content">
      <el-empty description="文件不存在或没有权限" />
    </div>

    <!-- 下载弹窗 -->
    <el-dialog
      v-model="downloadDialogVisible"
      title="下载文件"
      width="400px"
      :close-on-click-modal="false"
      class="download-dialog"
    >
      <div class="download-info">
        <div class="file-basic-info">
          <el-icon class="file-icon">
            <component :is="getFileIcon(fileInfo?.name)" />
          </el-icon>
          <div class="file-details">
            <div class="file-name" :title="fileInfo?.name">{{ fileInfo?.name }}</div>
            <div class="file-size">文件大小：{{ formatSize(fileInfo?.fileSize) }}</div>
          </div>
        </div>
        
        <div v-if="downloading" class="download-progress">
          <el-progress 
            :percentage="downloadProgress"
            :format="(val) => `已下载 ${val}%`"
            :stroke-width="8"
            status="success"
          />
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="downloadDialogVisible = false" :disabled="downloading">取消</el-button>
          <el-button type="primary" @click="downloadFile" :loading="downloading">
            {{ downloading ? '下载中...' : '确认下载' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Download,
  Document,
  Picture,
  VideoCamera,
  Headset,
  Files
} from '@element-plus/icons-vue'
import fileApi from '@/api/file/fileApi'
import dayjs from 'dayjs'

const route = useRoute()
const fileInfo = ref(null)
const downloadDialogVisible = ref(false)
const downloading = ref(false)
const downloadProgress = ref(0)

// 获取文件信息
const getFileInfo = async () => {
  try {
    const fileId = route.query.fileId
    if (!fileId) {
      ElMessage.error('文件ID不能为空')
      return
    }

    const response = await fileApi.getFileInfoApi(fileId)
    if (response.data.status === 200) {
      fileInfo.value = response.data.data
    } 
  } catch (error) {
    console.error('获取文件信息失败:', error)
    ElMessage.error('获取文件信息失败')
  }
}

// 显示下载弹窗
const showDownloadDialog = () => {
  downloadDialogVisible.value = true
  downloadProgress.value = 0
}

// 下载文件
const downloadFile = async () => {
  if (!fileInfo.value) return
  
  downloading.value = true
  downloadProgress.value = 0
  
  try {
    const response = await fileApi.downloadFileApi(fileInfo.value.id, {
      onDownloadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        downloadProgress.value = percentCompleted
      },
      responseType: 'blob'
    })
    
    // 从响应头获取文件名
    const contentDisposition = response.headers['content-disposition']
    const fileNameMatch = contentDisposition.match(/filename="?(.+?)"?(;|$)/i)
    const fileName = decodeURIComponent(fileNameMatch ? fileNameMatch[1] : fileInfo.value.name)

    // 创建 Blob 并触发下载
    const blob = new Blob([response.data])
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.download = fileName
    link.click()
    window.URL.revokeObjectURL(link.href)

    ElMessage.success('下载成功')
    // 0.2秒后关闭弹窗
    setTimeout(() => {
      downloadDialogVisible.value = false
      downloading.value = false
      downloadProgress.value = 0
    }, 200)

  } catch (error) {
    downloading.value = false
    downloadProgress.value = 0
    if (error.response) {
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const errorData = JSON.parse(reader.result)
          ElMessage.error(`下载失败：${errorData.message}`)
        } catch (e) {
          ElMessage.error('下载失败')
        }
      }
      reader.readAsText(error.response.data)
    } else {
      ElMessage.error('下载失败：' + error.message)
    }
  }
}

// 获取文件图标
const getFileIcon = (fileName) => {
  if (!fileName) return Document
  
  const extension = fileName.split('.').pop()?.toLowerCase()
  
  // 图片文件
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension)) {
    return Picture
  }
  
  // 视频文件
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'].includes(extension)) {
    return VideoCamera
  }
  
  // 音频文件
  if (['mp3', 'wav', 'ogg', 'aac', 'wma', 'm4a'].includes(extension)) {
    return Headset
  }
  
  // 压缩文件
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
    return Files
  }
  
  return Document
}

// 格式化文件大小
const formatSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化时间
const formatDateTime = (time) => {
  return time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'
}

// 获取权限标签类型
const getAuthorityTagType = (authority) => {
  switch (authority) {
    case 0: return 'warning'
    case 1: return 'success'
    case 2: return 'info'
    default: return 'info'
  }
}

// 获取权限文本
const getAuthorityText = (authority) => {
  switch (authority) {
    case 0: return '公共读'
    case 1: return '公共读写'
    case 2: return '禁止对外开放'
    default: return '未知'
  }
}

onMounted(() => {
  getFileInfo()
})
</script>

<style lang="scss" scoped>
.share-file-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  display: flex;
  flex-direction: column;
  
  .header {
    height: 64px;
    background-color: white;
    border-bottom: 1px solid var(--el-border-color-lighter);
    padding: 0 24px;
    display: flex;
    align-items: center;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
    position: sticky;
    top: 0;
    z-index: 100;
    
    .logo {
      width: 44px;
      margin-right: 12px;
      transition: transform 0.3s ease;
      
      &:hover {
        transform: scale(1.05);
      }
    }
    
    .app-name {
      font-size: 22px;
      font-weight: 600;
      background: linear-gradient(120deg, var(--el-color-primary), var(--el-color-primary-light-3));
      background-clip: text;
      -webkit-background-clip: text;
      color: transparent;
      letter-spacing: 0.5px;
    }
  }
  
  .content {
    flex: 1;
    padding: 48px 24px;
    display: flex;
    justify-content: center;
    
    .file-card {
      height: 300px;
      width: 800px;
      background-color: white;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
      padding: 40px;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 32px rgba(0, 0, 0, 0.12);
      }
      
      .file-info {
        display: flex;
        align-items: flex-start;
        gap: 28px;
        margin-bottom: 40px;
        
        .file-icon {
          font-size: 56px;
          color: var(--el-color-primary);
          background-color: var(--el-color-primary-light-9);
          padding: 16px;
          border-radius: 12px;
          transition: transform 0.3s ease;
          
          &:hover {
            transform: scale(1.05);
          }
        }
        
        .file-details {
          flex: 1;
          min-width: 0;
          
          .file-name {
            font-size: 28px;
            font-weight: 600;
            color: var(--el-text-color-primary);
            margin: 0 0 20px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.4;
          }
          
          .file-meta {
            color: var(--el-text-color-secondary);
            font-size: 15px;
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 12px;
            line-height: 1.6;
            
            .divider {
              color: var(--el-border-color);
              margin: 0 4px;
            }
            
            .authority {
              display: flex;
              align-items: center;
              gap: 6px;
              
              :deep(.el-tag) {
                padding: 0 12px;
                height: 24px;
                line-height: 24px;
                border-radius: 12px;
                font-weight: 500;
              }
            }
          }
        }
      }
      
      .actions {
        display: flex;
        justify-content: center;
        
        .el-button {
          min-width: 180px;
          height: 48px;
          font-size: 16px;
          font-weight: 500;
          border-radius: 24px;
          transition: all 0.3s ease;
          
          .el-icon {
            margin-right: 8px;
            font-size: 18px;
          }
          
          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
          }
        }
      }
    }
  }
  
  .error-content {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 60px 24px;
    
    :deep(.el-empty) {
      padding: 40px;
      
      .el-empty__image {
        width: 180px;
      }
      
      .el-empty__description {
        margin-top: 24px;
        font-size: 16px;
        color: var(--el-text-color-secondary);
      }
    }
  }
}

.download-dialog {
  :deep(.el-dialog) {
    border-radius: 16px;
    overflow: hidden;
    
    .el-dialog__header {
      margin-right: 0;
      padding: 24px;
      border-bottom: 1px solid var(--el-border-color-lighter);
      
      .el-dialog__title {
        font-size: 18px;
        font-weight: 600;
      }
    }
    
    .el-dialog__body {
      padding: 0;
    }
    
    .el-dialog__footer {
      padding: 24px;
      border-top: 1px solid var(--el-border-color-lighter);
    }
  }
}

.download-info {
  .file-basic-info {
    padding: 28px;
    display: flex;
    align-items: center;
    gap: 20px;
    background-color: var(--el-bg-color);
    border-bottom: 1px solid var(--el-border-color-lighter);
    
    .file-icon {
      font-size: 44px;
      color: var(--el-color-primary);
      background-color: var(--el-color-primary-light-9);
      padding: 12px;
      border-radius: 10px;
    }
    
    .file-details {
      flex: 1;
      min-width: 0;
      
      .file-name {
        font-size: 17px;
        font-weight: 500;
        color: var(--el-text-color-primary);
        margin-bottom: 10px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .file-size {
        font-size: 14px;
        color: var(--el-text-color-secondary);
      }
    }
  }
  
  .download-progress {
    padding: 28px;
    
    :deep(.el-progress) {
      margin-bottom: 0;
      
      .el-progress-bar__outer {
        border-radius: 8px;
        background-color: var(--el-color-primary-light-8);
      }
      
      .el-progress-bar__inner {
        border-radius: 8px;
        transition: all 0.3s ease;
      }
      
      .el-progress__text {
        font-size: 14px;
        font-weight: 500;
        color: var(--el-color-primary);
      }
    }
  }
}
</style>