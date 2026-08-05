<template>
  <section class="ai-assistant">
    <div class="ai-header">
      <div>
        <h2>AI Task Assistant</h2>
        <p class="subtitle">
          Describe a household situation and CozyShare will suggest a smart chore ✨
        </p>
      </div>
    </div>

    <div class="assistant-layout">
      <div class="card input-card">
        <div class="card-header">
          <h3>What do you see?</h3>
          <span class="ai-badge">AI Suggestion</span>
        </div>

        <p class="small-subtitle">
          Example: dirty dishes near kitchen sink, overflowing trash, clothes on chair
        </p>

        <div class="form-control">
          <label>Situation Description *</label>
          <textarea
            v-model="description"
            rows="5"
            placeholder="Describe the household situation..."
          ></textarea>
        </div>

        <p v-if="message" class="error-msg">
          <span class="error-icon">⚠️</span> {{ message }}
        </p>

        <div class="form-actions">
          <button type="button" class="btn-secondary" @click="clearAssistant">
            Clear
          </button>

          <button
            type="button"
            class="btn-primary"
            :disabled="loading"
            @click="suggestTask"
          >
            <span class="btn-icon">✨</span>
            {{ loading ? 'Thinking...' : 'Suggest Task' }}
          </button>
        </div>
      </div>

      <div class="card suggestion-card">
        <div class="card-header">
          <h3>Suggested Task</h3>
          <span class="count-badge">{{ suggestion ? 1 : 0 }}</span>
        </div>

        <div v-if="!suggestion" class="empty-state">
          <span class="empty-emoji">🤖</span>
          <p>No suggestion yet</p>
          <span class="empty-note">
            Enter a situation and let CozyShare suggest a chore.
          </span>
        </div>

        <div v-else class="suggestion-box">
          <div class="suggestion-title-row">
            <h4>{{ suggestion.title }}</h4>
            <span class="priority-badge">{{ suggestion.priority }}</span>
          </div>

          <div class="detail-row">
            <span class="detail-label">Description:</span>
            <span class="detail-value">{{ suggestion.description }}</span>
          </div>

          <div class="detail-row">
            <span class="detail-label">Location:</span>
            <span class="detail-value">{{ suggestion.location || 'General' }}</span>
          </div>

          <div class="detail-row">
            <span class="detail-label">Priority Reason:</span>
            <span class="detail-value">{{ suggestion.priorityReason || 'No reason generated.' }}</span>
          </div>

          <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span class="status-badge pending">⏳ Pending</span>
          </div>

          <div v-if="suggestedAssignee" class="detail-row">
  <span class="detail-label">Assigned to:</span>
  <span class="detail-value">
    👤 {{ suggestedAssignee }}
  </span>
</div>

<div v-if="assignmentReason" class="detail-row">
  <span class="detail-label">Assignment reason:</span>
  <span class="detail-value">
    {{ assignmentReason }}
  </span>
</div>

          <div class="form-actions assignment-actions">
  <button
    type="button"
    class="btn-secondary"
    :disabled="assigning"
    @click="suggestAssignee"
  >
    <span class="btn-icon">🤖</span>
    {{ assigning ? 'Analysing...' : 'Suggest Assignee' }}
  </button>

  <button
    type="button"
    class="btn-secondary"
    @click="dismissSuggestion"
  >
    Dismiss
  </button>

  <button
    type="button"
    class="btn-primary"
    :disabled="saving"
    @click="createChore"
  >
    <span class="btn-icon">+</span>
    {{ saving ? 'Adding...' : 'Add to Chores' }}
  </button>
</div>
        </div>
      </div>
    </div>

    <transition name="toast">
      <div v-if="toastMessage" class="toast" :class="toastType">
        <span class="toast-icon">{{ toastType === 'success' ? '✓' : 'ℹ️' }}</span>
        {{ toastMessage }}
      </div>
    </transition>
  </section>
</template>

<script>
import axios from 'axios'

const API_BASE = 'http://localhost:5000/api'

export default {
  name: 'AIAssistant',

  data() {
  return {
    description: '',
    suggestion: null,
    loading: false,
    saving: false,
    message: '',
    toastMessage: '',
    toastType: 'success',

    suggestedAssignee: '',
assignmentReason: '',
assignmentWorkload: {},
assigning: false,
houseMembers: [],
  }
},

  computed: {
    currentUser() {
      return this.$store.getters.currentUser?.name || this.$store.getters.currentUser?.email || ''
    },

    householdCode() {
      return (
        this.$store.getters.householdCode ||
        localStorage.getItem('householdCode') ||
        localStorage.getItem('household') ||
        'DEMO-HOUSE'
      )
    },
  },

  methods: {

    async fetchHouseholdMembers() {
  if (!this.householdCode) {
    this.message = 'No household found. Please login again.'
    return
  }

  try {
    const res = await axios.get(
      `${API_BASE}/households/${this.householdCode}/members`
    )

    const members = (res.data || [])
      .map((member) => {
        if (typeof member === 'string') {
          return member
        }

        return member.name || member.email || ''
      })
      .filter(Boolean)

    this.houseMembers = [...new Set(members)]

    console.log('Household members:', this.houseMembers)
  } catch (error) {
    console.error(
      'Fetch household members error:',
      error.response?.data || error
    )

    this.message =
      error.response?.data?.message ||
      'Could not load household members.'
  }
},

    async suggestTask() {
      if (!this.description.trim()) {
        this.message = 'Please enter a description first.'
        return
      }

      try {
        this.loading = true
        this.message = ''

        const res = await axios.post(`${API_BASE}/ai/suggest-task`, {
          description: this.description,
        })

        this.suggestion = res.data.suggestedTask
        this.showToast('AI suggestion created!', 'success')
      } catch (error) {
        console.error('AI suggestion error:', error)
        this.message = 'Could not generate task suggestion.'
      } finally {
        this.loading = false
      }
    },

    async suggestAssignee() {
  if (!this.householdCode) {
    this.message = 'No household found. Please login again.'
    return
  }

  await this.fetchHouseholdMembers()

  if (this.houseMembers.length === 0) {
    this.message = 'No household members were found.'
    return
  }

  try {
    this.assigning = true
    this.message = ''

    const res = await axios.post(`${API_BASE}/ai/suggest-assignee`, {
      householdCode: this.householdCode,
      members: this.houseMembers,
      taskPriority: this.suggestion?.priority || 'Medium',
    })

    this.suggestedAssignee = res.data.suggestedAssignee
    this.assignmentReason = res.data.assignmentReason
    this.assignmentWorkload = res.data.workload || {}

    this.showToast('AI selected the fairest assignee!', 'success')
  } catch (error) {
    console.error('Suggest assignee error:', error.response?.data || error)

    this.message =
      error.response?.data?.message ||
      'Unable to suggest an assignee.'
  } finally {
    this.assigning = false
  }
},

    async createChore() {
      if (!this.suggestion) return

      try {
        this.saving = true
        this.message = ''

        await axios.post(`${API_BASE}/chores`, {
          title: this.suggestion.title,
          description: this.suggestion.description,
          location: this.suggestion.location,
          priority: this.suggestion.priority,
          priorityReason: this.suggestion.priorityReason,
          householdCode: this.householdCode,
          createdBy: this.currentUser || 'AI Assistant',
          assignedTo: this.suggestedAssignee || '',
          assignmentReason: this.assignmentReason,
          frequency: 'once',
          dueDate: this.todayDate(),
        })

        this.showToast('Task added to chores successfully!', 'success')
        this.clearAssistant()
      } catch (error) {
        console.error('Create chore error:', error)
        this.message = 'Could not add task to chores.'
      } finally {
        this.saving = false
      }
    },

    dismissSuggestion() {
  this.suggestion = null
  this.suggestedAssignee = ''
  this.assignmentReason = ''
  this.assignmentWorkload = {}
  this.message = ''
},

    clearAssistant() {
  this.description = ''
  this.suggestion = null
  this.suggestedAssignee = ''
  this.assignmentReason = ''
  this.assignmentWorkload = {}
  this.message = ''
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
      setTimeout(() => (this.toastMessage = ''), 3000)
    },
  },

   mounted() {
    this.fetchHouseholdMembers()
  },
}
</script>

<style scoped>
.ai-assistant {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px 40px;
}

.ai-header h2 {
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

.input-card,
.suggestion-card {
  min-height: 360px;
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

.ai-badge,
.count-badge {
  background: linear-gradient(135deg, var(--primary), var(--peach));
  color: white;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 12px;
  white-space: nowrap;
}

.form-control label {
  display: block;
  font-size: 0.9rem;
  color: var(--navy);
  font-weight: 600;
  margin-bottom: 8px;
}

.form-control textarea {
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  font-size: 0.95rem;
  transition: all 0.2s;
  font-family: inherit;
  background: white;
  resize: vertical;
  min-height: 140px;
}

.form-control textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(255, 159, 147, 0.1);
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
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
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

.btn-primary:disabled,
.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: var(--navy);
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-icon {
  font-size: 1.2rem;
  font-weight: 700;
}

.empty-state {
  text-align: center;
  padding: 52px 16px;
}

.empty-emoji {
  font-size: 3rem;
  display: block;
  margin-bottom: 12px;
}

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

.suggestion-box {
  margin-top: 18px;
}

.suggestion-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.suggestion-title-row h4 {
  margin: 0;
  color: var(--navy);
  font-size: 1.35rem;
  font-weight: 700;
}

.priority-badge {
  background: #fef3c7;
  color: #92400e;
  padding: 5px 12px;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 700;
}

.detail-row {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 12px;
  margin-bottom: 10px;
}

.detail-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-light);
  min-width: 100px;
}

.detail-value {
  font-size: 0.9rem;
  color: var(--text-dark);
  flex: 1;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.error-msg {
  margin-top: 12px;
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  font-size: 0.9rem;
  color: #b91c1c;
  display: flex;
  align-items: center;
  gap: 8px;
}

.error-icon {
  font-size: 1.1rem;
}

.toast {
  position: fixed;
  bottom: 32px;
  right: 32px;
  background: white;
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  z-index: 2000;
  border: 2px solid #d1d5db;
}

.toast.success {
  border-color: #10b981;
  background: #f0fdf4;
  color: #059669;
}

.toast.info {
  border-color: #3b82f6;
  background: #eff6ff;
  color: #2563eb;
}

.toast.error {
  border-color: #ef4444;
  background: #fef2f2;
  color: #dc2626;
}

.toast-icon {
  font-size: 1.3rem;
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

@media (max-width: 900px) {
  .assistant-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .ai-assistant {
    padding: 20px 16px 36px;
  }

  .card {
    padding: 18px;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    justify-content: center;
    width: 100%;
  }

  .toast {
    bottom: 20px;
    right: 20px;
    left: 20px;
  }
}
</style>
