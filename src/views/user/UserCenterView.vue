<template>
  <div class="user-center">
    <div class="header">
      <el-image :src="require('@/assets/logo.png')" class="logo" />
      <span class="app-name">Nebula Storage</span>
    </div>

    <div class="content">
      <div class="user-card">
        <div class="user-header">
          <div class="avatar-container">
            <el-avatar 
              :size="100" 
              :src="userInfo.avatarUrl || require('@/assets/head.png')"
              class="user-avatar"
              @click="showAvatarUpload"
            />
            <div class="avatar-upload-tip" v-if="showUploadTip">
              点击上传新头像
            </div>
            <div class="user-status">
              <el-tag type="success" effect="light" class="status-tag">在线</el-tag>
            </div>
          </div>
          <div class="user-basic-info">
            <h1 class="username">{{ userInfo.name || '未设置昵称' }}</h1>
            <p class="user-id">用户ID：{{ userInfo.id || '-' }}</p>
          </div>
        </div>

        <el-divider />

        <div class="info-section">
          <h2 class="section-title">基本个人信息</h2>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="昵称">
              <!-- {{ userInfo.name || '-' }} -->
              <div class="editable-item">
                      <div class="name-container">
                        <div class="input-wrapper" :class="{ 'is-editing': isEditingName }">
                          <div class="text-content">{{ editingUser.name || userInfo.name }}</div>
                          <el-input
                            v-show="isEditingName"
                            v-model="editingUser.name"
                            size="small"
                          />
                        </div>
                      </div>
                      <el-button
                        class="edit-button"
                        type="primary"
                        link
                        :icon="Edit"
                        :class="{ 'is-editing': isEditingName }"
                        @click="toggleNameEdit"
                      />
                    </div>
            </el-descriptions-item>
            <el-descriptions-item label="手机">
              {{ userInfo.phone || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="注册时间">
              {{ formatDateTime(userInfo.createTime) }}
            </el-descriptions-item>
            <el-descriptions-item label="最后登录">
              {{ formatDateTime(userInfo.lastLoginTime) }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="info-section">
          <h2 class="section-title">基础配置信息</h2>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="最大存储桶数量">
              {{ configInfo.maxBucketCount || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="默认存储桶大小">
              {{ formatSize(configInfo.defaultBucketMemory) }}
            </el-descriptions-item>
            <el-descriptions-item label="默认删除文件保存时间">
              {{ configInfo.defaultFileSave || '-' }} 天
            </el-descriptions-item>
            <el-descriptions-item label="默认bucket对外权限">
              <el-select v-model="configInfo.defaultBucketAuthority" placeholder="请选择权限" @change="handleConfigChange" class="authority-select">
                <template #prefix>
                  <el-tag 
                    :type="configInfo.defaultBucketAuthority === 2 ? 'info' : configInfo.defaultBucketAuthority === 1 ? 'success' : 'warning'" 
                    size="small" 
                    effect="light"
                    class="selected-tag"
                  >
                    {{ getAuthorityText(configInfo.defaultBucketAuthority) }}
                  </el-tag>
                </template>
                <el-option :value="0" :label="getAuthorityText(0)">
                  <el-tag type="warning" size="small" effect="light">公共读</el-tag>
                </el-option>
                <el-option :value="1" :label="getAuthorityText(1)">
                  <el-tag type="success" size="small" effect="light">公共读写</el-tag>
                </el-option>
                <el-option :value="2" :label="getAuthorityText(2)">
                  <el-tag type="info" size="small" effect="light">禁止对外开放</el-tag>
                </el-option>
              </el-select>
            </el-descriptions-item>
            <el-descriptions-item label="默认文件权限">
              <el-select v-model="configInfo.defaultFileAuthority" placeholder="请选择权限" @change="handleConfigChange" class="authority-select">
                <template #prefix>
                  <el-tag 
                    :type="configInfo.defaultFileAuthority === 2 ? 'info' : configInfo.defaultFileAuthority === 1 ? 'success' : configInfo.defaultFileAuthority === 3 ? 'primary' : 'warning'" 
                    size="small" 
                    effect="light"
                    class="selected-tag"
                  >
                    {{ getAuthorityText(configInfo.defaultFileAuthority) }}
                  </el-tag>
                </template>
                <el-option :value="0" :label="getAuthorityText(0)">
                  <el-tag type="warning" size="small" effect="light">公共读</el-tag>
                </el-option>
                <el-option :value="1" :label="getAuthorityText(1)">
                  <el-tag type="success" size="small" effect="light">公共读写</el-tag>
                </el-option>
                <el-option :value="2" :label="getAuthorityText(2)">
                  <el-tag type="info" size="small" effect="light">禁止对外开放</el-tag>
                </el-option>
                <el-option :value="3" :label="getAuthorityText(3)">
                  <el-tag type="primary" size="small" effect="light">继承存储桶权限</el-tag>
                </el-option>
              </el-select>
            </el-descriptions-item>
          </el-descriptions>
          <div class="save-config" v-if="configChanged">
            <el-button type="primary" @click="saveConfig" :loading="saving">
              <el-icon><Check /></el-icon>
              保存配置
            </el-button>
          </div>
        </div>

        <div class="actions">
          <el-button type="primary" @click="goBack">
            <el-icon><Back /></el-icon>
            返回文件管理
          </el-button>
        </div>
      </div>
    </div>

    <!-- 头像上传弹窗 -->
    <el-dialog
      v-model="avatarDialogVisible"
      title="更换头像"
      width="400px"
      :close-on-click-modal="false"
    >
      <div class="avatar-upload-container">
        <el-upload
          ref="uploadRef"
          class="avatar-uploader"
          action="#"
          :auto-upload="false"
          :show-file-list="false"
          :on-change="handleAvatarChange"
          :before-upload="beforeUpload"
          accept="image/jpeg,image/png,image/gif"
          drag
        >
          <div class="upload-area">
            <img v-if="avatarUrl" :src="avatarUrl" class="avatar-preview" />
            <div v-else class="upload-placeholder">
              <el-icon class="avatar-uploader-icon"><Plus /></el-icon>
              <div class="upload-tip">点击选择图片</div>
            </div>
          </div>
        </el-upload>
        <div class="upload-hint">支持 jpg、png、gif 格式，文件大小不超过 2MB</div>
        
        <!-- 上传进度 -->
        <div v-if="uploading" class="upload-progress">
          <el-progress
            :percentage="uploadProgress"
            :status="uploadStatus"
          />
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelUpload">取消</el-button>
          <el-button 
            type="primary" 
            @click="uploadAvatar" 
            :loading="uploading"
            :disabled="!selectedFile"
          >
            {{ uploading ? '上传中...' : '确认更换' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import {reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Back, Edit, Check, Plus } from '@element-plus/icons-vue'
import accountApi from '@/api/user/accountApi'
import dayjs from 'dayjs'
import nsConfigApi from '@/api/ns_config/NsConfigApi'

const router = useRouter()
const userInfo = ref({})
const configInfo = ref({})
const originalConfig = ref({})
const configChanged = ref(false)
const saving = ref(false)

// 头像上传相关
const uploadRef = ref(null)
const showUploadTip = ref(false)
const avatarDialogVisible = ref(false)
const avatarUrl = ref('')
const selectedFile = ref(null)
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadStatus = ref('')

// 编辑相关
const updating = ref(false)
const isEditingName = ref(false)
const editingUser = reactive({
  name: ''
})

// 切换名称编辑状态
const toggleNameEdit = () => {
  isEditingName.value = !isEditingName.value
  if (isEditingName.value) {
    editingUser.name = userInfo.value.name
  }else{
    console.log(isEditingName.value)
    accountApi.updateUserInfoApi(editingUser).then(res =>{
      if(res.data.status === 200){
        userInfo.value.name = editingUser.name
        ElMessage.success("昵称更改成功")
      }
    })
  }
}

// 获取用户信息
const getUserInfo = async () => {
  try {
    const response = await accountApi.getUserInfoApi()
    if (response.data.status === 200) {
      userInfo.value = response.data.data || {}
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    ElMessage.error('获取用户信息失败')
  }
}

// 获取配置信息
const getConfigInfo = async () => {
  try {
    const response = await nsConfigApi.getNsConfigApi()
    if (response.data.status === 200) {
      configInfo.value = response.data.data || {}
      originalConfig.value = JSON.parse(JSON.stringify(configInfo.value))
    }
  } catch (error) {
    console.error('获取配置信息失败:', error)
    ElMessage.error('获取配置信息失败')
  }
}

// 处理配置变更
const handleConfigChange = () => {
  configChanged.value = JSON.stringify(configInfo.value) !== JSON.stringify(originalConfig.value)
}

// 保存配置
const saveConfig = async () => {
  try {
    saving.value = true
    const response = await nsConfigApi.updateNsConfigApi(configInfo.value)
    if (response.data.status === 200) {
      ElMessage.success('配置保存成功')
      originalConfig.value = JSON.parse(JSON.stringify(configInfo.value))
      configChanged.value = false
    } else {
      ElMessage.error(response.data.message || '配置保存失败')
    }
  } catch (error) {
    console.error('保存配置失败:', error)
    ElMessage.error('保存配置失败')
  } finally {
    saving.value = false
  }
}

// 获取权限文本
const getAuthorityText = (authority) => {
  switch (authority) {
    case 0: return '公共读'
    case 1: return '公共读写'
    case 2: return '禁止对外开放'
    case 3: return '继承存储桶权限'
    default: return '未知'
  }
}

// 格式化时间
const formatDateTime = (time) => {
  return time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'
}

// 格式化存储大小
const formatSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 返回文件管理页面
const goBack = () => {
  router.push('/file')
}

// 显示头像上传提示
const showAvatarUpload = () => {
  avatarDialogVisible.value = true
  avatarUrl.value = ''
  selectedFile.value = null
}

// 检查文件大小和类型
const validateFile = (file) => {
  // 检查文件大小（限制为2MB）
  const maxSize = 2 * 1024 * 1024 // 2MB
  const fileSize = file.size / 1024 / 1024 // 转换为MB
  if (fileSize > 2) {
    ElMessage.error(`文件大小超出限制，当前大小 ${fileSize.toFixed(1)}MB，最大限制 2MB`)
    return false
  }
  
  // 检查文件类型
  const validTypes = ['image/jpeg', 'image/png', 'image/gif']
  if (!validTypes.includes(file.type)) {
    ElMessage.error('只支持 jpg、png、gif 格式的图片')
    return false
  }
  return true
}

// 文件上传前的验证
const beforeUpload = (file) => {
  return validateFile(file)
}

// 处理头像选择
const handleAvatarChange = (uploadFile) => {
  if (!validateFile(uploadFile.raw)) {
    if (uploadRef.value) {
      uploadRef.value.clearFiles()
    }
    selectedFile.value = null
    avatarUrl.value = ''
    return
  }
  selectedFile.value = uploadFile
  avatarUrl.value = URL.createObjectURL(uploadFile.raw)
}

// 取消上传
const cancelUpload = () => {
  if (uploading.value) {
    ElMessage.warning('文件正在上传中，请等待上传完成')
    return
  }
  avatarDialogVisible.value = false
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
  selectedFile.value = null
  avatarUrl.value = ''
  uploadProgress.value = 0
  uploadStatus.value = ''
}

// 上传头像
const uploadAvatar = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择要上传的图片')
    return
  }

  uploading.value = true
  uploadProgress.value = 0
  uploadStatus.value = ''
  
  // 模拟上传进度
  let currentProgress = 0
  const progressTimer = setInterval(() => {
    if (currentProgress < 90) {
      currentProgress += 2
      uploadProgress.value = currentProgress
    } else {
      clearInterval(progressTimer)
    }
  }, 100)
  
  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value.raw)
    
    const response = await accountApi.updateAvatarApi(formData)
    
    // 清除进度模拟定时器
    clearInterval(progressTimer)
    
    if (response.data.status === 200) {
      uploadProgress.value = 100
      uploadStatus.value = 'success'
      ElMessage.success('头像更新成功')
      avatarDialogVisible.value = false
      // 刷新用户信息以显示新头像
      await getUserInfo()
    } else {
      uploadStatus.value = 'exception'
      ElMessage.error(response.data.message || '头像更新失败')
    }
  } catch (error) {
    // 清除进度模拟定时器
    clearInterval(progressTimer)
    uploadStatus.value = 'exception'
    console.error('更新头像失败:', error)
    ElMessage.error('头像更新失败')
  } finally {
    uploading.value = false
  }
}

onMounted(() => {
  Promise.all([
    getUserInfo(),
    getConfigInfo()
  ])
})
</script>

<style lang="scss" scoped>
.user-center {
  min-height: 100vh;
  background-color: #f5f7fa;

  .header {
    height: 64px;
    background-color: white;
    border-bottom: 1px solid var(--el-border-color-lighter);
    padding: 0 24px;
    display: flex;
    align-items: center;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
    
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
    padding: 40px 24px;
    display: flex;
    justify-content: center;

    .user-card {
      width: 800px;
      background-color: white;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
      padding: 40px;
      
      .user-header {
        display: flex;
        align-items: center;
        gap: 32px;
        
        .avatar-container {
          position: relative;
          
          .user-avatar {
            border: 4px solid white;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
            cursor: pointer;
            
            &:hover {
              transform: scale(1.05);
              
              & + .avatar-upload-tip {
                opacity: 1;
                transform: translateY(0);
              }
            }
          }
          
          .avatar-upload-tip {
            position: absolute;
            top: -30px;
            left: 50%;
            transform: translateX(-50%) translateY(10px);
            background-color: var(--el-color-primary);
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            opacity: 0;
            transition: all 0.3s ease;
            white-space: nowrap;
            pointer-events: none;
            
            &::after {
              content: '';
              position: absolute;
              bottom: -6px;
              left: 50%;
              transform: translateX(-50%);
              border-width: 6px 6px 0;
              border-style: solid;
              border-color: var(--el-color-primary) transparent transparent;
            }
          }
          
          .user-status {
            position: absolute;
            bottom: 0;
            right: 0;
            
            .status-tag {
              border-radius: 12px;
              padding: 0 12px;
              height: 24px;
              line-height: 24px;
              font-size: 12px;
              border: 2px solid white;
            }
          }
        }
        
        .user-basic-info {
          flex: 1;
          min-width: 0;
          
          .username {
            font-size: 28px;
            font-weight: 600;
            color: var(--el-text-color-primary);
            margin: 0 0 8px;
          }
          
          .user-id {
            font-size: 14px;
            color: var(--el-text-color-secondary);
            margin: 0;
          }
        }
      }
      
      .info-section {
        margin-top: 32px;
        .editable-item {
  display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;

    .name-container {
      position: relative;
      flex: 1;
      min-width: 0;

      .input-wrapper {
        position: relative;
        width: 100%;
        height: 32px;

        .text-content {
          position: absolute;
          top: 0;
          left: 0;
          right: 32px; // 为编辑按钮预留空间
          height: 100%;
          padding: 0 12px;
          line-height: 32px;
          color: var(--el-text-color-primary);
          background-color: var(--el-fill-color-blank);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          border: 1px solid transparent;
          border-radius: 4px;
          transition: all 0.3s;
          z-index: 1;
        }

        &.is-editing {
          .text-content {
            display: none;
          }
        }

        .el-input {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;

          :deep(.el-input__wrapper) {
            width: 100%;
            height: 100%;
            padding: 1px 12px;
            box-shadow: 0 0 0 1px var(--el-border-color) inset;
            border-radius: 4px;
            transition: all 0.3s;

            &.is-focus {
              box-shadow: 0 0 0 1px var(--el-color-primary) inset;
            }
          }
        }
      }
    }

    .edit-button {
      flex: none;
      width: 32px;
      height: 32px;
      padding: 0;
      margin: 0;
      display: flex;
      align-items: center;
  justify-content: center;
      transition: all 0.3s;

      &.is-editing {
        color: var(--el-color-primary);
      }

      &:hover {
        background-color: var(--el-color-primary-light-9);
      }
    }

  }
        
        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: var(--el-text-color-primary);
          margin: 0 0 20px;
        }
        
        :deep(.el-descriptions) {
          --el-descriptions-item-bordered-label-background: var(--el-fill-color-light);
          
          .el-descriptions__cell {
            padding: 16px 24px;
          }
          
          .el-descriptions__label {
            font-weight: 500;
            color: var(--el-text-color-regular);
          }
          
          .el-descriptions__content {
            color: var(--el-text-color-primary);
          }
        }
      }
      
      .actions {
        margin-top: 40px;
        display: flex;
        justify-content: center;
        
        .el-button {
          min-width: 160px;
          height: 40px;
          border-radius: 20px;
          font-size: 16px;
          
          .el-icon {
            margin-right: 8px;
          }
          
          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
          }
        }
      }
    }
  }
}

.info-section {
  .save-config {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
    
    .el-button {
      min-width: 120px;
      height: 36px;
      border-radius: 18px;
      
      .el-icon {
        margin-right: 8px;
      }
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
      }
    }
  }

  :deep(.authority-select) {
    width: 160px;
    
    .el-input__wrapper {
      padding: 0 8px;
    }
    
    .el-select-dropdown__item {
      padding: 0 8px;
      height: 32px;
      line-height: 32px;
      
      .el-tag {
        width: 100%;
        text-align: center;
        margin: 4px 0;
      }
    }
    
    .el-input__prefix {
      margin-right: 8px;
      
      .el-tag {
        margin: 0;
      }
    }
    
    .el-input__inner {
      opacity: 0;
      width: 0;
    }
    
    .selected-tag {
      width: 120px;
      text-align: center;
    }
  }
}

.avatar-upload-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  
  .avatar-uploader {
    width: 200px;
    height: 200px;
    
    :deep(.el-upload) {
      width: 100%;
      height: 100%;
    }
    
    :deep(.el-upload-dragger) {
      width: 100%;
      height: 100%;
      border: 2px dashed var(--el-border-color);
      border-radius: 8px;
      transition: all 0.3s;
      background-color: var(--el-fill-color-lighter);
      padding: 0;
      
      &:hover {
        border-color: var(--el-color-primary);
        border-width: 2px;
        
        .upload-tip {
          color: var(--el-color-primary);
        }
      }
    }
    
    .upload-area {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
    
    .avatar-preview {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .upload-placeholder {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      
      .avatar-uploader-icon {
        font-size: 32px;
        color: var(--el-text-color-secondary);
        margin-bottom: 8px;
      }
      
      .upload-tip {
        color: var(--el-text-color-secondary);
        font-size: 14px;
        transition: color 0.3s;
      }
    }
  }
  
  .upload-hint {
    margin-top: 16px;
    color: var(--el-text-color-secondary);
    font-size: 13px;
    text-align: center;
    background-color: var(--el-fill-color-lighter);
    padding: 8px 16px;
    border-radius: 4px;
    width: 100%;
  }
  
  .upload-progress {
    margin-top: 20px;
    width: 100%;
    
    :deep(.el-progress-bar__outer) {
      border-radius: 4px;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  
  .el-button {
    min-width: 80px;
  }
}
</style>


