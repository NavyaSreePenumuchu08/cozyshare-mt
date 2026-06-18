<template>
  <section class="groceries">
    <!-- Header -->
    <div class="groceries-header">
      <div>
        <h2>Grocery List</h2>
        <p class="subtitle">Your shared household shopping list 🛒</p>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="summary-cards">
      <div class="card summary-card">
        <div class="summary-icon" style="background: #fef8ec">📝</div>
        <div class="summary-content">
          <h3>{{ pendingCount }}</h3>
          <p>Items to Buy</p>
        </div>
      </div>

      <div class="card summary-card">
        <div class="summary-icon" style="background: #d4f1f0">✅</div>
        <div class="summary-content">
          <h3>{{ purchasedTodayCount }}</h3>
          <p>Bought Today</p>
        </div>
      </div>

      <div class="card summary-card">
        <div class="summary-icon" style="background: #ffe5f0">📦</div>
        <div class="summary-content">
          <h3>{{ totalCategories }}</h3>
          <p>Categories</p>
        </div>
      </div>
    </div>

    <!-- Tabs: active list vs history -->
    <div class="tabs-section">
      <div class="tabs">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'list' }"
          @click="activeTab = 'list'"
        >
          Shopping List
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'history' }"
          @click="activeTab = 'history'"
        >
          Purchase History
        </button>
      </div>

      <button class="btn-add" @click="showModal = true">
        <span class="plus-icon">+</span>
        Add Item
      </button>
    </div>

    <!-- CURRENT LIST -->
    <div v-if="activeTab === 'list'" class="card list-card">
      <div class="list-header">
        <h3>Shopping List</h3>
        <button class="refresh-btn" @click="fetchAll" title="Refresh">🔄</button>
      </div>
      <p class="list-subtitle">Check off items as you shop. They'll move to purchase history.</p>

      <!-- FILTER BAR -->
      <div class="filter-bar">
        <input
          v-model="searchText"
          type="text"
          class="filter-input"
          placeholder="Search groceries…"
        />

        <select v-model="filterCategory" class="filter-select">
          <option value="All">All Categories</option>
          <option value="Produce">🥬 Produce</option>
          <option value="Dairy">🥛 Dairy</option>
          <option value="Meat">🥩 Meat</option>
          <option value="Snacks">🍿 Snacks</option>
          <option value="Cleaning">🧼 Cleaning</option>
          <option value="Toiletries">🧴 Toiletries</option>
          <option value="Other">📦 Other</option>
        </select>
      </div>

      <div v-if="isLoading" class="loading-state">
        <p>Loading groceries...</p>
      </div>

      <div v-else>
        <div v-if="filteredGroceries.length === 0" class="empty-state">
          <span class="empty-emoji">🛒</span>
          <p>
            {{
              searchText || filterCategory !== 'All'
                ? 'No items match your filter'
                : 'Your shopping list is empty!'
            }}
          </p>
        </div>

        <div class="grocery-grid">
          <GroceryItem
            v-for="item in filteredGroceries"
            :key="item._id"
            :grocery="item"
            @toggle="handleToggle"
            @delete="handleDelete"
          />
        </div>
      </div>
    </div>

    <!-- HISTORY -->
    <div v-else class="card list-card">
      <h3>Grocery history</h3>
      <p class="list-subtitle">Recently purchased items appear here.</p>

      <div v-if="isLoadingHistory" class="loading-state">
        <p>Loading history...</p>
      </div>

      <div v-else>
        <div v-if="history.length === 0" class="empty-state">
          <span class="empty-emoji">📋</span>
          <p>No purchase history yet.</p>
        </div>

        <div class="history-grid">
          <GroceryHistoryItem v-for="item in history" :key="item._id" :item="item" />
        </div>
      </div>
    </div>

    <!-- Add Grocery Modal -->
    <transition name="modal-fade">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content">
          <div class="modal-header">
            <div>
              <h3>Add Grocery Item</h3>
              <p class="modal-subtitle">Add a new item to your shopping list</p>
            </div>
            <button class="close-btn" @click="closeModal">✕</button>
          </div>

          <form class="add-form" @submit.prevent="onSubmit">
            <div class="form-row">
              <div class="form-control">
                <label>Item Name *</label>
                <input
                  v-model="name"
                  type="text"
                  placeholder="e.g. Milk, Eggs, Bread..."
                  required
                  autofocus
                />
              </div>
            </div>

            <div class="form-row two-cols">
              <div class="form-control">
                <label>Quantity</label>
                <input v-model="quantity" type="text" placeholder="e.g. 2 liters, 1 pack" />
              </div>

              <div class="form-control">
                <label>Category</label>
                <select v-model="category">
                  <option value="Produce">🥬 Produce</option>
                  <option value="Dairy">🥛 Dairy</option>
                  <option value="Meat">🥩 Meat</option>
                  <option value="Snacks">🍿 Snacks</option>
                  <option value="Cleaning">🧼 Cleaning</option>
                  <option value="Toiletries">🧴 Toiletries</option>
                  <option value="Other">📦 Other</option>
                </select>
              </div>
            </div>

            <p v-if="errorMessage" class="error-msg">
              <span class="error-icon">⚠</span> {{ errorMessage }}
            </p>

            <div class="form-actions">
              <button type="button" class="btn-secondary" @click="closeModal">Cancel</button>
              <button type="submit" class="btn-primary">
                <span class="btn-icon">+</span>
                Add to List
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>

    <!-- Undo toast -->
    <BaseToast
      :show="toast.show"
      :message="toast.message"
      actionText="Undo"
      @action="undoLastPurchase"
      @close="hideToast"
    />
  </section>
</template>

<script>
import axios from 'axios'
import GroceryItem from '../components/groceries/GroceryItem.vue'
import GroceryHistoryItem from '../components/groceries/GroceryHistoryItem.vue'
import BaseToast from '../components/ui/BaseToast.vue'

export default {
  name: 'GroceriesPage',

  components: {
    GroceryItem,
    GroceryHistoryItem,
    BaseToast,
  },

  data() {
    return {
      groceries: [],
      history: [],
      isLoading: false,
      isLoadingHistory: false,
      errorMessage: '',
      activeTab: 'list',
      showModal: false,

      // form
      name: '',
      quantity: '1',
      category: 'Produce',

      // filters
      filterCategory: 'All',
      searchText: '',

      // toast + undo
      toast: {
        show: false,
        message: '',
        timer: null,
        lastUndoId: null,
      },
    }
  },

  computed: {
    currentUser() {
      return this.$store.getters.currentUser
    },
    householdCode() {
      return this.$store.getters.householdCode
    },

    pendingCount() {
      return this.groceries.filter((g) => !g.isPurchased).length
    },

    purchasedTodayCount() {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      return this.history.filter((h) => {
        if (!h.purchasedAt) return false
        const d = new Date(h.purchasedAt)
        d.setHours(0, 0, 0, 0)
        return d.getTime() === today.getTime()
      }).length
    },

    totalCategories() {
      const categories = new Set(
        this.groceries.filter((g) => !g.isPurchased).map((g) => g.category || 'Other'),
      )
      return categories.size
    },

    filteredGroceries() {
      const q = this.searchText.trim().toLowerCase()

      return this.groceries
        .filter((g) => !g.isPurchased)
        .filter((g) => {
          const cat = g.category || 'Other'
          const categoryOk = this.filterCategory === 'All' || cat === this.filterCategory
          const searchOk = !q || (g.name || '').toLowerCase().includes(q)
          return categoryOk && searchOk
        })
    },
  },

  watch: {
    householdCode(newVal, oldVal) {
      if (newVal && newVal !== oldVal) {
        this.fetchAll()
      }
    },
  },

  methods: {
    async fetchGroceries() {
      if (!this.householdCode) return
      this.isLoading = true
      try {
        const res = await axios.get(' https://cozyshare-backend.onrender.com/api/groceries', {
          params: { householdCode: this.householdCode },
        })
        this.groceries = res.data || []
      } catch (err) {
        console.error('Fetch groceries error', err)
      } finally {
        this.isLoading = false
      }
    },

    async fetchHistory() {
      if (!this.householdCode) return
      this.isLoadingHistory = true
      try {
        const res = await axios.get(
          ' https://cozyshare-backend.onrender.com/api/groceries/history',
          {
            params: { householdCode: this.householdCode, limit: 50 },
          },
        )
        this.history = res.data || []
      } catch (err) {
        console.error('Fetch grocery history error', err)
      } finally {
        this.isLoadingHistory = false
      }
    },

    async fetchAll() {
      await Promise.all([this.fetchGroceries(), this.fetchHistory()])
    },

    closeModal() {
      this.showModal = false
      this.resetForm()
      this.errorMessage = ''
    },

    resetForm() {
      this.name = ''
      this.quantity = '1'
      this.category = 'Produce'
    },

    async onSubmit() {
      this.errorMessage = ''

      if (!this.name) {
        this.errorMessage = 'Item name is required.'
        return
      }

      if (!this.currentUser || !this.householdCode) {
        this.errorMessage = 'No user/household. Please login again.'
        return
      }

      try {
        const body = {
          name: this.name,
          quantity: this.quantity,
          category: this.category,
          householdCode: this.householdCode,
          addedBy: this.currentUser.name || this.currentUser.email,
        }

        const res = await axios.post(' https://cozyshare-backend.onrender.com/api/groceries', body)
        this.groceries.push(res.data)

        this.closeModal()
      } catch (err) {
        console.error('Create grocery error', err)
        this.errorMessage = err.response?.data?.message || 'Error adding grocery item.'
      }
    },

    showToast(message, undoId) {
      if (this.toast.timer) clearTimeout(this.toast.timer)

      this.toast.show = true
      this.toast.message = message
      this.toast.lastUndoId = undoId

      this.toast.timer = setTimeout(() => {
        this.hideToast()
      }, 5000)
    },

    hideToast() {
      if (this.toast.timer) clearTimeout(this.toast.timer)
      this.toast.show = false
      this.toast.message = ''
      this.toast.timer = null
      this.toast.lastUndoId = null
    },

    async undoLastPurchase() {
      const id = this.toast.lastUndoId
      if (!id) return
      this.hideToast()
      await this.handleToggle(id, { silentToast: true })
    },

    async handleToggle(id, opts = {}) {
      if (!this.currentUser) return

      const before = this.groceries.find((g) => g._id === id)
      const wasPurchased = !!before?.isPurchased

      try {
        const res = await axios.patch(
          ` https://cozyshare-backend.onrender.com/api/groceries/${id}/toggle`,
          {
            currentUser: this.currentUser.name || this.currentUser.email,
          },
        )

        const updated = res.data

        this.groceries = this.groceries.map((g) => (g._id === updated._id ? updated : g))
        await this.fetchHistory()

        if (!wasPurchased && updated.isPurchased && !opts.silentToast) {
          const itemName = updated.name || 'Item'
          this.showToast(`✅ "${itemName}" marked as purchased`, updated._id)
        }
      } catch (err) {
        console.error('Toggle grocery error', err)
        alert(err.response?.data?.message || 'Could not update grocery item.')
      }
    },

    async handleDelete(id) {
      if (!confirm('Are you sure you want to delete this item?')) {
        return
      }

      try {
        await axios.delete(` https://cozyshare-backend.onrender.com/api/groceries/${id}`)
        this.groceries = this.groceries.filter((g) => g._id !== id)
      } catch (err) {
        console.error('Delete grocery error', err)
        alert('Could not delete item.')
      }
    },
  },

  mounted() {
    if (this.householdCode) {
      this.fetchAll()
    }
  },
}
</script>

<style scoped>
.groceries {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px 40px;
}

/* Header */
.groceries-header {
  margin-bottom: 24px;
}

.groceries-header h2 {
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

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

.summary-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
}

.summary-content h3 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--primary);
}

.summary-content p {
  margin: 4px 0 0;
  font-size: 0.9rem;
  color: var(--text-light);
}

/* Tabs Section */
.tabs-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 16px;
}

.tabs {
  display: flex;
  gap: 8px;
  background: white;
  padding: 4px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--card-border);
}

.tab-btn {
  border-radius: 8px;
  border: none;
  padding: 8px 20px;
  font-size: 0.9rem;
  font-weight: 600;
  background: transparent;
  color: var(--text-dark);
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active {
  background: linear-gradient(135deg, var(--primary), var(--peach));
  color: white;
}

.btn-add {
  border: none;
  border-radius: 12px;
  padding: 10px 20px;
  background: linear-gradient(135deg, var(--primary), var(--peach));
  color: #ffffff;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn-add:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 48, 73, 0.2);
}

.plus-icon {
  font-size: 1.2rem;
}

/* List Card */
.list-card {
  padding: 20px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.list-header h3 {
  margin: 0;
  color: var(--navy);
  font-size: 1.3rem;
  font-weight: 700;
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

.list-subtitle {
  margin: 0 0 16px;
  font-size: 0.85rem;
  color: var(--text-light);
}

/* Filter Bar */
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.filter-input {
  padding: 12px 16px;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.filter-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(0, 48, 73, 0.1);
}

.filter-select {
  padding: 12px 16px;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  font-size: 0.95rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-select:focus {
  outline: none;
  border-color: var(--primary);
}

/* States */
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

/* Grids */
.grocery-grid {
  display: grid;
  gap: 12px;
}

.history-grid {
  display: grid;
  gap: 10px;
}

/* Card */
.card {
  background: #ffffff;
  border-radius: 20px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--card-border);
}

/* Modal */
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
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
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

/* Form */
.add-form {
  margin-top: 8px;
}

.form-row {
  margin-bottom: 20px;
}

.two-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
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
.form-control select {
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  font-size: 0.95rem;
  transition: all 0.2s;
  font-family: inherit;
}

.form-control input:focus,
.form-control select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(0, 48, 73, 0.1);
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

/* Responsive */
@media (max-width: 1024px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }

  .tabs-section {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (max-width: 768px) {
  .two-cols {
    grid-template-columns: 1fr;
  }

  .filter-bar {
    flex-direction: column;
  }
}
</style>
