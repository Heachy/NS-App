<template>
<el-row
    :gutter="20"
    style="height: 900px; background-color: rgb(248, 249, 250)"
  >
    <el-col :span="2"> </el-col>

    <el-col :span="12" class="picturepart">
      <div class="midtop">
        <el-image :src="require('@/assets/logo.png')" class="logo" />
        <span class="appName">星瀚存储</span>
        <span class="picturecontent">散若星云聚为盾 灾时自愈稳如磐</span>
      </div>

      <el-image :src="require('@/assets/login.png')" style="width: 780px" />
    </el-col>
    <el-col :span="8" style="margin-top: 150px">
      <div class="formhome">
        <div class="formcontent">{{ isRegister ? '账号注册' : '账号登录' }}</div>
        <el-tabs
          v-model="activeName"
          class="demo-tabs"
          stretch="true"
          @tab-click="handleClick"
        >
          <el-tab-pane label="密码登录" name="first" v-if="!isRegister">
            <el-form
              :label-position="labelPosition"
              label-width="100px"
              :model="formPhone"
              style="max-width: 460px"
            >
              <el-form-item>
                <el-input
                  v-model="formPhone.phone"
                  placeholder="请输入手机号"
                  type="tel"
                />
              </el-form-item>
              <el-form-item>
                <el-input
                  v-model="formPhone.password"
                  placeholder="请输入密码"
                  type="password"
                  show-password
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="phonePwdLogin">登录</el-button>
              </el-form-item>
            </el-form>
          </el-tab-pane>
          <el-tab-pane label="验证码登录" name="second" v-if="!isRegister">
            <el-form
              :label-position="labelPosition"
              label-width="100px"
              :model="formPhone"
              style="max-width: 460px"
            >
              <el-form-item>
                <el-input
                  v-model="formPhone.phone"
                  placeholder="请输入手机号"
                  type="tel"
                />
              </el-form-item>
              <el-form-item>
                <el-input
                  v-model="formPhone.verificationCode"
                  placeholder="请输入验证码"
                  style="width: 80%"
                >
                  <template #append>
                    <el-button @click="sendPhoneCode" :disabled="isCounting" style="width: 120px; padding: 0 ; color: rgb(38, 142, 244);">
                      {{ isCounting ? `${countdown}秒后重试` : '获取验证码' }}
                    </el-button>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="phoneCodeLogin">登录</el-button>
              </el-form-item>
            </el-form>
          </el-tab-pane>
          <el-tab-pane label="注册" name="third" v-if="isRegister">
            <el-form
              :label-position="labelPosition"
              label-width="100px"
              :model="formPhone"
              style="max-width: 460px"
            >
              <el-form-item>
                <el-input
                  v-model="formPhone.phone"
                  placeholder="请输入手机号"
                  type="tel"
                />
              </el-form-item>
              <el-form-item>
                <el-input
                  v-model="formPhone.verificationCode"
                  placeholder="请输入验证码"
                  style="width: 80%"
                >
                  <template #append>
                    <el-button @click="sendPhoneCode" :disabled="isCounting" style="width: 120px; padding: 0 ; color: rgb(38, 142, 244);">
                      {{ isCounting ? `${countdown}秒后重试` : '获取验证码' }}
                    </el-button>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item>
                <el-input
                  v-model="formPhone.password"
                  placeholder="请输入密码"
                  type="password"
                  show-password
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="userRegister">注册</el-button>
              </el-form-item>
            </el-form>
          </el-tab-pane>
          <el-link
          type="primary"
          :underline="false"
          @click="toggleRegister"
          class="register"
        >{{ isRegister ? '已有账号?去登录' : '没有账号?快来注册吧！' }}</el-link>
        </el-tabs>
        
      </div>
      <div style="margin-top: 300px">
        <a href="http://beian.miit.gov.cn">备案号(闽ICP备2022011144号)</a>
  </div>
    </el-col>
    <el-col :span="2"> </el-col>
  </el-row>
</template>

<script setup>
import { reactive, ref } from 'vue'
import * as loginApi from '@/api/user/loginApi'
import * as accountApi from '@/api/user/accountApi'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

const router = useRouter()
const formPhone = reactive({
  phone: '',
  password: '',
  verificationCode: ''
})

const labelPosition = "top"
const activeName = ref("first")
const isCounting = ref(false)
const countdown = ref(60)
const isRegister = ref(false)

// 发送手机验证码
const sendPhoneCode = () => {
  if (!formPhone.phone) {
    ElMessage.warning('请输入手机号')
    return
  }
  // 手机格式
  if (!formPhone.phone.match(/^1[3-9]\d{9}$/)) {
    ElMessage.warning('请输入正确的手机号')
    return
  }
  
  isCounting.value = true
  countdown.value = 60
  
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
      isCounting.value = false
      countdown.value = 60
    }
  }, 1000)
  
  loginApi.sendPhoneCodeApi(formPhone).then(res => {
    console.log(res)
    if (res.status === 200) {
      ElMessage.success('验证码已发送')
    }
  })
}

// 手机验证码登录
const phoneCodeLogin = () => {
  if (!formPhone.phone) {
    ElMessage.warning('请输入手机号')
    return
  }
  // 手机格式
  if (!formPhone.phone.match(/^1[3-9]\d{9}$/)) {
    ElMessage.warning('请输入正确的手机号')
    return
  }
  if (!formPhone.verificationCode) {
    ElMessage.warning('请输入验证码')
    return
  }
  loginApi.loginByPhoneApi(formPhone).then(res => {
    console.log(res)
    if (res.status === 200) {
      ElMessage.success('登录成功')
      localStorage.setItem('token', res.data.data)
      router.push('/file')
    }
  })
}

// 密码登录
const phonePwdLogin = () => {
  if (!formPhone.phone) {
    ElMessage.warning('请输入手机号')
    return
  }
  // 手机格式
  if (!formPhone.phone.match(/^1[3-9]\d{9}$/)) {
    ElMessage.warning('请输入正确的手机号')
    return
  }
  if (!formPhone.password) {
    ElMessage.warning('请输入密码')
    return
  }
  loginApi.loginByPwdApi(formPhone).then(res => {
    console.log(res)
    if (res.status === 200) {
      ElMessage.success('登录成功')
      localStorage.setItem('token', res.data.data)
      router.push('/file')
    }
  })
}

// 切换注册/登录状态
const toggleRegister = () => {
  isRegister.value = !isRegister.value
  formPhone.phone = ''
  formPhone.password = ''
  formPhone.verificationCode = ''
  activeName.value = isRegister.value ? 'third' : 'first'
}

// 用户注册
const userRegister = () => {
  if (!formPhone.phone) {
    ElMessage.warning('请输入手机号')
    return
  }
  // 手机格式
  if (!formPhone.phone.match(/^1[3-9]\d{9}$/)) {
    ElMessage.warning('请输入正确的手机号')
    return
  }
  if (!formPhone.verificationCode) {
    ElMessage.warning('请输入验证码')
    return
  }
  if (!formPhone.password) {
    ElMessage.warning('请输入密码')
    return
  }
  if (formPhone.password.length < 6 || formPhone.password.length > 20) {
    ElMessage.warning('密码长度应在6-20个字符之间')
    return
  }
  accountApi.registerApi(formPhone).then(res => {
    console.log(res)
    if (res.status === 200) {
      ElMessage.success('注册成功')
      toggleRegister() // 注册成功后切换到登录界面
    } else {
      ElMessage.error(res.data.message)
    }
  })
}
</script>

<style lang="scss" scoped>

.midtop {
  position: relative;
  height: 120px;
}
.appName {
  position: absolute;
  left: 65px;
  top: 2px;
  height: 30px;
  color: rgb(38, 142, 244);
  font-family: KaiTi;
  font-weight: bolder;
  font-size: 45px;
}
.logo {
  position: absolute;
  width: 100px;
  left: -40px;
}

::v-deep.el-button {
  width: 80%;
  text-align: center;
  margin-left: 50px;
  height: 50px;
}
.formhome {

  width: 460px;
  margin-left: 40px;
}

.el-link.register {
  float: right;
  margin-right: 10px;
  margin-bottom: 15px;
}

.picturecontent {
  position: absolute;
  right: 30px;
  bottom: 10px;
  color: rgb(83, 159, 241);
  font-family: KaiTi;
  font-weight: bolder;
  font-size: 30px;
}
.picturepart {
  background-color: rgb(248, 249, 250);
}
.formcontent {
  font-size: 30px;
  font-family: Heiti;
}
.formhome {
  background-color: white;
}
::v-deep.el-input {
  width: 80%;
  margin-left: 50px;
  height: 50px;
}
</style>
