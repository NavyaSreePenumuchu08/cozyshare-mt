<template>
  <section class="home">
    <!-- HEADER + REFRESH -->
    <div class="home-header">
      <div>
        <h2>Home Dashboard</h2>
        <p class="subtitle">Stay updated with your household</p>
        <!-- <p class="household-line">
          Household code:
          <strong>{{ householdCode || 'N/A' }}</strong>
        </p> -->
      </div>
    </div>

    <!-- STATS STRIP -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon">🛒</div>
        <div>
          <div class="stat-number">{{ pendingGroceries }}</div>
          <div class="stat-label">Groceries pending</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div>
          <div class="stat-number">{{ todayChores }}</div>
          <div class="stat-label">Chores due today</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📌</div>
        <div>
          <div class="stat-number">{{ totalNotices }}</div>
          <div class="stat-label">Notices posted</div>
        </div>
      </div>
    </div>

    <!-- ADD NEW NOTICE -->
    <div class="card notices-card">
      <div class="section-header">
        <h3>Notice Board</h3>
      </div>
      <form class="add-form" @submit.prevent="onSubmit">
        <div class="form-row">
          <div class="form-control">
            <label>Title *</label>
            <input
              v-model="title"
              type="text"
              placeholder="e.g. Inspection tomorrow, Party tonight..."
              required
              autofocus
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-control">
            <label>Message *</label>
            <textarea
              v-model="message"
              rows="4"
              placeholder="Add the details you want your flatmates to know..."
              required
            ></textarea>
          </div>
        </div>

        <p v-if="errorMessage" class="error-msg">
          <span class="error-icon">⚠</span> {{ errorMessage }}
        </p>

        <div class="form-actions">
          <button type="submit" class="btn-primary">Post Notice</button>
        </div>
      </form>
    </div>

    <!-- NOTICES LIST -->
    <div class="notices-section">
      <div class="card notices-card">
        <div class="section-header">
          <div>
            <h3>Notice Board</h3>
            <p class="section-subtitle">Latest updates from your household</p>
          </div>
          <button class="refresh-btn" @click="fetchAll" title="Refresh">🔄</button>
        </div>

        <div v-if="isLoading" class="loading-state">
          <p>Loading notices...</p>
        </div>

        <div v-else-if="notices.length > 0" class="notices-list">
          <NoticeItem
            v-for="notice in notices"
            :key="notice._id"
            :notice="notice"
            :currentUser="currentUser"
            @toggle-like="handleToggleLike"
            @add-comment="handleAddComment"
            @edit="handleEdit"
            @delete="handleDelete"
          />
        </div>

        <div v-else class="empty-state">
          <span class="empty-emoji">📢</span>
          <p>No notices yet. Be the first to post!</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import axios from 'axios'
import NoticeItem from '../components/noticeboard/NoticeItem.vue'

export default {
  name: 'HomePage',
  components: { NoticeItem },

  data() {
    return {
      title: '',
      message: '',
      notices: [],
      allGroceries: [],
      allChores: [],
      allExpenses: [],
      isLoading: false,
      errorMessage: '',
    }
  },

  computed: {
    currentUser() {
      return this.$store.getters.currentUser
    },
    householdCode() {
      return this.$store.getters.householdCode
    },
    isAuthenticated() {
      return this.$store.getters.isAuthenticated
    },

    totalNotices() {
      return this.notices.length
    },
    pendingGroceries() {
      return this.allGroceries.filter((g) => !g.isPurchased).length
    },
    todayChores() {
      const today = new Date()
      return this.allChores.filter((chore) => {
        if (!chore.dueDate) return false
        const due = new Date(chore.dueDate)
        return (
          due.getDate() === today.getDate() &&
          due.getMonth() === today.getMonth() &&
          due.getFullYear() === today.getFullYear()
        )
      }).length
    },
  },

  watch: {
    isAuthenticated(newVal) {
      if (!newVal) {
        this.$router.push('/login')
      }
    },
  },

  methods: {
    // ---------- FETCH HELPERS ----------
    async fetchNotices() {
      if (!this.householdCode) return

      const res = await axios.get(' https://cozyshare-backend.onrender.com/api/notices', {
        params: { householdCode: this.householdCode },
      })

      this.notices = (res.data || []).map((n) => ({
        ...n,
        likes: Array.isArray(n.likes) ? n.likes : [],
        comments: Array.isArray(n.comments) ? n.comments : [],
      }))
    },

    async fetchGroceries() {
      if (!this.householdCode) return
      const res = await axios.get(' https://cozyshare-backend.onrender.com/api/groceries', {
        params: { householdCode: this.householdCode },
      })
      this.allGroceries = res.data || []
    },

    async fetchChores() {
      if (!this.householdCode) return
      const res = await axios.get(' https://cozyshare-backend.onrender.com/api/chores', {
        params: { householdCode: this.householdCode },
      })
      this.allChores = res.data || []
    },

    async fetchExpenses() {
      if (!this.householdCode) return
      const res = await axios.get(' https://cozyshare-backend.onrender.com/api/expenses', {
        params: { householdCode: this.householdCode },
      })
      this.allExpenses = res.data || []
    },

    async fetchAll() {
      if (!this.householdCode) return
      this.isLoading = true
      this.errorMessage = ''
      try {
        await Promise.all([
          this.fetchNotices(),
          this.fetchGroceries(),
          this.fetchChores(),
          this.fetchExpenses(),
        ])
      } catch (err) {
        console.error('Error fetching dashboard data', err)
        this.errorMessage = err.response?.data?.message || 'Error loading household data.'
      } finally {
        this.isLoading = false
      }
    },

    // ---------- CREATE NOTICE ----------
    async onSubmit() {
      this.errorMessage = ''

      const trimmedTitle = this.title.trim()
      const trimmedMessage = this.message.trim()

      // Basic UI validation
      if (!trimmedTitle || !trimmedMessage) {
        this.errorMessage = 'Missing required fields'
        return
      }

      if (!this.householdCode || !this.currentUser) {
        this.errorMessage = 'No household set. Please login again.'
        return
      }

      try {
        const author = this.currentUser.name || this.currentUser.email

        // This is the ONLY shape we’ll send
        const body = {
          title: trimmedTitle,
          message: trimmedMessage,
          householdCode: this.householdCode,
          author,
        }

        const res = await axios.post(' https://cozyshare-backend.onrender.com/api/notices', body)

        const saved = res.data || {}

        const newNotice = {
          ...saved,
          likes: Array.isArray(saved.likes) ? saved.likes : [],
          comments: Array.isArray(saved.comments) ? saved.comments : [],
        }

        this.notices.unshift(newNotice)
        this.title = ''
        this.message = ''
      } catch (err) {
        console.error('Error creating notice', err)
        console.log('Backend said:', err.response?.data)

        this.errorMessage =
          err.response?.data?.message || err.response?.data?.error || 'Error creating notice.'
      }
    },

    // ---------- CHILD EVENTS ----------
    handleLike({ id, likes }) {
      this.notices = this.notices.map((n) => (n._id === id ? { ...n, likes } : n))
    },
    async handleToggleLike(id) {
      if (!this.currentUser) return

      const me = this.currentUser.email || this.currentUser.name

      // instant UI update (optimistic)
      this.notices = this.notices.map((n) => {
        if (n._id !== id) return n
        const currentLikes = Array.isArray(n.likes) ? n.likes : []
        const alreadyLiked = currentLikes.includes(me)
        const newLikes = alreadyLiked ? currentLikes.filter((u) => u !== me) : [...currentLikes, me]
        return { ...n, likes: newLikes }
      })

      // persist to backend so it won't disappear on tab switch
      try {
        const res = await axios.patch(
          ` https://cozyshare-backend.onrender.com/api/notices/${id}/like`,
          {
            user: me,
          },
        )

        // sync the final likes from server
        this.notices = this.notices.map((n) =>
          n._id === id ? { ...n, likes: res.data.likes || [] } : n,
        )
      } catch (err) {
        console.error('Like save failed', err)
        // fallback: reload correct state
        this.fetchNotices()
      }
    },

    async handleAddComment({ id, text }) {
      if (!this.currentUser) return

      const author = this.currentUser.name || this.currentUser.email

      // instant UI update
      this.notices = this.notices.map((n) => {
        if (n._id !== id) return n
        const existing = Array.isArray(n.comments) ? n.comments : []
        return { ...n, comments: [...existing, { author, text }] }
      })

      // persist to backend so it won't disappear
      try {
        const res = await axios.post(
          ` https://cozyshare-backend.onrender.com/api/notices/${id}/comments`,
          {
            author,
            text,
          },
        )

        this.notices = this.notices.map((n) =>
          n._id === id ? { ...n, comments: res.data.comments || [] } : n,
        )
      } catch (err) {
        console.error('Comment save failed', err)
        this.fetchNotices()
      }
    },
    handleComment({ id, comments }) {
      this.notices = this.notices.map((n) => (n._id === id ? { ...n, comments } : n))
    },

    async handleEdit(notice) {
      const newTitle = window.prompt('Edit title', notice.title)
      const newMessage = window.prompt('Edit message', notice.message)

      if (newTitle === null || newMessage === null) return

      try {
        await axios.put(` https://cozyshare-backend.onrender.com/api/notices/${notice._id}`, {
          title: newTitle,
          message: newMessage,
        })

        this.notices = this.notices.map((n) =>
          n._id === notice._id ? { ...n, title: newTitle, message: newMessage } : n,
        )
      } catch (err) {
        console.error('Error updating notice', err)
        alert('Error updating notice')
      }
    },

    async handleDelete(id) {
      if (!this.currentUser) return

      const me = this.currentUser.name || this.currentUser.email

      // UI remove instantly
      const backup = [...this.notices]
      this.notices = this.notices.filter((n) => n._id !== id)

      try {
        await axios.delete(` https://cozyshare-backend.onrender.com/api/notices/${id}`, {
          data: { user: me }, //  backend needs this for "only author can delete"
        })
      } catch (err) {
        console.error('Delete failed', err)
        alert(err.response?.data?.message || 'Delete failed')
        this.notices = backup // restore if delete rejected
      }
    },
  },
  mounted() {
    if (this.isAuthenticated && this.householdCode) {
      this.fetchAll()
    }
  },
}
</script>

<style scoped>
.home {
  max-width: 840px;
  margin: 0 auto;
}

/* HEADER */
.home-header {
  margin-bottom: 24px;
}

.home-header h2 {
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

/* STATS */
.stats-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.stat-card {
  flex: 1;
  min-width: 150px;
  padding: 10px 12px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--primary-light), var(--pink));
  border: 1px solid var(--card-border);
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: var(--soft-shadow);
}

.stat-icon {
  font-size: 1.4rem;
}

.stat-number {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--navy);
}

.stat-label {
  font-size: 0.8rem;
  color: var(--text-light);
}

/* CARDS */
.card {
  background: #ffffff;
  border-radius: 18px;
  padding: 14px 14px 16px;
  margin-bottom: 14px;
  box-shadow: var(--soft-shadow);
  border: 1px solid var(--card-border);
}

.add-card h3,
.list-card h3 {
  margin-top: 0;
  margin-bottom: 8px;
  color: var(--navy);
}

/* FORM */
.add-form {
  margin-top: 8px;
}

.form-row {
  margin-bottom: 20px;
}

.form-control label {
  display: block;
  font-size: 0.9rem;
  color: var(--navy);
  font-weight: 600;
  margin-bottom: 8px;
}

.form-control input,
.form-control textarea {
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  font-size: 0.95rem;
  transition: all 0.2s;
  font-family: inherit;
}

.form-control input:focus,
.form-control textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(0, 48, 73, 0.1);
}

.form-control textarea {
  resize: vertical;
  min-height: 100px;
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
  box-shadow: 0 4px 12px rgba(0, 48, 73, 0.2);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 48, 73, 0.3);
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

/* LIST */
.list-header {
  margin-bottom: 8px;
}

.list-subtitle {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-light);
}

.empty-message {
  margin-top: 6px;
  font-size: 0.9rem;
  color: var(--text-light);
}

.loading {
  font-size: 0.85rem;
  color: var(--text-light);
}

.error-msg {
  margin-top: 4px;
  font-size: 0.8rem;
  color: #b91c1c;
}

.notices-section {
  min-width: 0;
}

.notices-card {
  padding: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0 0 4px;
  color: var(--navy);
  font-size: 1.3rem;
  font-weight: 700;
}

.section-subtitle {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-light);
}

.refresh-btn {
  background: transparent;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: all 0.2s;
}

.refresh-btn:hover {
  background: var(--primary-light);
}

.loading-state {
  text-align: center;
  padding: 48px 16px;
  color: var(--text-light);
}

.empty-state {
  text-align: center;
  padding: 48px 16px;
}

.empty-emoji {
  font-size: 3rem;
  display: block;
  margin-bottom: 12px;
}

.empty-state p {
  margin: 0;
  font-size: 0.95rem;
  color: var(--text-light);
}

.notices-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
