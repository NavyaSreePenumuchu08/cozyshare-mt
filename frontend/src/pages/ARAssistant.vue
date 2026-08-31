<template>
  <section class="ar-assistant">
    <div class="ar-header">
      <div>
        <h2>AR Household Assistant</h2>
        <p class="subtitle">Capture a household area and let CozyShare generate a smart task 📷</p>
      </div>
    </div>

    <div class="assistant-layout">
      <div class="card camera-card">
        <div class="card-header">
          <h3>Capture Household Area</h3>
          <span class="ar-badge">Camera</span>
        </div>

        <p class="small-subtitle">
          Take a photo of dirty dishes, laundry, trash, plants, or another household situation.
        </p>

        <div v-if="liveMode" class="live-camera-wrapper">
          <video ref="liveVideo" class="live-video" autoplay muted playsinline></video>

          <canvas ref="liveCanvas" class="hidden-canvas"></canvas>

          <div class="live-status">
            <span class="live-dot"></span>
            LIVE AR
          </div>

          <div v-if="analysisResult" class="live-ar-overlay">
            <div class="live-overlay-top">
              <span>AI Vision</span>

              <strong> {{ Math.round((analysisResult.confidence || 0) * 100) }}% </strong>
            </div>

            <p>
              {{ analysisResult.description }}
            </p>

            <div v-if="analysisResult.suggestedAction" class="live-action">
              ✨ {{ analysisResult.suggestedAction }}
            </div>
          </div>
        </div>

        <div v-if="!liveMode && !imagePreview" class="camera-empty">
          <span class="camera-icon">📷</span>
          <p>No image selected</p>
          <span class="empty-note">
            Use your phone camera or choose an image from your device.
          </span>
        </div>

        <div v-else-if="!liveMode" class="image-preview-wrapper">
          <img :src="imagePreview" alt="Selected household area" class="image-preview" />

          <!-- Vision result -->
          <div v-if="analysisResult && !generatedTask" class="ar-overlay detection-overlay">
            <span class="overlay-label">Detected Situation</span>
            <strong>{{ analysisResult.description }}</strong>
          </div>

          <!-- Final AR Task Overlay -->
          <div v-if="generatedTask" class="ar-task-overlay">
            <div class="ar-task-top">
              <span class="ar-task-badge">AR Task</span>

              <span class="ar-priority-badge" :class="generatedTask.priority?.toLowerCase()">
                {{ generatedTask.priority }}
              </span>
            </div>

            <h4 class="ar-task-title">
              {{ generatedTask.title }}
            </h4>

            <div class="ar-task-info">
              <span> 📍 {{ generatedTask.location || 'General' }} </span>

              <span> 🏷 {{ generatedTask.category || 'General' }} </span>

              <span v-if="suggestedAssignee"> 👤 {{ suggestedAssignee }} </span>
            </div>

            <p v-if="assignmentReason" class="ar-assignment-reason">
              {{ assignmentReason }}
            </p>
          </div>
        </div>

        <input
          ref="cameraInput"
          class="hidden-input"
          type="file"
          accept="image/*"
          capture="environment"
          @change="handleImageSelection"
        />

        <div class="form-actions">
          <button type="button" class="btn-secondary" :disabled="!imagePreview" @click="clearImage">
            Clear
          </button>

          <button type="button" class="btn-primary" @click="openCamera">
            <span class="btn-icon">📷</span>
            Capture Image
          </button>
        </div>

        <button v-if="!liveMode" type="button" class="btn-secondary" @click="startLiveAR">
          <span class="btn-icon">🔴</span>
          Live AR Mode
        </button>

        <button v-else type="button" class="btn-secondary stop-live-btn" @click="stopLiveAR">
          <span class="btn-icon">⏹</span>
          Stop Live AR
        </button>
      </div>

      <div class="card analysis-card">
        <div class="card-header">
          <h3>Image Analysis</h3>
          <span class="count-badge">{{ analysisResult ? 1 : 0 }}</span>
        </div>

        <div v-if="!analysisResult" class="empty-state">
          <span class="empty-emoji">🔍</span>
          <p>No analysis yet</p>
          <span class="empty-note">
            Capture an image, then analyze it to generate a household task.
          </span>
        </div>

        <div v-else class="analysis-content">
          <div class="detail-row">
            <span class="detail-label">Description:</span>
            <span class="detail-value">
              {{ analysisResult.description }}
            </span>
          </div>

          <div class="detail-row">
            <span class="detail-label">Objects:</span>
            <span class="detail-value">
              {{ analysisResult.detectedObjects.join(', ') }}
            </span>
          </div>

          <div class="detail-row">
            <span class="detail-label">Confidence:</span>
            <span class="detail-value"> {{ Math.round(analysisResult.confidence * 100) }}% </span>
          </div>

          <div class="detail-row">
            <span class="detail-label">Room:</span>
            <span class="detail-value">
              {{ analysisResult.room || 'General' }}
            </span>
          </div>

          <div v-if="analysisResult.suggestedAction" class="detail-row">
            <span class="detail-label">Action:</span>
            <span class="detail-value">
              {{ analysisResult.suggestedAction }}
            </span>
          </div>

          <div class="detail-row">
            <span class="detail-label">Task needed:</span>
            <span class="detail-value">
              {{ analysisResult.taskNeeded ? 'Yes' : 'No' }}
            </span>
          </div>
        </div>

        <div class="form-actions">
          <button
            type="button"
            class="btn-secondary"
            :disabled="!analysisResult || analysisResult.taskNeeded === false || generatingTask"
            @click="generateTask"
          >
            <span class="btn-icon">🤖</span>
            {{ generatingTask ? 'Generating...' : 'Generate Task' }}
          </button>

          <button
            type="button"
            class="btn-primary"
            :disabled="!selectedImage || analyzing"
            @click="analyzeImage"
          >
            <span class="btn-icon">✨</span>
            {{ analyzing ? 'Analyzing...' : 'Analyze Image' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="generatedTask" class="card generated-task-card">
      <div class="card-header">
        <h3>AI Generated Task</h3>
        <span class="ar-badge">Smart Task</span>
      </div>

      <div class="generated-task-content">
        <div class="task-title-row">
          <h4>{{ generatedTask.title }}</h4>

          <span class="priority-badge" :class="generatedTask.priority?.toLowerCase()">
            {{ generatedTask.priority }}
          </span>
        </div>

        <div class="detail-row">
          <span class="detail-label">Description:</span>
          <span class="detail-value">
            {{ generatedTask.description }}
          </span>
        </div>

        <div class="detail-row">
          <span class="detail-label">Location:</span>
          <span class="detail-value">
            {{ generatedTask.location || 'General' }}
          </span>
        </div>

        <div class="detail-row">
          <span class="detail-label">Category:</span>
          <span class="detail-value">
            {{ generatedTask.category || 'General' }}
          </span>
        </div>

        <div class="detail-row">
          <span class="detail-label">Priority:</span>
          <span class="detail-value">
            {{ generatedTask.priority }}
          </span>
        </div>

        <div class="detail-row">
          <span class="detail-label">Priority reason:</span>
          <span class="detail-value">
            {{ generatedTask.priorityReason || 'No priority explanation was generated.' }}
          </span>
        </div>

        <div class="detail-row">
          <span class="detail-label">Source:</span>
          <span class="detail-value"> AR Vision </span>
        </div>

        <div v-if="suggestedAssignee" class="assignment-result">
          <div class="detail-row">
            <span class="detail-label">Assigned to:</span>

            <span class="detail-value">
              <strong>{{ suggestedAssignee }}</strong>
            </span>
          </div>

          <div v-if="assignmentReason" class="detail-row">
            <span class="detail-label">Reason:</span>

            <span class="detail-value">
              {{ assignmentReason }}
            </span>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-primary" :disabled="assigning" @click="suggestAssignee">
            <span class="btn-icon">👤</span>

            {{ assigning ? 'Finding Assignee...' : 'Suggest Assignee' }}
          </button>

          <button
            type="button"
            class="btn-primary"
            :disabled="saving || !generatedTask"
            @click="addToChores"
          >
            <span class="btn-icon">+</span>
            {{ saving ? 'Adding...' : 'Add to Chores' }}
          </button>
        </div>
      </div>
    </div>

    <p v-if="errorMessage" class="error-msg">
      <span class="error-icon">⚠️</span>
      {{ errorMessage }}
    </p>

    <transition name="toast">
      <div v-if="toastMessage" class="toast" :class="toastType">
        <span class="toast-icon">
          {{ toastType === 'success' ? '✓' : 'ℹ️' }}
        </span>
        {{ toastMessage }}
      </div>
    </transition>
  </section>
</template>

<script>
import axios from 'axios'
const API_BASE = 'https://cozyshare-mt-backend.onrender.com/api'

export default {
  name: 'ARAssistant',

  data() {
    return {
      selectedImage: null,
      imagePreview: '',
      analysisResult: null,

      generatedTask: null,
      generatingTask: false,

      houseMembers: [],
      saving: false,

      suggestedAssignee: '',
      assignmentReason: '',
      assigning: false,

      // Live AR
      liveMode: false,
      liveStream: null,
      liveTimer: null,
      liveAnalyzing: false,

      analyzing: false,
      errorMessage: '',
      toastMessage: '',
      toastType: 'success',
    }
  },

  computed: {
    currentUser() {
      return this.$store.getters.currentUser?.name || this.$store.getters.currentUser?.email || ''
    },

    householdCode() {
      return this.$store.getters.householdCode
    },
  },

  methods: {
    openCamera() {
      this.$refs.cameraInput.click()
    },

    handleImageSelection(event) {
      const file = event.target.files?.[0]

      if (!file) return

      if (!file.type.startsWith('image/')) {
        this.errorMessage = 'Please select a valid image.'
        return
      }

      const maxSize = 8 * 1024 * 1024

      if (file.size > maxSize) {
        this.errorMessage = 'Image must be smaller than 8 MB.'
        return
      }

      this.selectedImage = file
      this.imagePreview = URL.createObjectURL(file)
      this.analysisResult = null
      this.generatedTask = null
      this.errorMessage = ''

      this.showToast('Image selected successfully!', 'success')
    },

    clearImage() {
      if (this.imagePreview) {
        URL.revokeObjectURL(this.imagePreview)
      }

      this.selectedImage = null
      this.imagePreview = ''
      this.analysisResult = null
      this.generatedTask = null
      this.errorMessage = ''

      if (this.$refs.cameraInput) {
        this.$refs.cameraInput.value = ''
      }
    },

    async analyzeImage() {
      if (!this.selectedImage) {
        this.errorMessage = 'Please capture an image first.'
        return
      }

      try {
        this.analyzing = true
        this.errorMessage = ''
        this.analysisResult = null

        const formData = new FormData()
        formData.append('image', this.selectedImage)

        const response = await axios.post(`${API_BASE}/vision/analyze`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })

        this.analysisResult = response.data.analysis

        console.log('Backend image response:', response.data)

        this.showToast('Image uploaded successfully!', 'success')
      } catch (error) {
        console.error('Image upload error:', error.response?.data || error)

        this.errorMessage = error.response?.data?.message || 'Could not upload the image.'
      } finally {
        this.analyzing = false
      }
    },
    async generateTask() {
      if (!this.analysisResult) {
        this.errorMessage = 'Please analyze an image first.'
        return
      }

      if (this.analysisResult.taskNeeded === false) {
        this.errorMessage = 'The image does not show a clear household task.'
        return
      }

      try {
        this.generatingTask = true
        this.errorMessage = ''
        this.generatedTask = null

        this.suggestedAssignee = ''
        this.assignmentReason = ''

        const descriptionParts = [
          this.analysisResult.description,
          this.analysisResult.suggestedAction
            ? `Suggested action: ${this.analysisResult.suggestedAction}`
            : '',
          this.analysisResult.room ? `Location: ${this.analysisResult.room}` : '',
        ].filter(Boolean)

        const response = await axios.post(`${API_BASE}/ai/suggest-task`, {
          description: descriptionParts.join('. '),
          location: this.analysisResult.room || 'General',
        })

        this.generatedTask = response.data.suggestedTask

        this.showToast('Household task generated successfully!', 'success')
      } catch (error) {
        console.error('Generate task error:', error.response?.data || error)

        this.errorMessage =
          error.response?.data?.message || 'Could not generate a task from the image.'
      } finally {
        this.generatingTask = false
      }
    },

    async fetchHouseholdMembers() {
      if (!this.householdCode) {
        this.errorMessage = 'No household found.'
        return
      }

      try {
        const res = await axios.get(`${API_BASE}/households/${this.householdCode}/members`)

        const members = (res.data || [])
          .map((member) => {
            if (typeof member === 'string') {
              return member
            }

            return member.name || member.email || ''
          })
          .filter(Boolean)

        this.houseMembers = [...new Set(members)]

        console.log('AR household members:', this.houseMembers)
      } catch (error) {
        console.error('Fetch household members error:', error.response?.data || error)

        this.errorMessage = 'Could not load household members.'
      }
    },

    async suggestAssignee() {
      if (!this.generatedTask) {
        this.errorMessage = 'Please generate a task first.'
        return
      }

      if (!this.householdCode) {
        this.errorMessage = 'Household information is missing.'
        return
      }

      try {
        this.assigning = true
        this.errorMessage = ''

        await this.fetchHouseholdMembers()

        if (this.houseMembers.length === 0) {
          this.errorMessage = 'No household members were found.'
          return
        }
        console.log('AR household members:', this.houseMembers)
        const response = await axios.post(`${API_BASE}/ai/suggest-assignee`, {
          householdCode: this.householdCode,

          members: this.houseMembers,

          taskPriority: this.generatedTask.priority || 'Medium',

          taskCategory: this.generatedTask.category || 'General',
        })
        console.log('Assignment workload:', response.data.workload)

        this.suggestedAssignee = response.data.suggestedAssignee || ''

        this.assignmentReason = response.data.assignmentReason || ''

        this.showToast('Smart assignee suggested successfully!', 'success')
      } catch (error) {
        console.error('Smart assignment error:', error.response?.data || error)

        this.errorMessage = error.response?.data?.message || 'Could not suggest an assignee.'
      } finally {
        this.assigning = false
      }
    },

    async addToChores() {
      if (!this.generatedTask) {
        this.errorMessage = 'Please generate a task first.'
        return
      }

      if (!this.householdCode || !this.currentUser) {
        this.errorMessage = 'Household or user information is missing.'
        return
      }

      try {
        this.saving = true
        this.errorMessage = ''

        const body = {
          title: this.generatedTask.title,
          description: this.generatedTask.description,

          location: this.generatedTask.location || 'General',
          category: this.generatedTask.category || 'General',

          priority: this.generatedTask.priority || 'Medium',
          priorityReason: this.generatedTask.priorityReason || '',

          source: 'AR Vision',

          householdCode: this.householdCode,
          createdBy: this.currentUser || 'AR Assistant',

          assignedTo: this.suggestedAssignee || '',
          assignmentReason: this.assignmentReason || '',

          frequency: 'once',
          dueDate: this.todayDate(),
        }

        console.log('AR chore body:', body)

        const response = await axios.post(`${API_BASE}/chores`, body)

        console.log('AR chore created:', response.data)

        this.showToast('AR task added to Chores successfully!', 'success')

        this.clearImage()
      } catch (error) {
        console.error('Create AR chore error:', error.response?.data || error)

        this.errorMessage = error.response?.data?.message || 'Could not add the AR task to Chores.'
      } finally {
        this.saving = false
      }
    },

    async startLiveAR() {
  try {
    this.errorMessage = ''

    if (!navigator.mediaDevices?.getUserMedia) {
      this.errorMessage =
        'Live camera is not supported on this device or browser.'
      return
    }

    // Clear old normal image state
    this.clearImage()

    const stream =
      await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            ideal: 'environment',
          },
        },
        audio: false,
      })

    this.liveStream = stream
    this.liveMode = true

    await this.$nextTick()

    if (this.$refs.liveVideo) {
      this.$refs.liveVideo.srcObject = stream

      await this.$refs.liveVideo.play()
    }

    this.showToast(
      'Live AR started!',
      'success',
    )

    // First analysis shortly after camera starts
    setTimeout(() => {
      if (this.liveMode) {
        this.captureLiveFrame()
      }
    }, 1000)

    // Then every 3 seconds
    this.liveTimer = setInterval(() => {
      if (
        this.liveMode &&
        !this.liveAnalyzing
      ) {
        this.captureLiveFrame()
      }
    }, 3000)
  } catch (error) {
    console.error(
      'Live camera error:',
      error,
    )

    this.errorMessage =
      'Could not open the camera. Please allow camera permission.'
  }
},

stopLiveAR() {
  if (this.liveTimer) {
    clearInterval(this.liveTimer)
    this.liveTimer = null
  }

  if (this.liveStream) {
    this.liveStream
      .getTracks()
      .forEach((track) => {
        track.stop()
      })

    this.liveStream = null
  }

  if (this.$refs.liveVideo) {
    this.$refs.liveVideo.srcObject = null
  }

  this.liveMode = false
  this.liveAnalyzing = false

  this.showToast(
    'Live AR stopped.',
    'success',
  )
},

async captureLiveFrame() {
  if (
    !this.liveMode ||
    this.liveAnalyzing
  ) {
    return
  }

  const video = this.$refs.liveVideo
  const canvas = this.$refs.liveCanvas

  if (!video || !canvas) return

  if (
    video.readyState < 2 ||
    !video.videoWidth ||
    !video.videoHeight
  ) {
    return
  }

  try {
    this.liveAnalyzing = true

    const maxWidth = 768

    const scale = Math.min(
      1,
      maxWidth / video.videoWidth,
    )

    canvas.width =
      Math.round(video.videoWidth * scale)

    canvas.height =
      Math.round(video.videoHeight * scale)

    const context =
      canvas.getContext('2d')

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height,
    )

    const blob =
      await new Promise((resolve) => {
        canvas.toBlob(
          resolve,
          'image/jpeg',
          0.72,
        )
      })

    if (!blob) return

    const formData = new FormData()

    formData.append(
      'image',
      blob,
      'live-frame.jpg',
    )

    const response = await axios.post(
      `${API_BASE}/vision/analyze`,
      formData,
      {
        headers: {
          'Content-Type':
            'multipart/form-data',
        },
      },
    )

    const result =
      response.data.analysis

    // Only update when useful enough
    if (
      result &&
      (result.confidence || 0) >= 0.7
    ) {
      this.analysisResult = result
    }
  } catch (error) {
    console.error(
      'Live frame analysis error:',
      error.response?.data || error,
    )
  } finally {
    this.liveAnalyzing = false
  }
},

    todayDate() {
      const d = new Date()
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')

      return `${year}-${month}-${day}`
    },

    showToast(message, type = 'success') {
      this.toastMessage = message
      this.toastType = type

      setTimeout(() => {
        this.toastMessage = ''
      }, 3000)
    },
  },

  beforeUnmount() {
    this.stopLiveAR()
    if (this.imagePreview) {
      URL.revokeObjectURL(this.imagePreview)
    }
  },
}
</script>

<style scoped>
.ar-assistant {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px 40px;
}

.ar-header h2 {
  margin: 0;
  color: var(--navy);
  font-size: 2rem;
  font-weight: 700;
}

.subtitle {
  margin: 6px 0 0;
  font-size: 1rem;
  color: var(--text-light);
}

.assistant-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-top: 24px;
}

.card {
  background: #ffffff;
  border-radius: 20px;
  padding: 22px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--card-border);
}

.camera-card,
.analysis-card {
  min-height: 420px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 8px;
}

.card-header h3 {
  margin: 0;
  color: var(--navy);
  font-size: 1.2rem;
  font-weight: 700;
}

.small-subtitle {
  margin: 0 0 18px;
  font-size: 0.85rem;
  color: var(--text-light);
}

.ar-badge,
.count-badge {
  background: linear-gradient(135deg, var(--primary), var(--peach));
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 12px;
  white-space: nowrap;
}

.camera-empty,
.empty-state {
  text-align: center;
  padding: 52px 16px;
  background: #f9fafb;
  border-radius: 16px;
  border: 2px dashed #e5e7eb;
}

.camera-icon,
.empty-emoji {
  display: block;
  font-size: 3rem;
  margin-bottom: 12px;
}

.camera-empty p,
.empty-state p {
  margin: 0;
  color: var(--navy);
  font-weight: 700;
}

.empty-note {
  display: block;
  margin-top: 6px;
  font-size: 0.85rem;
  color: var(--text-light);
}

.hidden-input {
  display: none;
}

.image-preview-wrapper {
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  background: #111827;
  min-height: 280px;
}

.image-preview {
  display: block;
  width: 100%;
  height: 320px;
  object-fit: cover;
}

.ar-overlay {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 16px;
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  color: var(--navy);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.ar-task-overlay {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 16px;

  padding: 16px;

  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(10px);

  border-radius: 16px;

  border: 1px solid rgba(255, 255, 255, 0.7);

  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.22);

  color: var(--navy);
}

.ar-task-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.ar-task-badge {
  background: linear-gradient(135deg, var(--primary), var(--peach));

  color: white;

  padding: 5px 10px;

  border-radius: 10px;

  font-size: 0.75rem;

  font-weight: 700;
}

.ar-priority-badge {
  padding: 5px 10px;

  border-radius: 10px;

  font-size: 0.75rem;

  font-weight: 700;
}

.ar-priority-badge.high {
  background: #fee2e2;
  color: #b91c1c;
}

.ar-priority-badge.medium {
  background: #fef3c7;
  color: #92400e;
}

.ar-priority-badge.low {
  background: #d1fae5;
  color: #065f46;
}

.ar-task-title {
  margin: 0 0 10px;

  color: var(--navy);

  font-size: 1.2rem;

  font-weight: 700;
}

.ar-task-info {
  display: flex;

  flex-wrap: wrap;

  gap: 8px;

  font-size: 0.82rem;

  color: var(--text-dark);
}

.ar-task-info span {
  background: #f3f4f6;

  padding: 5px 9px;

  border-radius: 9px;

  font-weight: 600;
}

.ar-assignment-reason {
  margin: 10px 0 0;

  padding-top: 10px;

  border-top: 1px solid #e5e7eb;

  font-size: 0.78rem;

  line-height: 1.4;

  color: var(--text-light);
}

.overlay-label {
  display: block;
  margin-bottom: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-light);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.analysis-content {
  margin-top: 18px;
}

.detail-row {
  display: flex;
  gap: 12px;
  padding: 12px;
  margin-bottom: 10px;
  background: #f9fafb;
  border-radius: 12px;
}

.detail-label {
  min-width: 100px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-light);
}

.detail-value {
  flex: 1;
  font-size: 0.9rem;
  color: var(--text-dark);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px solid #e5e7eb;
}

.btn-primary,
.btn-secondary {
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary), var(--peach));
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(255, 159, 147, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 159, 147, 0.4);
}

.btn-secondary {
  background: #f3f4f6;
  color: var(--navy);
}

.btn-secondary:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-primary:disabled,
.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 1.2rem;
}

.error-msg {
  margin-top: 20px;
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  color: #b91c1c;
  display: flex;
  align-items: center;
  gap: 8px;
}

.toast {
  position: fixed;
  right: 32px;
  bottom: 32px;
  z-index: 2000;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  background: #ffffff;
  border: 2px solid #d1d5db;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  font-weight: 600;
}

.toast.success {
  border-color: #10b981;
  background: #f0fdf4;
  color: #059669;
}

.toast.error {
  border-color: #ef4444;
  background: #fef2f2;
  color: #dc2626;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.generated-task-card {
  margin-top: 24px;
}

.generated-task-content {
  margin-top: 18px;
}

.task-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.task-title-row h4 {
  margin: 0;
  color: var(--navy);
  font-size: 1.4rem;
  font-weight: 700;
}

.priority-badge {
  padding: 5px 12px;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 700;
}

.priority-badge.high {
  background: #fee2e2;
  color: #b91c1c;
}

.priority-badge.medium {
  background: #fef3c7;
  color: #92400e;
}

.priority-badge.low {
  background: #d1fae5;
  color: #065f46;
}

@media (max-width: 900px) {
  .assistant-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .ar-assistant {
    padding: 20px 16px 36px;
  }

  .card {
    padding: 18px;
  }

  .image-preview {
    height: 280px;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
    justify-content: center;
  }

  .toast {
    right: 20px;
    left: 20px;
    bottom: 20px;
  }
}

/* LIVE AR */

.live-camera-wrapper {
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  background: #111827;
  min-height: 320px;
}

.live-video {
  display: block;
  width: 100%;
  height: 420px;
  object-fit: cover;
}

.hidden-canvas {
  display: none;
}

.live-status {
  position: absolute;
  top: 14px;
  left: 14px;

  display: flex;
  align-items: center;
  gap: 7px;

  background: rgba(17, 24, 39, 0.78);
  color: white;

  padding: 7px 10px;
  border-radius: 10px;

  font-size: 0.75rem;
  font-weight: 700;

  backdrop-filter: blur(8px);
}

.live-dot {
  width: 8px;
  height: 8px;

  border-radius: 50%;

  background: #ef4444;

  box-shadow:
    0 0 0 4px
    rgba(239, 68, 68, 0.2);

  animation:
    livePulse 1.5s infinite;
}

@keyframes livePulse {
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0.4;
  }

  100% {
    opacity: 1;
  }
}

.live-ar-overlay {
  position: absolute;

  left: 16px;
  right: 16px;
  bottom: 16px;

  background:
    rgba(255, 255, 255, 0.94);

  backdrop-filter: blur(10px);

  border-radius: 16px;

  padding: 14px 16px;

  color: var(--navy);

  box-shadow:
    0 10px 30px
    rgba(0, 0, 0, 0.25);
}

.live-overlay-top {
  display: flex;
  justify-content: space-between;
  align-items: center;

  margin-bottom: 7px;

  font-size: 0.75rem;

  color: var(--text-light);
}

.live-ar-overlay p {
  margin: 0;

  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.4;
}

.live-action {
  margin-top: 10px;

  padding-top: 10px;

  border-top:
    1px solid #e5e7eb;

  color: var(--navy);

  font-size: 0.88rem;
  font-weight: 700;
}

.stop-live-btn {
  background: #fef2f2;
  color: #b91c1c;
}

.stop-live-btn:hover {
  background: #fee2e2;
}

@media (max-width: 768px) {
  .live-video {
    height: 380px;
  }
}
</style>
