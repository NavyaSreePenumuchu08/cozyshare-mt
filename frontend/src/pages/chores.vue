<template>
  <section class="chores">
    <div class="chores-header">
      <div>
        <h2>Chores Planner</h2>
        <p class="subtitle">See this week's chores at a glance and keep everything fair 🧽</p>
      </div>
    </div>

    <div class="week-controls">
      <button class="pill-btn" @click="shiftWeek(-1)">◀ Previous</button>
      <div class="week-label">{{ weekLabel }}</div>
      <button class="pill-btn" @click="shiftWeek(1)">Next ▶</button>
    </div>

    <div class="top-cards">
      <div class="card sidebar-card">
        <div class="sidebar-header">
          <h3>My Chores</h3>
          <span class="count-badge">{{ myChoresThisWeek.length }}</span>
        </div>
        <p class="small-subtitle">Chores assigned to you this week.</p>

        <div v-if="myChoresThisWeek.length === 0" class="empty-state">
          <span class="empty-emoji">🎉</span>
          <p>You have no chores this week!</p>
        </div>

        <ChoreItem
          v-for="chore in myChoresThisWeek"
          :key="chore._id"
          :chore="chore"
          :currentUser="currentUser"
          :isCurrentWeek="isCurrentWeek"
          variant="my"
          :showDescription="false"
          @mark-done="toggleComplete"
          @undo="undoComplete"
        />
      </div>

      <div class="card sidebar-card">
        <div class="sidebar-header">
          <h3>Upcoming</h3>
          <span class="count-badge">{{ upcomingChores.length }}</span>
        </div>
        <p class="small-subtitle">Next chores coming up</p>

        <div v-if="upcomingChores.length === 0" class="empty-state">
          <span class="empty-emoji">📅</span>
          <p>Nothing scheduled yet</p>
        </div>

        <ChoreItem
          v-for="chore in upcomingChores"
          :key="chore._id"
          :chore="chore"
          :currentUser="currentUser"
          :isCurrentWeek="isCurrentWeek"
          variant="sidebar"
          :showDescription="false"
          @mark-done="toggleComplete"
          @undo="undoComplete"
        />
      </div>
    </div>

    <div class="week-grid card">
      <div
        v-for="day in weekDays"
        :key="day.key"
        class="day-column"
        :class="{ today: day.isToday }"
      >
        <div class="day-header">
          <span class="day-name">{{ day.label }}</span>
          <span class="day-date">{{ day.dateNum }}</span>
        </div>

        <div class="day-chores">
          <div v-if="day.chores.length === 0" class="empty-day">
            <span class="empty-icon">✨</span>
            <span>No chores</span>
          </div>

          <div
            v-for="chore in day.chores"
            :key="chore._id"
            class="chore-chip"
            @click="openChoreDetails(chore)"
          >
            <div class="chore-main">
              <span class="chore-title">{{ chore.title }}</span>
              <span class="chore-meta">
                <span v-if="chore.assignedTo" class="assigned-badge">
                  {{ chore.assignedTo }}
                </span>
                <span v-else class="shared-badge">Shared</span>
                <span v-if="chore.frequency && chore.frequency !== 'once'" class="frequency-tag">
                  🔄 {{ chore.frequency }}
                </span>
                <span v-if="chore.completed" class="completed-badge">✅ Done</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="add-chore-section">
      <button class="add-chore-btn" @click="showModal = true">
        <span class="plus-icon">+</span>
        Add New Chore
      </button>
    </div>

    <!-- Add Chore Modal -->
    <transition name="modal-fade">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content">
          <div class="modal-header">
            <div>
              <h3>Add a New Chore</h3>
              <p class="modal-subtitle">Create and assign a new task</p>
            </div>
            <button class="close-btn" @click="closeModal">✕</button>
          </div>

          <form class="add-form" @submit.prevent="onSubmit">
            <div class="form-row">
              <div class="form-control">
                <label>Chore Title *</label>
                <input
                  v-model="title"
                  type="text"
                  placeholder="e.g. Clean kitchen, Mop living room…"
                  required
                />
              </div>
            </div>

            <div class="form-row two-cols">
              <div class="form-control">
                <label>Assign To</label>
                <select v-model="assignedTo">
                  <option value="">Shared (no one specific)</option>
                  <option v-for="member in houseMembers" :key="member" :value="member">
                    {{ member }}{{ member === currentUser ? ' (You)' : '' }}
                  </option>
                </select>
              </div>

              <div class="form-control">
                <label>Due Date *</label>
                <input v-model="dueDate" type="date" :min="today" required />
              </div>
            </div>

            <div class="form-row">
              <div class="form-control">
                <label>Recurrence</label>
                <select v-model="frequency">
                  <option value="once">One time</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                <p v-if="frequency !== 'once'" class="helper-text">
                  ℹ️ New instances will be created automatically after completion
                </p>
              </div>
            </div>

            <div class="form-row">
              <div class="form-control">
                <label>Notes (Optional)</label>
                <textarea
                  v-model="description"
                  rows="3"
                  placeholder="Add any extra context or details…"
                ></textarea>
              </div>
            </div>

            <p v-if="errorMessage" class="error-msg">
              <span class="error-icon">⚠️</span> {{ errorMessage }}
            </p>

            <div class="form-actions">
              <button type="button" class="btn-secondary" @click="closeModal">Cancel</button>
              <button type="submit" class="btn-primary">
                <span class="btn-icon">+</span>
                Add Chore
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>

    <!-- Chore Details Modal -->
    <transition name="modal-fade">
      <div v-if="selectedChore" class="modal-overlay" @click.self="closeDetailsModal">
        <div class="modal-content details-modal">
          <div class="modal-header">
            <div>
              <h3>{{ selectedChore.title }}</h3>
              <p class="modal-subtitle">Chore details</p>
            </div>
            <button class="close-btn" @click="closeDetailsModal">✕</button>
          </div>

          <div class="details-content">
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span class="detail-value">
                <span v-if="selectedChore.completed" class="status-badge completed"
                  >✅ Completed</span
                >
                <span v-else class="status-badge pending">⏳ Pending</span>
              </span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Assigned to:</span>
              <span class="detail-value">{{
                selectedChore.assignedTo || 'Shared (everyone)'
              }}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Due date:</span>
              <span class="detail-value">{{ formatDate(selectedChore.dueDate) }}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Frequency:</span>
              <span class="detail-value">{{ selectedChore.frequency || 'once' }}</span>
            </div>

            <div v-if="selectedChore.description" class="detail-row">
              <span class="detail-label">Notes:</span>
              <span class="detail-value">{{ selectedChore.description }}</span>
            </div>

            <div class="detail-actions">
              <button
                v-if="canMarkChore(selectedChore) && !selectedChore.completed"
                class="btn-primary"
                :disabled="!isCurrentWeek"
                @click="toggleComplete(selectedChore)"
              >
                ✓ Mark as Done
              </button>
              <button
                v-if="
                  canMarkChore(selectedChore) &&
                  selectedChore.completed &&
                  canUndoChore(selectedChore)
                "
                class="btn-secondary"
                @click="undoComplete(selectedChore._id)"
              >
                ↩️ Undo ({{ undoTimeLeft(selectedChore) }}s)
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Toast Notification -->
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
import ChoreItem from '../components/chores/ChoreItem.vue'

export default {
  name: 'ChoresPage',
  components: { ChoreItem },
  data() {
    return {
      allChores: [],
      isLoading: false,
      errorMessage: '',
      showModal: false,
      selectedChore: null,
      toastMessage: '',
      toastType: 'success',

      suggestedAssignee: '',
      assignmentReason: '',
      assigning: false,

      houseMembers: [],

      title: '',
      description: '',
      assignedTo: '',
      dueDate: '',
      frequency: 'once',

      weekOffset: 0,

      // Track completion timestamps for undo
      completionTimestamps: {},
    }
  },
  computed: {
    currentUser() {
      return this.$store.getters.currentUser?.name || this.$store.getters.currentUser?.email || ''
    },
    householdCode() {
      return this.$store.getters.householdCode
    },
    weekStartDate() {
      const base = new Date()
      base.setDate(base.getDate() + this.weekOffset * 7)
      const day = base.getDay()
      const diff = day === 0 ? -6 : 1 - day
      const start = new Date(base)
      start.setHours(0, 0, 0, 0)
      start.setDate(start.getDate() + diff)
      return start
    },
    weekEndDate() {
      const end = new Date(this.weekStartDate)
      end.setDate(end.getDate() + 7)
      end.setHours(0, 0, 0, 0)
      return end
    },
    weekLabel() {
      const d = this.weekStartDate
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    },
    weeklyChores() {
      return this.allChores.filter((c) => {
        if (!c.dueDate) return false
        const d = new Date(c.dueDate)
        d.setHours(0, 0, 0, 0)
        return d >= this.weekStartDate && d < this.weekEndDate
      })
    },
    weekDays() {
      const days = []
      const start = this.weekStartDate
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      for (let i = 0; i < 7; i++) {
        const d = new Date(start)
        d.setDate(start.getDate() + i)
        const label = d.toLocaleDateString(undefined, { weekday: 'short' })
        const key = d.toISOString().slice(0, 10)
        const isToday = d.getTime() === today.getTime()

        const choresForDay = this.weeklyChores.filter((chore) => {
          const cd = new Date(chore.dueDate)
          cd.setHours(0, 0, 0, 0)
          return cd.getTime() === d.getTime()
        })

        days.push({ key, label, dateNum: d.getDate(), isToday, date: d, chores: choresForDay })
      }
      return days
    },
    isCurrentWeek() {
      return this.weekOffset === 0
    },
    today() {
      const d = new Date()
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },

    myChoresThisWeek() {
      if (!this.currentUser) return []
      const userLower = this.currentUser.toLowerCase()

      return this.weeklyChores.filter((c) => {
        const assigned = (c.assignedTo || '').toLowerCase()
        const created = (c.createdBy || '').toLowerCase()
        return assigned === userLower || created === userLower
      })
    },
    upcomingChores() {
      return this.weeklyChores
        .filter((c) => !c.completed)
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 5)
    },
  },
  watch: {
    householdCode(newVal, oldVal) {
      if (newVal && newVal !== oldVal) {
        this.fetchChores()
      }
    },
  },
  methods: {
    shiftWeek(delta) {
      this.weekOffset += delta
    },
    closeModal() {
      this.showModal = false
      this.resetForm()
      this.errorMessage = ''
    },
    closeDetailsModal() {
      this.selectedChore = null
    },
    openChoreDetails(chore) {
      this.selectedChore = chore
    },
    resetForm() {
      this.title = ''
      this.description = ''
      this.assignedTo = ''
      this.dueDate = ''
      this.frequency = 'once'
    },
    isPastDate(dateString) {
      if (!dateString) return false

      const selected = new Date(dateString)
      selected.setHours(0, 0, 0, 0)

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      return selected < today
    },
    async fetchChores() {
      if (!this.householdCode) return
      this.isLoading = true
      try {
        const res = await axios.get(' https://cozyshare-mt-backend.onrender.com/api/chores', {
          params: { householdCode: this.householdCode },
        })
        this.allChores = res.data || []
        this.fetchHouseholdMembers()
      } catch (err) {
        console.error('Error fetching chores', err)
      } finally {
        this.isLoading = false
      }
    },
    async fetchHouseholdMembers() {
      const membersSet = new Set([this.currentUser])
      this.allChores.forEach((chore) => {
        if (chore.assignedTo) membersSet.add(chore.assignedTo)
        if (chore.createdBy) membersSet.add(chore.createdBy)
      })
      this.houseMembers = Array.from(membersSet).sort()
      if (this.houseMembers.length === 1) {
        this.houseMembers = [this.currentUser]
      }
    },
    async onSubmit() {
      this.errorMessage = ''
      if (!this.title || !this.dueDate) {
        this.errorMessage = 'Chore title and due date are required.'
        return
      }

      if (this.isPastDate(this.dueDate)) {
        this.errorMessage = 'Due date cannot be in the past.'
        return
      }

      if (!this.householdCode || !this.currentUser) {
        this.errorMessage = 'No household or user. Please login again.'
        return
      }

      try {
        const body = {
          title: this.title,
          description: this.description,
          assignedTo: this.assignedTo ? this.assignedTo.trim() : '',
          dueDate: this.dueDate,
          frequency: this.frequency,
          householdCode: this.householdCode,
          createdBy: this.currentUser,
        }

        const res = await axios.post(' https://cozyshare-mt-backend.onrender.com/api/chores', body)
        this.allChores.push(res.data)
        this.closeModal()
        this.showToast('Chore added successfully!', 'success')
        this.fetchHouseholdMembers()
      } catch (err) {
        console.error('Create chore error', err)
        this.errorMessage = err.response?.data?.message || 'Error creating chore.'
      }
    },
    canMarkChore(chore) {
      if (!this.currentUser) return false
      const userLower = this.currentUser.toLowerCase()
      const created = (chore.createdBy || '').toLowerCase()
      const assigned = (chore.assignedTo || '').toLowerCase()

      // Can mark if creator, assignee, or if it's a shared chore (no assignee)
      return created === userLower || assigned === userLower || !chore.assignedTo
    },
    async toggleComplete(chore) {
      if (!this.isCurrentWeek) {
        this.showToast('You can only complete chores for the current week', 'info')
        return
      }
      if (!this.canMarkChore(chore)) return

      try {
        const res = await axios.patch(
          ` https://cozyshare-mt-backend.onrender.com/api/chores/${chore._id}/complete`,
          {
            currentUser: this.currentUser,
          },
        )

        const updated = res.data.chore || res.data

        // Track completion time for undo feature (only when marking as complete)
        if (updated.completed) {
          this.completionTimestamps[updated._id] = Date.now()

          // If this was a recurring chore and it's now complete, a new instance may have been created
          if (res.data.newChore) {
            this.allChores.push(res.data.newChore)
            this.showToast('Chore marked as done! Next occurrence created.', 'success')
          } else {
            this.showToast('Chore marked as done!', 'success')
          }
        } else {
          // Being marked as incomplete - remove timestamp
          delete this.completionTimestamps[updated._id]
          this.showToast('Chore marked as incomplete', 'info')
        }

        // Update the chore in the list
        this.allChores = this.allChores.map((c) => (c._id === updated._id ? updated : c))

        // Update selected chore if open
        if (this.selectedChore && this.selectedChore._id === updated._id) {
          this.selectedChore = updated
        }
      } catch (err) {
        console.error('Complete chore error', err)
        this.showToast(err.response?.data?.message || 'Could not update chore', 'error')
      }
    },
    async undoComplete(choreId) {
      const chore = this.allChores.find((c) => c._id === choreId)
      if (!chore || !chore.completed) return

      try {
        const res = await axios.patch(
          ` https://cozyshare-mt-backend.onrender.com/api/chores/${choreId}/complete`,
          {
            currentUser: this.currentUser,
          },
        )

        const updated = res.data.chore || res.data

        // Remove completion timestamp
        delete this.completionTimestamps[choreId]

        // If there was a recurring chore created, remove it
        if (res.data.removedChoreId) {
          this.allChores = this.allChores.filter((c) => c._id !== res.data.removedChoreId)
        }

        // Update the original chore to incomplete
        this.allChores = this.allChores.map((c) => (c._id === updated._id ? updated : c))

        if (this.selectedChore && this.selectedChore._id === updated._id) {
          this.selectedChore = updated
        }

        this.showToast('Chore completion undone', 'info')
      } catch (err) {
        console.error('Undo chore error', err)
        this.showToast('Could not undo chore', 'error')
      }
    },
    canUndoChore(chore) {
      if (!chore.completed) return false
      const timestamp = this.completionTimestamps[chore._id]
      if (!timestamp) return false
      const fiveMinutes = 5 * 60 * 1000
      return Date.now() - timestamp < fiveMinutes
    },
    undoTimeLeft(chore) {
      const timestamp = this.completionTimestamps[chore._id]
      if (!timestamp) return 0
      const elapsed = Date.now() - timestamp
      const fiveMinutes = 5 * 60 * 1000
      const remaining = Math.ceil((fiveMinutes - elapsed) / 1000)
      return Math.max(0, remaining)
    },
    showToast(message, type = 'success') {
      this.toastMessage = message
      this.toastType = type
      setTimeout(() => (this.toastMessage = ''), 3000)
    },
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    },
  },
  mounted() {
    if (this.householdCode) {
      this.fetchChores()
    }

    // Update undo timers every second
    setInterval(() => {
      this.$forceUpdate()
    }, 1000)
  },
}
</script>

<style scoped>
.chores {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px 40px;
}

.chores-header h2 {
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

.week-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: #ffffff;
  padding: 8px 12px;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--card-border);
  margin: 16px auto 24px;
  max-width: 400px;
}

.pill-btn {
  border-radius: 12px;
  border: none;
  background: var(--primary-light);
  padding: 8px 16px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--navy);
  display: flex;
  /*align-items: center;*/
  gap: 6px;
}

.pill-btn:hover {
  background: var(--primary);
  color: white;
  transform: translateY(-1px);
}

.week-label {
  font-size: 0.95rem;
  color: var(--navy);
  font-weight: 700;
  min-width: 140px;
  text-align: center;
}

.top-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

.week-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 10px;
  padding: 16px;
  margin-bottom: 32px;
}

.day-column {
  border-radius: 16px;
  background: #fafafa;
  border: 2px solid transparent;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  min-height: 140px;
  transition: all 0.2s;
}

.day-column:hover {
  background: #fff;
  border-color: var(--primary-light);
}

.day-column.today {
  background: linear-gradient(135deg, #fff5f3, #ffffff);
  border-color: var(--primary);
  box-shadow: 0 4px 12px rgba(255, 159, 147, 0.2);
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.day-name {
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--navy);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.day-date {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-light);
}

.day-chores {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.empty-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 16px 8px;
  font-size: 0.8rem;
  color: var(--text-light);
  text-align: center;
}

.empty-icon {
  font-size: 1.5rem;
}

.chore-chip {
  border-radius: 12px;
  background: white;
  border: 1px solid #e5e7eb;
  padding: 10px;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  cursor: pointer;
}

.chore-chip:hover {
  border-color: var(--primary);
  box-shadow: 0 2px 8px rgba(255, 159, 147, 0.15);
  transform: translateY(-1px);
}

.chore-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.chore-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--navy);
  line-height: 1.3;
}

.chore-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.assigned-badge,
.shared-badge {
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 8px;
  font-weight: 600;
}

.assigned-badge {
  background: #dbeafe;
  color: #1e40af;
}

.shared-badge {
  background: #e0e7ff;
  color: #4338ca;
}

.frequency-tag {
  font-size: 0.7rem;
  color: var(--text-light);
}

.completed-badge {
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 8px;
  font-weight: 600;
  background: #d1fae5;
  color: #065f46;
}

.sidebar-card {
  padding: 18px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.sidebar-card h3 {
  margin: 0;
  color: var(--navy);
  font-size: 1.1rem;
  font-weight: 700;
}

.count-badge {
  background: linear-gradient(135deg, var(--primary), var(--peach));
  color: white;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 12px;
  min-width: 28px;
  text-align: center;
}

.small-subtitle {
  margin: 0 0 12px;
  font-size: 0.85rem;
  color: var(--text-light);
}

.empty-state {
  text-align: center;
  padding: 32px 16px;
}

.empty-emoji {
  font-size: 3rem;
  display: block;
  margin-bottom: 12px;
}

.card {
  background: #ffffff;
  border-radius: 20px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--card-border);
}

.add-chore-section {
  display: flex;
  justify-content: center;
  margin: 32px 0 24px;
}

.add-chore-btn {
  border: none;
  border-radius: 16px;
  padding: 16px 32px;
  background: linear-gradient(135deg, var(--primary), var(--peach));
  color: #ffffff;
  cursor: pointer;
  font-weight: 700;
  font-size: 1.1rem;
  box-shadow: 0 6px 20px rgba(255, 159, 147, 0.35);
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 10px;
}

.add-chore-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(255, 159, 147, 0.45);
}

.plus-icon {
  font-size: 1.4rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: #ffffff;
  border-radius: 24px;
  padding: 32px;
  /* Continue from modal-content padding */
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.details-modal {
  max-width: 500px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  gap: 16px;
}

.modal-header h3 {
  margin: 0 0 4px;
  color: var(--navy);
  font-size: 1.5rem;
  font-weight: 700;
}

.modal-subtitle {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-light);
}

.close-btn {
  background: #f3f4f6;
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
  color: var(--navy);
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
  flex-shrink: 0;
}

.close-btn:hover {
  background: #e5e7eb;
  transform: rotate(90deg);
}

/* Details Modal Content */
.details-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-row {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 12px;
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

.status-badge.completed {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.detail-actions {
  display: flex;
  gap: 12px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

/* Form Styling */
.add-form {
  margin-top: 8px;
}

.form-row {
  margin-bottom: 20px;
}

.two-cols {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 16px;
}

.form-control label {
  display: block;
  font-size: 0.9rem;
  color: var(--navy);
  font-weight: 600;
  margin-bottom: 8px;
}

.form-control input,
.form-control select,
.form-control textarea {
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  font-size: 0.95rem;
  transition: all 0.2s;
  font-family: inherit;
  background: white;
}

.form-control input:focus,
.form-control select:focus,
.form-control textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(255, 159, 147, 0.1);
}

.form-control textarea {
  resize: vertical;
  min-height: 80px;
}

.helper-text {
  margin: 6px 0 0;
  font-size: 0.8rem;
  color: var(--text-light);
  font-style: italic;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 28px;
  padding-top: 20px;
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

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 159, 147, 0.4);
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

/* Toast Notification */
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

/* Modal Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-active .modal-content,
.modal-fade-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal-content,
.modal-fade-leave-to .modal-content {
  transform: scale(0.9) translateY(20px);
}

/* Toast Transitions */
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

/* Responsive Design */
@media (max-width: 1024px) {
  .top-cards {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .chores-header {
    flex-direction: column;
    align-items: stretch;
  }

  .week-controls {
    justify-content: center;
  }

  .week-grid {
    grid-template-columns: repeat(7, minmax(80px, 1fr));
    overflow-x: auto;
  }

  .two-cols {
    grid-template-columns: 1fr;
  }

  .modal-content {
    padding: 24px;
  }

  .toast {
    bottom: 20px;
    right: 20px;
    left: 20px;
  }
}
</style>
