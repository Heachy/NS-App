<template>
  <div class="common-layout">
    <el-container>
      <el-header height="60px">
        <div class="header-content">
          <div class="header-left">
            <el-image :src="require('@/assets/logo.png')" class="logo" />
            <span class="app-name">Nebula Storage</span>
          </div>
          <div class="header-center">

            <el-input
              v-model="searchKeyword"
              placeholder="搜索文件"
              class="input-with-select"
              clearable
               @keyup.enter="searchFile" 
            >
              <template #append>
                <el-button :icon="Search" @click="searchFile" />
              </template>
            </el-input>
          </div>
          <div class="header-right">
            <div class="user-info">
              <span class="username">{{ userInfo.name || "haechi" }}</span>
              <el-dropdown trigger="hover" :hideOnClick="false">
                <el-avatar
                  :size="40"
                  :src="userInfo.avatarUrl || require('@/assets/head.png')"
                />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="goToUserCenter">
                      <el-icon><User /></el-icon>
                      <span>个人中心</span>
                    </el-dropdown-item>
                    <el-dropdown-item @click="goToSecurity">
                      <el-icon><Lock /></el-icon>
                      <span>安全管控</span>
                    </el-dropdown-item>
                    <el-dropdown-item divided @click="handleLogout">
                      <el-icon><SwitchButton /></el-icon>
                      <span>退出登录</span>
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </div>
      </el-header>

      <el-container>
        <el-aside width="200px" height="100%">
          <div class="aside-content">
            <div class="bucket-header">
              <span>存储桶列表</span>
              <el-button
                type="primary"
                :icon="Plus"
                circle
                @click="showCreateBucketDialog"
              />
            </div>
            <el-menu default-active="1" class="bucket-menu">
              <el-menu-item
                v-for="bucket in bucketList"
                :key="bucket.id"
                :index="bucket.id.toString()"
                @click="switchBucket(bucket)"
              >
                <el-icon><Folder /></el-icon>
                <template #title>
                  <span>{{ bucket.name }}</span>
                  <el-progress
                    :percentage="
                      Math.round((bucket.memoryUsage / bucket.maxMemory) * 100)
                    "
                    :format="(val) => `${val}%`"
                    :stroke-width="4"
                    class="bucket-usage"
                  />
                </template>
              </el-menu-item>
            </el-menu>
            <el-button type="primary" :icon="Delete" style="position: absolute; bottom: 50px; left: 55px;"
            @click="showRecyclingStationDialog"
            >回收站</el-button>
          </div>
        </el-aside>

        <el-container>
          <el-main>
            <div class="main-content">
              <el-empty
                description="快去上传文件吧"
                v-if="fileList === null || fileList.length === 0"
              />
              <el-table
                :data="fileList"
                style="width: 100%; height: 100%"
                v-else
              >
                <el-table-column type="selection" width="55" />
                <el-table-column prop="name" label="文件名" />
                <!-- 对外权限 -->
                <el-table-column prop="authority" label="对外权限" width="120">
                  <template #default="scope">
                    <el-tag
                      :type="getAuthorityTagType(scope.row.authority)"
                      size="small"
                    >
                      {{ getAuthorityText(scope.row.authority) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="fileSize" label="大小" width="120">
                  <template #default="scope">
                    {{ formatSize(scope.row.fileSize) }}
                  </template>
                </el-table-column>
                <!-- 上传时间 -->
                <el-table-column
                  prop="createTime"
                  label="上传时间"
                  width="180"
                />
                <el-table-column
                  prop="updateTime"
                  label="修改时间"
                  width="180"
                />
                <el-table-column label="操作" width="350" fixed="right">
                  <template #default="scope">
                    <!-- 权限更改 -->
                    <el-button
                      link
                      type="primary"
                      @click="changeAuthority(scope.row)"
                      :icon="Edit"
                      >权限更改</el-button
                    >
                    <!-- 下载 -->
                    <el-button
                      link
                      type="primary"
                      @click="showDownloadDialog(scope.row)"
                      :icon="Download"
                      >下载</el-button
                    >
                    <!-- 分享 -->
                    <el-button
                      link
                      type="primary"
                      @click="shareFile(scope.row)"
                      :icon="Share"
                      >分享</el-button
                    >
                    <!-- 删除 -->
                    <el-button
                      link
                      type="danger"
                      @click="deleteFile(scope.row)"
                      :icon="Delete"
                      >删除</el-button
                    >
                  </template>
                </el-table-column>
              </el-table>
              <div
                class="pagination"
                v-if="fileList != null && fileList.length > 0"
              >
                <el-pagination
                  v-model:current-page="currentPage"
                  v-model:page-size="pageSize"
                  :page-sizes="[10, 20, 50, 100]"
                  :total="total"
                  layout="total, sizes, prev, pager, next, jumper"
                  @size-change="handleSizeChange"
                  @current-change="handleCurrentChange"
                  background
                />
              </div>
            </div>
          </el-main>

          <el-footer height="auto">
            <div class="footer-container">
              <!-- 左侧上传区域 -->
              <div class="upload-area">
                <div
                  class="upload-container"
                  :class="{ 'has-files': uploadFileList.length > 0 }"
                >
                  <!-- 左侧待上传文件列表 -->
                  <div
                    v-if="uploadFileList.length > 0"
                    class="upload-file-list"
                  >
                    <el-table :data="uploadFileList" style="width: 100%">
                      <el-table-column prop="name" label="待上传文件名" />
                      <el-table-column prop="size" label="大小" width="120">
                        <template #default="scope">
                          {{ formatSize(scope.row.size) }}
                        </template>
                      </el-table-column>
                      <el-table-column label="状态" width="100">
                        <template #default="scope">
                          <el-tag :type="getStatusType(scope.row.status)">
                            {{ getStatusText(scope.row.status) }}
                          </el-tag>
                        </template>
                      </el-table-column>
                      <el-table-column label="操作" width="100">
                        <template #default="scope">
                          <el-button
                            link
                            type="danger"
                            @click="removeFile(scope.$index)"
                            :disabled="uploading"
                          >
                            删除
                          </el-button>
                        </template>
                      </el-table-column>
                    </el-table>
                  </div>

                  <!-- 右侧拖拽上传区域 -->
                  <div class="upload-dragger-container">
                    <el-upload
                      ref="uploadRef"
                      class="upload-dragger"
                      drag
                      action="#"
                      :auto-upload="false"
                      :on-change="handleChange"
                      :on-success="handleSuccess"
                      :on-error="handleError"
                      :before-upload="beforeUpload"
                      :file-list="uploadFileList"
                      :show-file-list="false"
                      multiple
                    >
                      <el-icon class="el-icon--upload" :size="25"
                        ><upload-filled
                      /></el-icon>
                      <div class="el-upload__text">
                        将文件拖到此处，或<em>点击上传</em>
                      </div>
                      <template #tip>
                        <div class="el-upload__tip">
                          支持任意类型的文件，单个文件不超过 10MB
                        </div>
                      </template>
                    </el-upload>
                  </div>
                </div>

                <!-- 上传按钮和进度条 -->
                <div class="upload-footer" v-if="uploadFileList.length > 0">
                  <div class="upload-actions">
                    <el-button
                      type="primary"
                      size="large"
                      @click="uploadFiles"
                      :loading="uploading"
                    >
                      <el-icon><upload-filled /></el-icon>
                      {{ uploading ? "上传中..." : "开始上传" }}
                    </el-button>
                    <el-button size="large" @click="clearFiles">
                      <el-icon><delete /></el-icon>
                      清空列表
                    </el-button>
                  </div>

                  <!-- 上传进度 -->
                  <div v-if="uploading" class="upload-progress">
                    <el-progress
                      :percentage="uploadProgress"
                      :status="uploadStatus"
                    />
                  </div>
                </div>
              </div>

              <!-- 右侧存储桶信息 -->
              <div class="bucket-info" v-if="currentBucket">
                <h3 class="info-title">存储桶信息</h3>
                <el-descriptions :column="1" border>
                  <el-descriptions-item label="存储桶名称">
                    <div class="editable-item">
                      <div class="name-container">
                        <div
                          class="input-wrapper"
                          :class="{ 'is-editing': isEditingName }"
                        >
                          <div class="text-content">
                            {{ editingBucket.name || currentBucket.name }}
                          </div>
                          <el-input
                            v-show="isEditingName"
                            v-model="editingBucket.name"
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
                  <el-descriptions-item label="访问权限">
                    <el-select
                      v-model="editingBucket.authority"
                      size="small"
                      style="width: 100%"
                    >
                      <el-option
                        v-for="(text, value) in authorityOptions"
                        :key="value"
                        :label="text"
                        :value="Number(value)"
                      >
                        <el-tag
                          :type="getAuthorityTagType(Number(value))"
                          size="small"
                        >
                          {{ text }}
                        </el-tag>
                      </el-option>
                    </el-select>
                  </el-descriptions-item>
                  <el-descriptions-item label="存储用量">
                    {{ formatSize(currentBucket.memoryUsage) }} /
                    {{ formatSize(currentBucket.maxMemory) }}
                    <el-progress
                      :percentage="
                        Math.round(
                          (currentBucket.memoryUsage /
                            currentBucket.maxMemory) *
                            100
                        )
                      "
                      :status="
                        getUsageStatus(
                          currentBucket.memoryUsage,
                          currentBucket.maxMemory
                        )
                      "
                      style="margin-top: 8px"
                    />
                  </el-descriptions-item>
                  <el-descriptions-item label="创建时间">
                    {{ formatDateTime(currentBucket.createTime) }}
                  </el-descriptions-item>
                </el-descriptions>

                <!-- 保存按钮 -->
                <div class="bucket-actions">
                  <el-button
                    type="primary"
                    size="small"
                    :loading="updating"
                    :disabled="!isEdited"
                    @click="updateBucketInfo"
                  >
                    保存变更
                  </el-button>
                </div>
              </div>
            </div>
          </el-footer>
        </el-container>
      </el-container>
    </el-container>
    <!-- 回收站文件弹窗 -->
<el-dialog
      v-model="recyclingStation"
      title="文件回收站"
      @closed="getFileList"
      :close-on-click-modal="true"
    >
            <el-empty
                description="回收站为空"
                v-if="deleteFileList === null || deleteFileList.length === 0"
              />
    <el-table
                :data="deleteFileList"
                style="width: 90vh; height: 40vh"
                v-else
              >
                <el-table-column type="selection" width="55" />
                <el-table-column prop="name" label="文件名" />
                <el-table-column prop="fileSize" label="大小" width="120">
                  <template #default="scope">
                    {{ formatSize(scope.row.fileSize) }}
                  </template>
                </el-table-column>

                <el-table-column
                  prop="updateTime"
                  label="删除时间"
                  width="180"
                />
                <el-table-column label="操作" width="200" fixed="right">
                  <template #default="scope">
                    
                    <!-- 恢复 -->
                    <el-button
                      link
                      type="primary"
                      @click="recoverFile(scope.row)"
                      :icon="Refresh"
                      >恢复</el-button
                    >
                    <!-- 删除 -->
                    <el-button
                      link
                      type="danger"
                      @click="deleteFilePermanent(scope.row)"
                      :icon="Delete"
                      >永久删除</el-button
                    >
                  </template>
                </el-table-column>
              </el-table>
            <div
                class="pagination"
                v-if="deleteFileList != null && deleteFileList.length > 0"
              >
                <el-pagination
                  v-model:current-page="deleteCurrentPage"
                  v-model:page-size="deletePageSize"
                  :page-sizes="[10, 20, 50, 100]"
                  :total="deleteTotal"
                  layout="total, sizes, prev, pager, next, jumper"
                  @size-change="handleDeleteSizeChange"
                  @current-change="handleDeleteCurrentChange"
                  background
                />
              </div>
    </el-dialog>
    <!-- 创建存储桶弹窗 -->
    <el-dialog
      v-model="createBucketDialogVisible"
      title="创建存储桶"
      width="30%"
      :close-on-click-modal="false"
    >
      <el-form
        ref="createBucketFormRef"
        :model="createBucketForm"
        :rules="createBucketRules"
        label-width="100px"
      >
        <el-form-item label="存储桶名称" prop="name">
          <el-input
            v-model="createBucketForm.name"
            placeholder="请输入存储桶名称"
          />
        </el-form-item>
        <el-form-item label="访问权限" prop="authority">
          <el-radio-group v-model="createBucketForm.authority">
            <el-radio :label="0">公共读</el-radio>
            <el-radio :label="1">公共读写</el-radio>
            <el-radio :label="2">禁止对外开放</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createBucketDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="createBucket" :loading="creating">
            创建
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 文件权限更改弹窗 -->
    <el-dialog
      v-model="authorityDialogVisible"
      title="更改文件权限"
      width="500px"
      :close-on-click-modal="false"
      class="authority-dialog"
    >
      <div class="authority-info">
        <div class="file-basic-info">
          <el-icon class="file-icon">
            <component :is="getFileIcon(currentEditingFile?.name)" />
          </el-icon>
          <div class="file-details">
            <div class="file-name" :title="currentEditingFile?.name">
              {{ currentEditingFile?.name }}
            </div>
            <div class="file-time">
              上次修改时间：{{ formatDateTime(currentEditingFile?.updateTime) }}
            </div>
          </div>
        </div>

        <div class="authority-select-container">
          <div class="select-header">选择对外权限</div>
          <div class="select-content">
            <el-radio-group
              v-model="selectedAuthority"
              class="authority-radio-group"
            >
              <el-radio :label="0" class="authority-radio">
                <div class="radio-content">
                  <el-tag type="warning" size="small" effect="light"
                    >公共读</el-tag
                  >
                  <div class="radio-desc">其他用户仅可以查看和下载文件</div>
                </div>
              </el-radio>
              <el-radio :label="1" class="authority-radio">
                <div class="radio-content">
                  <el-tag type="success" size="small" effect="light"
                    >公共读写</el-tag
                  >
                  <div class="radio-desc">其他用户可以查看、下载和修改文件</div>
                </div>
              </el-radio>
              <el-radio :label="2" class="authority-radio">
                <div class="radio-content">
                  <el-tag type="info" size="small" effect="light"
                    >禁止对外开放</el-tag
                  >
                  <div class="radio-desc">仅自己可以访问此文件</div>
                </div>
              </el-radio>
            </el-radio-group>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="authorityDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="updateFileAuthority"
            >确定</el-button
          >
        </span>
      </template>
    </el-dialog>

    <!-- 分享弹窗 -->
    <el-dialog
      v-model="shareDialogVisible"
      title="分享文件"
      width="500px"
      :close-on-click-modal="false"
      class="share-dialog"
    >
      <div class="share-info">
        <div class="file-basic-info">
          <el-icon class="file-icon">
            <component :is="getFileIcon(currentShareFile?.name)" />
          </el-icon>
          <div class="file-details">
            <div class="file-name" :title="currentShareFile?.name">
              {{ currentShareFile?.name }}
            </div>
            <div class="file-authority">
              <el-tag
                :type="getAuthorityTagType(currentShareFile?.authority)"
                size="small"
                effect="light"
              >
                {{ getAuthorityText(currentShareFile?.authority) }}
              </el-tag>
            </div>
          </div>
        </div>

        <div class="share-link-container">
          <div class="link-header">分享链接</div>
          <div class="link-content">
            <el-input
              v-model="shareLink"
              readonly
              size="large"
              :value="`localhost:8080/share?fileId=${currentShareFile?.id}`"
            >
              <template #append>
                <el-button type="primary" @click="copyShareLink">
                  <el-icon><DocumentCopy /></el-icon>
                  复制链接
                </el-button>
              </template>
            </el-input>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="shareDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

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
            <component :is="getFileIcon(currentDownloadFile?.name)" />
          </el-icon>
          <div class="file-details">
            <div class="file-name" :title="currentDownloadFile?.name">
              {{ currentDownloadFile?.name }}
            </div>
            <div class="file-size">
              文件大小：{{ formatSize(currentDownloadFile?.fileSize) }}
            </div>
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
          <el-button
            @click="downloadDialogVisible = false"
            :disabled="downloading"
            >取消</el-button
          >
          <el-button
            type="primary"
            @click="downloadFile"
            :loading="downloading"
          >
            {{ downloading ? "下载中..." : "确认下载" }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, watch, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Search,
  Plus,
  Folder,
  Download,
  Delete,
  UploadFilled,
  Edit,
  User,
  Lock,
  SwitchButton,
  Share,
  Refresh,
  DocumentCopy,
  Document,
  Picture,
  VideoCamera,
  Headset,
  Files,
  Warning,
} from "@element-plus/icons-vue";
import fileApi from "@/api/file/fileApi";
import bucketApi from "@/api/bucket/bucketApi";
import accountApi from "@/api/user/accountApi";
import loginApi from "@/api/user/loginApi";
import dayjs from "dayjs";
import { useRouter } from "vue-router";

const searchKeyword = ref("");
const uploadRef = ref(null);
const uploadFileList = ref([]);
const fileList = ref([]); // 文件列表数据
const deleteFileList = ref([]); // 回收站文件列表
const uploading = ref(false);
const uploadProgress = ref(0);
const uploadStatus = ref("");
const bucketList = ref([]);
const userInfo = ref({});
const currentBucket = ref(null);

// 创建存储桶相关
const recyclingStation =  ref(false);
const createBucketDialogVisible = ref(false);
const createBucketFormRef = ref(null);
const creating = ref(false);

const createBucketForm = reactive({
  name: "",
  authority: 2, // 默认禁止对外开放
});

const createBucketRules = {
  name: [
    { required: true, message: "请输入存储桶名称", trigger: "blur" },
    { min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" },
  ],
  authority: [{ required: true, message: "请选择访问权限", trigger: "change" }],
};

const beforeUpload = (file) => {
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.error("文件大小不能超过 10MB");
    return false;
  }
  return true;
};

const handleChange = (uploadFile, uploadFiles) => {
  console.log("Current file:", uploadFile);
  console.log("All files:", uploadFiles);
  uploadFileList.value = uploadFiles;
  uploadFile.status = "pending"; // 设置初始状态为待上传
};

const uploadFiles = async () => {
  if (uploadFileList.value.length === 0) {
    ElMessage.warning("请先选择要上传的文件");
    return;
  }

  uploading.value = true;
  uploadProgress.value = 0;
  uploadStatus.value = "";
  const totalFiles = uploadFileList.value.filter(
    (file) => file.status !== "success"
  ).length;
  let completedFiles = 0;
  const progressPerFile = 100 / totalFiles;
  let progressTimer = null;

  const simulateProgress = (startProgress, endProgress) => {
    let currentProgress = startProgress;
    progressTimer = setInterval(() => {
      if (currentProgress < endProgress - 1) {
        currentProgress += 0.5;
        uploadProgress.value = Math.round(currentProgress);
      } else {
        clearInterval(progressTimer);
      }
    }, 100);
  };

  try {
    for (let file of uploadFileList.value) {
      if (file.status === "success") continue; // 跳过已上传的文件

      file.status = "uploading";
      const formData = new FormData();
      formData.append("file", file.raw);
      formData.append("bucketId", currentBucket.value.id);

      // 开始模拟当前文件的进度
      const currentStartProgress = completedFiles * progressPerFile;
      const currentEndProgress = (completedFiles + 1) * progressPerFile;
      simulateProgress(currentStartProgress, currentEndProgress - 1);
      console.log("upload time: ",new Date().getTime())

      try {
        const response = await fileApi.uploadSingleFileApi(formData);
        console.log("Upload response:", response);

        // 清除进度模拟定时器
        if (progressTimer) {
          clearInterval(progressTimer);
          progressTimer = null;
        }

        if (response.data.status === 200) {
          file.status = "success";
          completedFiles++;
          // 文件上传完成，直接设置到对应进度
          uploadProgress.value = Math.round(completedFiles * progressPerFile);
          ElMessage.success(`${file.name} 上传成功`);
        } else {
          file.status = "error";
          ElMessage.error(`${file.name} 上传失败`);
        }
      } catch (error) {
        // 清除进度模拟定时器
        if (progressTimer) {
          clearInterval(progressTimer);
          progressTimer = null;
        }
        console.error("Upload error:", error);
        file.status = "error";
        ElMessage.error(`${file.name} 上传失败`);
      }
    }

    // 所有文件上传完成后的处理
    if (uploadFileList.value.every((file) => file.status === "success")) {
      uploadStatus.value = "success";
      uploadProgress.value = 100;

      // 清除已上传成功的文件
      uploadFileList.value = uploadFileList.value.filter(
        (file) => file.status !== "success"
      );

      // 刷新存储桶信息和文件列表
      await Promise.all([getBucketInfo(), getFileList()]);
    } else if (uploadFileList.value.some((file) => file.status === "error")) {
      uploadStatus.value = "exception";
      // 只保留上传失败的文件
      uploadFileList.value = uploadFileList.value.filter(
        (file) => file.status === "error"
      );
    }
  } finally {
    // 清除可能存在的定时器
    if (progressTimer) {
      clearInterval(progressTimer);
      progressTimer = null;
    }
    if (uploadProgress.value < 100) {
      uploadStatus.value = "exception";
    }
    uploading.value = false;
  }
};

const clearFiles = () => {
  if (uploading.value) {
    ElMessage.warning("文件正在上传中，请等待上传完成");
    return;
  }
  if (uploadRef.value) {
    uploadRef.value.clearFiles();
  }
  uploadFileList.value = [];
};

const handleSuccess = (response, uploadFile) => {
  console.log("Upload success:", response);
  uploadFile.status = "success";
};

const handleError = (error, uploadFile) => {
  console.error("Upload error:", error);
  uploadFile.status = "error";
};

// 添加文件状态处理函数
const getStatusType = (status) => {
  switch (status) {
    case "success":
      return "success";
    case "uploading":
      return "warning";
    case "error":
      return "danger";
    default:
      return "info";
  }
};

const getStatusText = (status) => {
  switch (status) {
    case "success":
      return "已上传";
    case "uploading":
      return "上传中";
    case "error":
      return "上传失败";
    default:
      return "待上传";
  }
};

// 添加删除单个文件的方法
const removeFile = (index) => {
  if (uploading.value) {
    ElMessage.warning("文件正在上传中，无法删除");
    return;
  }
  const file = uploadFileList.value[index];
  if (uploadRef.value) {
    uploadRef.value.handleRemove(file);
  }
  uploadFileList.value.splice(index, 1);
};

// 获取存储桶列表
const getBucketList = async () => {
  try {
    const response = await bucketApi.getBucketListApi();
    if (response.data.status === 200) {
      bucketList.value = response.data.data || [];
      // 如果有存储桶，默认选择第一个
      if (bucketList.value.length > 0) {
        currentBucket.value = bucketList.value[0];
        // 获取当前存储桶的文件列表
        await getFileList();
      }
    }
  } catch (error) {
    console.error("获取存储桶列表失败:", error);
    ElMessage.error("获取存储桶列表失败");
  }
};

// 获取用户信息
const getUserInfo = async () => {
  try {
    const response = await accountApi.getUserInfoApi();
    if (response.data.status === 200) {
      userInfo.value = response.data.data || {};
    }
  } catch (error) {
    console.error("获取用户信息失败:", error);
    ElMessage.error("获取用户信息失败");
  }
};

// 切换存储桶
const switchBucket = async (bucket) => {
  // 重置编辑状态
  isEditingName.value = false;
  editingBucket.name = bucket.name;
  editingBucket.authority = bucket.authority;

  currentBucket.value = bucket;
  currentPage.value = 1;
  pageSize.value = 10;
  await getFileList();
};

// 监听当前存储桶变化，更新编辑表单
watch(
  currentBucket,
  (newBucket) => {
    if (newBucket) {
      isEditingName.value = false;
      editingBucket.name = newBucket.name;
      editingBucket.authority = newBucket.authority;
    }
  },
  { immediate: true }
);

// 分页相关
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 回收站分页
const deleteCurrentPage = ref(1);
const deletePageSize = ref(10);
const deleteTotal = ref(0);

// 搜索文件
const searchFile = () => {
  currentPage.value = 1
  getFileList()
}

// 获取文件列表
const getFileList = async () => {
  if (!currentBucket.value) return;
  try {
    // 这里需要调用获取文件列表的API，传入当前存储桶ID和分页参数
    const response = await fileApi.getFileListApi({
      bucketId: currentBucket.value.id,
      page: currentPage.value,
      pageSize: pageSize.value,
      name: searchKeyword.value
    });
    if (response.data.status === 200) {
      fileList.value = response.data.data.records || [];
      total.value = response.data.data.total || 0;
    }
  } catch (error) {
    console.error("获取文件列表失败:", error);
    ElMessage.error("获取文件列表失败");
  }
};

// 获取回收站文件列表
const getDeleteFileList = async () => {
  try {
    // 这里需要调用获取文件列表的API，传入当前存储桶ID和分页参数
    const response = await fileApi.getDeleteFileListApi({
      page: deleteCurrentPage.value,
      pageSize: deletePageSize.value,
    });
    if (response.data.status === 200) {
      deleteFileList.value = response.data.data.records || [];
      deleteTotal.value = response.data.data.total || 0;
    }
  } catch (error) {
    console.error("获取回收站文件列表失败:", error);
    ElMessage.error("获取回收站文件列表失败");
  }
};

// 处理页码改变
const handleCurrentChange = (val) => {
  currentPage.value = val;
  getFileList();
};

// 处理每页条数改变
const handleSizeChange = (val) => {
  pageSize.value = val;
  currentPage.value = 1; // 重置为第一页
  getFileList();
};

// 回收站处理页码改变
const handleDeleteCurrentChange = (val) => {
  currentPage.value = val;
  getDeleteFileList();
};

// 回收站处理每页条数改变
const handleDeleteSizeChange = (val) => {
  pageSize.value = val;
  currentPage.value = 1; // 重置为第一页
  getDeleteFileList();
};

// 下载相关
const downloadDialogVisible = ref(false);
const currentDownloadFile = ref(null);
const downloadProgress = ref(0);
const downloading = ref(false);

// 打开下载弹窗
const showDownloadDialog = (file) => {
  currentDownloadFile.value = file;
  downloadDialogVisible.value = true;
  downloadProgress.value = 0;
};

// 下载文件
const downloadFile = async () => {
  if (!currentDownloadFile.value) return;

  downloading.value = true;
  downloadProgress.value = 0;

  try {
    const response = await fileApi.downloadFileApi(
      currentDownloadFile.value.id,
      {
        onDownloadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          downloadProgress.value = percentCompleted;
        },
        responseType: "blob",
      }
    );

    // 从响应头获取文件名
    const contentDisposition = response.headers["content-disposition"];
    const fileNameMatch = contentDisposition.match(/filename="?(.+?)"?(;|$)/i);
    const fileName = decodeURIComponent(
      fileNameMatch ? fileNameMatch[1] : currentDownloadFile.value.name
    );

    // 创建 Blob 并触发下载
    const blob = new Blob([response.data]);
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(link.href);

    ElMessage.success("下载成功");
    // 0.2秒后关闭弹窗
    setTimeout(() => {
      downloadDialogVisible.value = false;
      downloading.value = false;
      downloadProgress.value = 0;
    }, 200);
  } catch (error) {
    downloading.value = false;
    downloadProgress.value = 0;
    if (error.response) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const errorData = JSON.parse(reader.result);
          ElMessage.error(`下载失败：${errorData.message}`);
        } catch (e) {
          ElMessage.error("下载失败");
        }
      };
      reader.readAsText(error.response.data);
    } else {
      ElMessage.error("下载失败：" + error.message);
    }
  }
};

// 显示回收站弹窗
const showRecyclingStationDialog = () => {
  recyclingStation.value = true;
  getDeleteFileList();
};

// 显示创建存储桶弹窗
const showCreateBucketDialog = () => {
  createBucketDialogVisible.value = true;
  createBucketForm.name = "";
  createBucketForm.authority = 2;
};

// 创建存储桶
const createBucket = async () => {
  if (!createBucketFormRef.value) return;

  await createBucketFormRef.value.validate(async (valid) => {
    if (valid) {
      creating.value = true;
      try {
        const response = await bucketApi.createBucketApi(createBucketForm);
        if (response.data.status === 200) {
          ElMessage.success("创建成功");
          createBucketDialogVisible.value = false;
          // 刷新存储桶列表
          await getBucketList();
        }
      } catch (error) {
        console.error("创建存储桶失败:", error);
        ElMessage.error("创建存储桶失败");
      } finally {
        creating.value = false;
      }
    }
  });
};

// 格式化权限显示
const getAuthorityText = (authority) => {
  switch (authority) {
    case 0:
      return "公共读";
    case 1:
      return "公共读写";
    case 2:
      return "禁止对外开放";
    default:
      return "未知";
  }
};

const getAuthorityTagType = (authority) => {
  switch (authority) {
    case 0:
      return "warning";
    case 1:
      return "success";
    case 2:
      return "info";
    default:
      return "info";
  }
};

// 格式化存储大小
const formatSize = (bytes) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// 格式化时间
const formatDateTime = (time) => {
  return time ? dayjs(time).format("YYYY-MM-DD HH:mm:ss") : "-";
};

// 获取使用率状态
const getUsageStatus = (used, max) => {
  const percentage = (used / max) * 100;
  if (percentage >= 90) return "exception";
  if (percentage >= 70) return "warning";
  return "success";
};

// 权限选项
const authorityOptions = {
  0: "公共读",
  1: "公共读写",
  2: "禁止对外开放",
};

// 编辑相关
const updating = ref(false);
const isEditingName = ref(false);
const editingBucket = reactive({
  name: "",
  authority: 2,
});

// 切换名称编辑状态
const toggleNameEdit = () => {
  isEditingName.value = !isEditingName.value;
  if (isEditingName.value) {
    editingBucket.name = currentBucket.value.name;
  }
};

// 更新存储桶信息
const updateBucketInfo = async () => {
  if (!currentBucket.value || !isEdited.value) return;

  updating.value = true;
  try {
    const response = await bucketApi.updateBucketApi({
      id: currentBucket.value.id,
      name: editingBucket.name,
      authority: editingBucket.authority,
    });

    if (response.data.status === 200) {
      ElMessage.success("更新成功");
      isEditingName.value = false; // 关闭名称编辑状态
      await getBucketList();
    }
  } catch (error) {
    console.error("更新存储桶信息失败:", error);
    ElMessage.error("更新失败");
  } finally {
    updating.value = false;
  }
};

// 判断是否有修改
const isEdited = computed(() => {
  if (!currentBucket.value) return false;
  return (
    editingBucket.name !== currentBucket.value.name ||
    editingBucket.authority !== currentBucket.value.authority
  );
});

// 退出登录
const handleLogout = async () => {
  // 调用退出登录API
  try {
    const response = await loginApi.logoutApi();
    if (response.data.status === 200) {
      // 清除本地存储的token
      localStorage.removeItem("token");
      ElMessage.success("退出成功");
      // 跳转到登录页
      router.push("/");
    } else {
      ElMessage.error("退出失败");
    }
  } catch (error) {
    console.error("退出登录失败:", error);
    ElMessage.error("退出登录失败");
  }
};

// 获取存储桶信息
const getBucketInfo = async () => {
  if (!currentBucket.value) return;
  try {
    const response = await bucketApi.getBucketInfoApi(currentBucket.value.id);
    if (response.data.status === 200) {
      currentBucket.value = response.data.data;
      // 同步编辑表单数据
      editingBucket.name = currentBucket.value.name;
      editingBucket.authority = currentBucket.value.authority;
    }
  } catch (error) {
    console.error("获取存储桶信息失败:", error);
    ElMessage.error("获取存储桶信息失败");
  }
};

// 页面加载时获取数据
onMounted(async () => {
  await Promise.all([getBucketList(), getUserInfo()]);
});

const router = useRouter();

// 文件权限更改相关
const authorityDialogVisible = ref(false);
const currentEditingFile = ref(null);
const selectedAuthority = ref(null);

// 打开权限更改弹窗
const changeAuthority = (file) => {
  currentEditingFile.value = file;
  selectedAuthority.value = file.authority;
  authorityDialogVisible.value = true;
};

// 更新文件权限
const updateFileAuthority = async () => {
  try {
    const response = await fileApi.updateAuthorityApi({
      id: currentEditingFile.value.id,
      authority: selectedAuthority.value,
    });

    if (response.data.status === 200) {
      ElMessage.success("权限更改成功");
      // 关闭弹窗
      authorityDialogVisible.value = false;
      // 刷新文件列表
      await getFileList();
    } else {
      ElMessage.error("权限更改失败");
    }
  } catch (error) {
    console.error("更新文件权限失败:", error);
    ElMessage.error("权限更改失败");
  }
};

// 分享相关
const shareDialogVisible = ref(false);
const currentShareFile = ref(null);

// 打开分享弹窗
const shareFile = (file) => {
  currentShareFile.value = file;
  shareDialogVisible.value = true;
};

// 复制分享链接
const copyShareLink = () => {
  const shareLink = `localhost:8080/#/share?fileId=${currentShareFile.value.id}`;
  navigator.clipboard
    .writeText(shareLink)
    .then(() => {
      ElMessage.success("链接已复制到剪贴板");
    })
    .catch(() => {
      ElMessage.error("复制失败");
    });
};

// 添加获取文件图标的方法
const getFileIcon = (fileName) => {
  if (!fileName) return Document;

  const extension = fileName.split(".").pop()?.toLowerCase();

  // 图片文件
  if (["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"].includes(extension)) {
    return Picture;
  }

  // 视频文件
  if (["mp4", "avi", "mov", "wmv", "flv", "mkv"].includes(extension)) {
    return VideoCamera;
  }

  // 音频文件
  if (["mp3", "wav", "ogg", "aac", "wma", "m4a"].includes(extension)) {
    return Headset;
  }

  // 压缩文件
  if (["zip", "rar", "7z", "tar", "gz"].includes(extension)) {
    return Files;
  }

  // 文档文件
  if (
    ["doc", "docx", "pdf", "txt", "xls", "xlsx", "ppt", "pptx"].includes(
      extension
    )
  ) {
    return Document;
  }

  return Document;
};

// 在 script 部分添加 goToUserCenter 方法
const goToUserCenter = () => {
  router.push("/user/center");
};

// 删除文件
const deleteFile = (file) => {
  ElMessageBox.confirm(`确定要删除文件 "${file.name}" 吗？`, "删除确认", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
    icon: Warning,
  })
    .then(async () => {
      try {
        const response = await fileApi.deleteFileApi(file.id);
        if (response.data.status === 200) {
          ElMessage.success("删除成功");
          // 刷新文件列表
          await getFileList();
        } else {
          ElMessage.error(response.data.message || "删除失败");
        }
      } catch (error) {
        console.error("删除文件失败:", error);
        ElMessage.error("删除失败");
      }
    })
    .catch(() => {
      // 用户点击取消，不做任何操作
    });
};

// 永久删除回收站文件
const deleteFilePermanent = (file) => {
  ElMessageBox.confirm(`确定要删除文件 "${file.name}" 吗？`, "删除确认", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
    icon: Warning,
  })
    .then(async () => {
      try {
        const response = await fileApi.deleteFilePermanentApi(file.id);
        if (response.data.status === 200) {
          ElMessage.success("删除成功");
          // 刷新文件列表
          await getDeleteFileList();
        } else {
          ElMessage.error(response.data.message || "删除失败");
        }
      } catch (error) {
        console.error("删除文件失败:", error);
        ElMessage.error("删除失败");
      }
    })
    .catch(() => {
      // 用户点击取消，不做任何操作
    });
};

const recoverFile = (file) => {
  ElMessageBox.confirm(`确定要恢复文件 "${file.name}" 吗？`, "恢复确认", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
    icon: Warning,
  })
    .then(async () => {
      try {
        const response = await fileApi.recoverFileApi(file.id);
        if (response.data.status === 200) {
          ElMessage.success("恢复成功");
          // 刷新文件列表
          await getDeleteFileList();
        } else {
          ElMessage.error(response.data.message || "恢复失败");
        }
      } catch (error) {
        console.error("恢复文件失败:", error);
        ElMessage.error("恢复失败");
      }
    })
    .catch(() => {
      // 用户点击取消，不做任何操作
    });
};

// 在 script setup 部分添加 goToSecurity 方法
const goToSecurity = () => {
  router.push("/user/security");
};
</script>

<style lang="scss" scoped>
.common-layout {
  height: 100vh;
  .el-container {
    height: 100%;
  }
}

.header-content {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .header-left {
    display: flex;
    align-items: center;
    .logo {
      width: 40px;
      margin-right: 10px;
    }
    .app-name {
      font-size: 20px;
      font-weight: bold;
      color: var(--el-color-primary);
    }
  }

  .header-center {
    width: 400px;
  }

  .header-right {
    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;

      .username {
        font-size: 14px;
        color: var(--el-text-color-primary);
      }

      .el-avatar {
        cursor: pointer;
        border: 2px solid var(--el-border-color-lighter);
        transition: all 0.3s;

        &:hover {
          border-color: var(--el-color-primary);
          transform: translateY(-2px);
        }
      }
    }
  }
}

.aside-content {
  padding: 20px 0;

  .bucket-header {
    padding: 0 20px;
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    span {
      font-size: 16px;
      font-weight: bold;
    }
  }

  .bucket-menu {
    border-right: none;
  }
}

.main-content {
  height: calc(100vh - 500px); // 调整为480px，给更多空间

  :deep(.el-table) {
    height: 100%;

    .el-table__body-wrapper {
      overflow-y: auto;

      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-thumb {
        border-radius: 3px;
        background-color: var(--el-border-color);

        &:hover {
          background-color: var(--el-border-color-darker);
        }
      }

      &::-webkit-scrollbar-track {
        background-color: var(--el-fill-color-lighter);
        border-radius: 3px;
      }
    }
  }
}

.footer-container {
  display: flex;
  gap: 20px;
  padding: 20px;
  min-height: 170px;
  max-height: 325px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.upload-area {
  flex: 7; // 占据70%的空间
  display: flex;
  flex-direction: column;
  gap: 20px;

  .upload-container {
    display: flex;
    gap: 20px;
    min-height: 200px;

    &.has-files {
      .upload-file-list {
        flex: 5; // 有文件时，文件列表占据4份
        min-width: 0;
        border: 1px solid var(--el-border-color-lighter);
        border-radius: 4px;
        overflow: hidden;
      }

      .upload-dragger-container {
        flex: 2; // 有文件时，上传区域占据3份
      }
    }
  }

  .upload-dragger-container {
    flex: 1; // 无文件时独占整个空间
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 4px;
    padding: 20px;
    display: flex;
    align-items: center;
    justify-content: center;

    .upload-dragger {
      width: 100%;

      :deep(.el-upload) {
        width: 100%;
      }

      :deep(.el-upload-dragger) {
        width: 100%;
        height: 160px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }
    }
  }
}

.bucket-info {
  flex: 3; // 占据30%的空间
  padding: 20px;
  background-color: var(--el-bg-color-page);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);

  .info-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .info-title {
      margin: 0;
    }
  }

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

  .bucket-actions {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  :deep(.el-descriptions__cell) {
    padding: 12px 16px;
  }
}

.upload-file-list {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  overflow: hidden;
  max-height: 235px;

  :deep(.el-table) {
    --el-table-border-color: var(--el-border-color-lighter);

    th.el-table__cell {
      background-color: var(--el-fill-color-light);
    }

    .el-table__body-wrapper {
      overflow-y: auto;
      max-height: 195px; /* 减去表头高度 */

      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-thumb {
        border-radius: 3px;
        background-color: var(--el-border-color);

        &:hover {
          background-color: var(--el-border-color-darker);
        }
      }

      &::-webkit-scrollbar-track {
        background-color: var(--el-fill-color-lighter);
        border-radius: 3px;
      }
    }
  }
}

.upload-dragger {
  width: 100%;
}

:deep(.el-upload-dragger) {
  width: 100%;
  height: 160px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

:deep(.el-icon--upload) {
  margin-bottom: 8px;
}

:deep(.el-upload__tip) {
  margin-top: 8px;
  color: #909399;
  font-size: 12px;
}

.upload-actions {
  margin: 20px 0;
  display: flex;
  gap: 16px;
  justify-content: center;

  .el-button {
    min-width: 120px;

    .el-icon {
      margin-right: 8px;
    }
  }
}

.upload-progress {
  margin-top: 20px;
}

// Element Plus 组件样式覆盖
:deep(.el-header) {
  background-color: white;
  border-bottom: 1px solid var(--el-border-color-lighter);
  padding: 0 20px;
}

:deep(.el-aside) {
  background-color: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-lighter);
}

:deep(.el-main) {
  padding: 20px;
  background-color: var(--el-bg-color-page);
}

:deep(.el-footer) {
  padding: 0;
  background-color: white;
}

.bucket-menu {
  .el-menu-item {
    .bucket-usage {
      margin-left: 8px;
      width: 60px;
    }
  }
}

:deep(.el-dropdown-menu) {
  padding: 4px 0;
  margin-top: 4px;

  .el-dropdown-menu__item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    line-height: 1.5;

    .el-icon {
      margin-right: 4px;
      font-size: 16px;
    }

    &:hover {
      background-color: var(--el-dropdown-menuItem-hover-fill);
      color: var(--el-dropdown-menuItem-hover-color);
    }

    &.el-dropdown-menu__item--divided {
      border-top-color: var(--el-border-color-lighter);
      margin-top: 4px;
      padding-top: 12px;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-dialog__body) {
  padding: 20px 40px;
}

.authority-dialog {
  :deep(.el-dialog__header) {
    margin-right: 0;
    padding: 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  :deep(.el-dialog__body) {
    padding: 0;
  }

  :deep(.el-dialog__footer) {
    padding: 20px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}

.authority-info {
  .file-basic-info {
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    background-color: var(--el-bg-color);
    border-bottom: 1px solid var(--el-border-color-lighter);

    .file-icon {
      font-size: 40px;
      color: var(--el-color-primary);
    }

    .file-details {
      flex: 1;
      min-width: 0;

      .file-name {
        font-size: 16px;
        font-weight: 500;
        color: var(--el-text-color-primary);
        margin-bottom: 8px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .file-time {
        font-size: 13px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .authority-select-container {
    padding: 24px;

    .select-header {
      font-size: 14px;
      color: var(--el-text-color-secondary);
      margin-bottom: 16px;
    }

    .authority-radio-group {
      display: flex;
      flex-direction: column;
      gap: 16px;

      .authority-radio {
        margin: 0;
        padding: 16px;
        border-radius: 4px;
        border: 1px solid var(--el-border-color-lighter);
        transition: all 0.3s;

        &:hover {
          border-color: var(--el-color-primary-light-7);
        }

        &.is-checked {
          border-color: var(--el-color-primary);
          background-color: var(--el-color-primary-light-9);
        }

        .radio-content {
          margin-left: 24px;

          .el-tag {
            margin-bottom: 8px;
          }

          .radio-desc {
            color: var(--el-text-color-secondary);
            font-size: 13px;
          }
        }
      }
    }
  }
}

.share-dialog {
  :deep(.el-dialog__header) {
    margin-right: 0;
    padding: 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  :deep(.el-dialog__body) {
    padding: 0;
  }

  :deep(.el-dialog__footer) {
    padding: 20px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}

.share-info {
  .file-basic-info {
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    background-color: var(--el-bg-color);
    border-bottom: 1px solid var(--el-border-color-lighter);

    .file-icon {
      font-size: 40px;
      color: var(--el-color-primary);
    }

    .file-details {
      flex: 1;
      min-width: 0;

      .file-name {
        font-size: 16px;
        font-weight: 500;
        color: var(--el-text-color-primary);
        margin-bottom: 8px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }

  .share-link-container {
    padding: 24px;

    .link-header {
      font-size: 14px;
      color: var(--el-text-color-secondary);
      margin-bottom: 12px;
    }

    .link-content {
      :deep(.el-input-group__append) {
        padding: 0;

        .el-button {
          height: 40px;
          padding: 0 30px;
          border: none;

          .el-icon {
            margin-right: 4px;
          }
        }
      }

      :deep(.el-input__wrapper) {
        padding: 8px 12px;
      }
    }
  }
}

.pagination {
  margin: 20px 0;
  display: flex;
  justify-content: flex-end;
  padding-right: 20px;

  :deep(.el-pagination) {
    margin-right: 0;
    justify-content: flex-end;
    white-space: nowrap;
  }
}

.download-dialog {
  :deep(.el-dialog__header) {
    margin-right: 0;
    padding: 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  :deep(.el-dialog__body) {
    padding: 0;
  }

  :deep(.el-dialog__footer) {
    padding: 20px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}

.download-info {
  .file-basic-info {
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    background-color: var(--el-bg-color);
    border-bottom: 1px solid var(--el-border-color-lighter);

    .file-icon {
      font-size: 40px;
      color: var(--el-color-primary);
    }

    .file-details {
      flex: 1;
      min-width: 0;

      .file-name {
        font-size: 16px;
        font-weight: 500;
        color: var(--el-text-color-primary);
        margin-bottom: 8px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .file-size {
        font-size: 13px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .download-progress {
    padding: 24px;

    :deep(.el-progress) {
      margin-bottom: 0;
    }
  }
}
</style>

