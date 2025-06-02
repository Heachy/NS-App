<template>
  <div class="security-view">
    <div class="header">
      <el-image :src="require('@/assets/logo.png')" class="logo" />
      <span class="app-name">Nebula Storage</span>
    </div>

    <div class="content">
      <div class="security-card">
        <div class="card-header">
          <h2>安全管控</h2>
          <el-button type="primary" @click="goBack">
            <el-icon><Back /></el-icon>
            返回文件管理
          </el-button>
        </div>

        <el-divider />

        <!-- 修改密码部分 -->
        <div class="security-section">
          <div class="section-header">
            <h3>修改密码</h3>
            <el-button type="primary" link @click="showPasswordDialog">
              <el-icon><Edit /></el-icon>
              修改
            </el-button>
          </div>
          <p class="section-desc">定期修改密码可以提高账号安全性</p>
        </div>

        <el-divider />

        <!-- 手机号部分 -->
        <div class="security-section">
          <div class="section-header">
            <h3>手机号</h3>
            <el-button type="primary" link @click="showPhoneDialog">
              <el-icon><Edit /></el-icon>
              {{ userInfo.phone ? '更换' : '绑定' }}
            </el-button>
          </div>
          <p class="section-desc">
            当前手机号：{{ userInfo.phone || '未绑定手机号' }}
          </p>
        </div>
      </div>
    </div>

    <!-- 修改密码弹窗 -->
    <el-dialog
      v-model="passwordDialogVisible"
      title="修改密码"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="100px"
      >
        <el-form-item label="原密码" prop="oldPassword">
          <el-input
            v-model="passwordForm.oldPassword"
            type="password"
            placeholder="请输入原密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="请输入新密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="passwordDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="updatePassword" :loading="updating">
            确认修改
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 更换手机号弹窗 -->
    <el-dialog
      v-model="phoneDialogVisible"
      :title="userInfo.phone ? '更换手机号' : '绑定手机号'"
      width="450px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="phoneFormRef"
        :model="phoneForm"
        :rules="phoneRules"
        label-width="100px"
      >
        <el-form-item label="手机号" prop="phone">
          <el-input
            v-model="phoneForm.phone"
            placeholder="请输入手机号"
            maxlength="11"
          >
            <template #append>
              <el-button 
                type="primary" 
                @click="sendVerifyCode" 
                :disabled="cooldown > 0"
              >
                {{ cooldown > 0 ? `${cooldown}s后重试` : '获取验证码' }}
              </el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="验证码" prop="verifyCode">
          <el-input
            v-model="phoneForm.verifyCode"
            placeholder="请输入验证码"
            maxlength="6"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="phoneDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="updatePhone" :loading="updating">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Back, Edit } from '@element-plus/icons-vue'
import accountApi from '@/api/user/accountApi'
import loginApi from '@/api/user/loginApi'

const router = useRouter()
const userInfo = ref({})

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

// 返回文件管理页面
const goBack = () => {
  router.push('/file')
}

// 修改密码相关
const passwordDialogVisible = ref(false)
const passwordFormRef = ref(null)
const updating = ref(false)

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入新密码'))
  } else if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const showPasswordDialog = () => {
  passwordDialogVisible.value = true
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
}

const updatePassword = async () => {
  if (!passwordFormRef.value) return
  
  await passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      updating.value = true
      try {
        const response = await accountApi.updateUserPwdApi({
          password: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword
        })
        
        if (response.data.status === 200) {
          ElMessage.success('密码修改成功')
          passwordDialogVisible.value = false
        } 
      } catch (error) {
        console.error('修改密码失败:', error)
        ElMessage.error('修改密码失败')
      } finally {
        updating.value = false
      }
    }
  })
}

// 手机号相关
const phoneDialogVisible = ref(false)
const phoneFormRef = ref(null)
const cooldown = ref(0)

const phoneForm = reactive({
  phone: '',
  verifyCode: ''
})

const phoneRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  verifyCode: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { pattern: /^\d{6}$/, message: '请输入6位数字验证码', trigger: 'blur' }
  ]
}

const showPhoneDialog = () => {
  phoneDialogVisible.value = true
  phoneForm.phone = userInfo.value.phone || ''
  phoneForm.verifyCode = ''
}

const startCooldown = () => {
  cooldown.value = 60
  const timer = setInterval(() => {
    cooldown.value--
    if (cooldown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

const sendVerifyCode = async () => {
  if (!phoneForm.phone) {
    ElMessage.warning('请先输入手机号')
    return
  }
  
  try {
    const response = await loginApi.sendPhoneCodeApi({
      phone: phoneForm.phone
    })
    if (response.data.status === 200) {
      ElMessage.success('验证码发送成功')
      startCooldown()
    } else {
      ElMessage.error(response.data.message || '验证码发送失败')
    }
  } catch (error) {
    console.error('发送验证码失败:', error)
    ElMessage.error('发送验证码失败')
  }
}

const updatePhone = async () => {
  if (!phoneFormRef.value) return
  
  await phoneFormRef.value.validate(async (valid) => {
    if (valid) {
      updating.value = true
      try {
        const response = await accountApi.updateUserPhoneApi({
          phone: phoneForm.phone,
          verificationCode: phoneForm.verifyCode
        })
        
        if (response.data.status === 200) {
          ElMessage.success('手机号更新成功')
          phoneDialogVisible.value = false
          // 刷新用户信息
          await getUserInfo()
        } else {
          ElMessage.error(response.data.message || '手机号更新失败')
        }
      } catch (error) {
        console.error('更新手机号失败:', error)
        ElMessage.error('更新手机号失败')
      } finally {
        updating.value = false
      }
    }
  })
}

onMounted(() => {
  getUserInfo()
})
</script>

<style lang="scss" scoped>
.security-view {
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

    .security-card {
      width: 800px;
      background-color: white;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
      padding: 40px;

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;

        h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
          color: var(--el-text-color-primary);
        }

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

      .security-section {
        padding: 24px 0;

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 500;
            color: var(--el-text-color-primary);
          }

          .el-button {
            font-size: 14px;
            
            .el-icon {
              margin-right: 4px;
            }
          }
        }

        .section-desc {
          margin: 0;
          font-size: 14px;
          color: var(--el-text-color-secondary);
        }
      }
    }
  }
}

:deep(.el-dialog__body) {
  padding: 20px 40px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>


