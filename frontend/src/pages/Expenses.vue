<template>
  <section class="expenses">
    <div class="expenses-header">
      <div>
        <h2>Bills & Expenses</h2>
        <p class="subtitle">Track shared expenses and settle up with your housemates 💰</p>
      </div>
    </div>

    <div class="summary-cards">
      <div class="card summary-card">
        <div class="summary-icon" style="background: #d4f1f0">💵</div>
        <div class="summary-content">
          <h3>€{{ yourTotalExpenses.toFixed(2) }}</h3>
          <p>You Paid This Month</p>
        </div>
      </div>

      <div class="card summary-card">
        <div class="summary-icon" style="background: #fef8ec">💤</div>
        <div class="summary-content">
          <h3>€{{ yourShare.toFixed(2) }}</h3>
          <p>Your Share</p>
        </div>
      </div>

      <div
        class="card summary-card"
        :class="{ 'owe-positive': youOwe < 0, 'owe-negative': youOwe > 0 }"
      >
        <div class="summary-icon" :style="{ background: youOwe > 0 ? '#ffe5e5' : '#e5ffe5' }">
          {{ youOwe > 0 ? '📤' : '📥' }}
        </div>
        <div class="summary-content">
          <h3>€{{ Math.abs(youOwe).toFixed(2) }}</h3>
          <p>{{ youOwe > 0 ? 'You Owe Others' : 'Others Owe You' }}</p>
        </div>
      </div>
    </div>

    <div class="main-grid">
      <div class="card bills-section">
        <div class="section-header">
          <h3>Bills This Month</h3>
          <button class="btn-add" @click="showModal = true">
            <span class="plus-icon">+</span>
            Add Bill
          </button>
        </div>

        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading expenses...</p>
        </div>

        <div v-else-if="expenses.length === 0" class="empty-state">
          <span class="empty-emoji">📋</span>
          <p>No bills yet this month</p>
        </div>

        <ExpenseItem
          v-else
          v-for="expense in expenses"
          :key="expense._id"
          :expense="expense"
          :currentUser="currentUser"
          @delete="deleteExpense"
        />
      </div>

      <aside class="sidebar">
        <div class="card sidebar-card">
          <h3>Who Owes Whom</h3>
          <p class="small-subtitle">Settlement breakdown</p>

          <div v-if="userActiveSettlements.length === 0" class="empty-msg">
            <span class="check-emoji">✨</span>
            <p>All settled up!</p>
          </div>

          <div
            v-for="settlement in userActiveSettlements"
            :key="settlement.id"
            class="settlement-item"
          >
            <div class="settlement-content">
              <p class="settlement-text">
                <strong :class="{ 'highlight-you': settlement.from === currentUser.name }">{{
                  settlement.from
                }}</strong>
                owes
                <strong :class="{ 'highlight-you': settlement.to === currentUser.name }">{{
                  settlement.to
                }}</strong>
              </p>
              <p class="settlement-amount">€{{ settlement.amount.toFixed(2) }}</p>
            </div>
            <button class="settle-btn" @click="settlePayment(settlement.id)">✓ Settle Up</button>
          </div>
        </div>

        <div class="card sidebar-card">
          <h3>Recent Settlements</h3>
          <p class="small-subtitle">Payment history</p>

          <div v-if="yourPaymentHistory.length === 0" class="empty-msg">
            <span class="history-emoji">📜</span>
            <p>No settlements yet</p>
          </div>

          <!-- NOTE: now coming from backend -->
          <div v-for="payment in yourPaymentHistory" :key="payment._id" class="history-item">
            <div class="history-icon">✅</div>
            <div class="history-content">
              <p class="history-text">
                <template v-if="payment.from === currentUser.name"
                  >You paid <strong>{{ payment.to }}</strong></template
                >
                <template v-else
                  ><strong>{{ payment.from }}</strong> paid you</template
                >
              </p>
              <p class="history-amount">€{{ Number(payment.amount).toFixed(2) }}</p>
              <p class="history-date">{{ formatDate(payment.createdAt) }}</p>
            </div>

            <!-- Undo is always available -->
            <button class="undo-btn" @click="undoPayment(payment._id)" title="Undo settlement">
              ↩️
            </button>
          </div>
        </div>
      </aside>
    </div>

    <transition name="modal-fade">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content">
          <div class="modal-header">
            <div>
              <h3>Add New Bill</h3>
              <p class="modal-subtitle">Enter bill details and choose who to split with</p>
            </div>
            <button class="close-btn" @click="closeModal">✕</button>
          </div>

          <form class="add-form" @submit.prevent="onSubmit">
            <div class="form-row">
              <div class="form-control">
                <label>Bill Name *</label>
                <input
                  v-model="form.title"
                  type="text"
                  placeholder="e.g. Rent, Electricity, Groceries"
                  required
                />
              </div>
            </div>

            <div class="form-row two-cols">
              <div class="form-control">
                <label>Amount *</label>
                <div class="input-with-icon">
                  <span class="currency-icon">€</span>
                  <input
                    v-model.number="form.amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    required
                    class="amount-input"
                  />
                </div>
              </div>

              <div class="form-control">
                <label>Who Paid? *</label>
                <select v-model="form.paidBy" required class="select-input">
                  <option value="">Select person</option>
                  <option v-for="member in houseMembers" :key="member" :value="member">
                    {{ member }}{{ member === currentUser.name ? ' (You)' : '' }}
                  </option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-control">
                <label>Split With *</label>
                <div class="split-selection-header">
                  <span class="split-helper">👥 Choose who should share this bill</span>
                  <button type="button" class="select-all-btn" @click="toggleSelectAll">
                    {{ isAllSelected ? '✕ Deselect All' : '✓ Select All' }}
                  </button>
                </div>
                <div class="checkbox-group">
                  <label class="checkbox-item" v-for="member in houseMembers" :key="member">
                    <input type="checkbox" :value="member" v-model="form.splitWith" />
                    <span class="checkbox-custom"></span>
                    <span class="checkbox-label">
                      {{ member }}
                      <span v-if="member === currentUser.name" class="you-badge">You</span>
                    </span>
                  </label>
                </div>
                <p v-if="form.splitWith.length === 0" class="validation-hint">
                  ⚠️ Please select at least one person
                </p>
              </div>
            </div>

            <div class="form-row two-cols">
              <div class="form-control">
                <label>Bill Type</label>
                <select v-model="form.type" class="select-input">
                  <option value="one-time">One-Time</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div class="form-control">
                <label>Purchase Date *</label>
                <input v-model="form.purchaseDate" type="date" required />
              </div>

              <div class="form-control">
                <label>Due Date</label>
                <input v-model="form.dueDate" type="date" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-control">
                <label>Notes (Optional)</label>
                <textarea
                  v-model="form.notes"
                  rows="2"
                  placeholder="Add any extra details..."
                  class="textarea-input"
                ></textarea>
              </div>
            </div>

            <div class="split-info" v-if="form.splitWith.length > 0 && form.amount > 0">
              <div class="split-header">
                <span class="split-icon">💡</span>
                <h4>Split Calculation</h4>
              </div>
              <div class="split-summary">
                <div class="split-row">
                  <span class="split-label">Total Amount:</span>
                  <span class="split-value">€{{ form.amount.toFixed(2) }}</span>
                </div>
                <div class="split-row">
                  <span class="split-label">Split Between:</span>
                  <span class="split-value"
                    >{{ form.splitWith.length }}
                    {{ form.splitWith.length === 1 ? 'person' : 'people' }}</span
                  >
                </div>
                <div class="split-row highlight">
                  <span class="split-label">Each Person Pays:</span>
                  <span class="split-value-large">€{{ perPersonAmount.toFixed(2) }}</span>
                </div>
              </div>
              <div class="split-members">
                <span class="members-icon">👥</span>
                <div class="members-list">
                  <span v-for="(member, index) in form.splitWith" :key="member" class="member-tag">
                    {{ member }}{{ index < form.splitWith.length - 1 ? ',' : '' }}
                  </span>
                </div>
              </div>
            </div>

            <p v-if="errorMessage" class="error-msg">
              <span class="error-icon">⚠️</span> {{ errorMessage }}
            </p>

            <div class="form-actions">
              <button type="button" class="btn-secondary" @click="closeModal">Cancel</button>
              <button
                type="submit"
                class="btn-primary"
                :disabled="isSubmitting || form.splitWith.length === 0"
              >
                <span class="btn-icon">{{ isSubmitting ? '⏳' : '+' }}</span>
                {{ isSubmitting ? 'Adding...' : 'Add Bill' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>

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
import ExpenseItem from '../components/expenses/ExpenseItem.vue'

export default {
  name: 'ExpensesPage',
  components: { ExpenseItem },
  data() {
    return {
      showModal: false,
      errorMessage: '',
      isLoading: false,
      isSubmitting: false,
      toastMessage: '',
      toastType: 'success',
      houseMembers: [],
      form: {
        title: '',
        amount: 0,
        paidBy: '',
        type: 'one-time',
        purchaseDate: '',
        dueDate: '',
        notes: '',
        splitWith: [],
      },
      expenses: [],

      // persisted settlements from backend (shared across accounts)
      settlementRecords: [],
    }
  },
  computed: {
    currentUser() {
      return this.$store.getters.currentUser
    },
    householdCode() {
      return this.$store.getters.householdCode
    },
    yourTotalExpenses() {
      return this.expenses
        .filter((exp) => exp.paidBy === this.currentUser.name)
        .reduce((sum, exp) => sum + exp.amount, 0)
    },
    yourShare() {
      return this.expenses.reduce((sum, exp) => {
        if (!exp.splitWith?.includes(this.currentUser.name)) return sum
        return sum + exp.perPerson
      }, 0)
    },
    youOwe() {
      let balance = 0

      // 1) Base balance from expenses (your existing logic)
      this.expenses.forEach((exp) => {
        const isInSplit = exp.splitWith.includes(this.currentUser.name)

        if (exp.paidBy === this.currentUser.name) {
          exp.splitWith.forEach((person) => {
            if (person !== this.currentUser.name) {
              balance -= exp.perPerson // others owe you
            }
          })
        } else if (isInSplit) {
          balance += exp.perPerson // you owe
        }
      })

      // 2) Apply settlements (IMPORTANT)
      // If you are the payer (from) → your "owe" reduces
      // If you are the receiver (to) → others owe you reduces (moves toward 0)
      ;(this.settlementRecords || []).forEach((s) => {
        const amt = Number(s.amount) || 0
        if (s.from === this.currentUser.name) balance -= amt
        if (s.to === this.currentUser.name) balance += amt
      })

      return balance
    },

    // now derived from backend settlements (shared)
    yourPaymentHistory() {
      return (this.settlementRecords || [])
        .filter((p) => p.from === this.currentUser.name || p.to === this.currentUser.name)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    },

    settlements() {
      const balances = {}

      // Initialize balances
      this.houseMembers.forEach((member) => {
        balances[member] = 0
      })

      this.expenses.forEach((exp) => {
        exp.splitWith.forEach((member) => {
          if (member === exp.paidBy) return

          balances[member] -= exp.perPerson
          balances[exp.paidBy] += exp.perPerson
        })
      })

      // Apply existing settlements to balances so remaining dues reduce
      ;(this.settlementRecords || []).forEach((s) => {
        const amt = Number(s.amount) || 0
        if (!amt) return
        if (balances[s.from] === undefined) balances[s.from] = 0
        if (balances[s.to] === undefined) balances[s.to] = 0

        // debtor pays → debtor becomes less negative, creditor becomes less positive
        balances[s.from] += amt
        balances[s.to] -= amt
      })

      const settlements = []
      let id = 1

      const debtors = Object.keys(balances).filter((p) => balances[p] < 0)
      const creditors = Object.keys(balances).filter((p) => balances[p] > 0)

      debtors.forEach((debtor) => {
        creditors.forEach((creditor) => {
          if (balances[debtor] === 0 || balances[creditor] === 0) return

          const amount = Math.min(Math.abs(balances[debtor]), balances[creditor])

          if (amount > 0.01) {
            settlements.push({
              id: id++,
              from: debtor,
              to: creditor,
              amount,
            })

            balances[debtor] += amount
            balances[creditor] -= amount
          }
        })
      })

      return settlements
    },

    // hide settlements that are already saved in DB
    activeSettlements() {
      return this.settlements.filter((s) => !this.isSettlementAlreadySettled(s))
    },

    userActiveSettlements() {
      if (!this.currentUser?.name) return []

      return this.activeSettlements.filter(
        (s) => s.from === this.currentUser.name || s.to === this.currentUser.name,
      )
    },

    perPersonAmount() {
      return this.form.amount && this.form.splitWith.length > 0
        ? this.form.amount / this.form.splitWith.length
        : 0
    },
    isAllSelected() {
      return this.form.splitWith.length === this.houseMembers.length && this.houseMembers.length > 0
    },
  },
  watch: {
    householdCode(newVal) {
      if (newVal) {
        this.fetchHouseholdMembers()
        this.fetchExpenses()
        this.fetchSettlements()
      }
    },
  },
  methods: {
    async fetchExpenses() {
      if (!this.householdCode) return
      this.isLoading = true
      try {
        const res = await axios.get(' https://cozyshare-backend.onrender.com/api/expenses', {
          params: { householdCode: this.householdCode },
        })
        this.expenses = res.data || []
        console.log('Fetched expenses:', this.expenses)
      } finally {
        this.isLoading = false
      }
    },

    async fetchHouseholdMembers() {
      if (!this.householdCode) return

      try {
        const res = await axios.get(
          ` https://cozyshare-backend.onrender.com/api/households/${this.householdCode}/members`,
        )

        this.houseMembers = (res.data || []).map((member) => member.name || member)
        console.log('Fetched household members:', this.houseMembers)
      } catch (err) {
        console.error('Error fetching household members', err)
        this.houseMembers = []
      }
    },

    // load settlements from backend
    async fetchSettlements() {
      if (!this.householdCode) return
      try {
        const res = await axios.get(' https://cozyshare-backend.onrender.com/api/settlements', {
          params: { householdCode: this.householdCode },
        })
        this.settlementRecords = res.data || []
      } catch (err) {
        console.error('Error fetching settlements', err)
        this.settlementRecords = []
      }
    },

    // check if a settlement is already saved
    isSettlementAlreadySettled(s) {
      return (this.settlementRecords || []).some((r) => {
        const sameFrom = r.from === s.from
        const sameTo = r.to === s.to
        const sameAmount = Math.abs(Number(r.amount) - Number(s.amount)) < 0.01
        return sameFrom && sameTo && sameAmount
      })
    },

    closeModal() {
      this.showModal = false
      this.resetForm()
      this.errorMessage = ''
    },
    resetForm() {
      this.form = {
        title: '',
        amount: 0,
        paidBy: '',
        type: 'one-time',
        purchaseDate: '',
        dueDate: '',
        notes: '',
        splitWith: [],
      }
    },
    toggleSelectAll() {
      this.form.splitWith = this.isAllSelected ? [] : [...this.houseMembers]
    },

    async onSubmit() {
      this.errorMessage = ''
      if (!this.form.title || !this.form.amount || !this.form.paidBy) {
        this.errorMessage = 'Please fill in all required fields.'
        return
      }
      if (this.form.splitWith.length === 0) {
        this.errorMessage = 'Please select at least one person to split the bill with.'
        return
      }
      if (!this.form.purchaseDate) {
        this.errorMessage = 'Please select a purchase date.'
        return
      }
      if (!this.householdCode) {
        this.errorMessage = 'No household code found.'
        return
      }

      this.isSubmitting = true
      try {
        const body = {
          ...this.form,
          purchaseDate: this.form.purchaseDate,
          dueDate: this.form.dueDate || null,
          householdCode: this.householdCode,
        }
        const res = await axios.post(' https://cozyshare-backend.onrender.com/api/expenses', body)
        this.expenses.unshift(res.data)
        this.closeModal()
        this.showToast('Bill added successfully!', 'success')
        this.fetchHouseholdMembers()
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'Error creating expense.'
      } finally {
        this.isSubmitting = false
      }
    },

    async deleteExpense(id) {
      try {
        await axios.delete(` https://cozyshare-backend.onrender.com/api/expenses/${id}`)
        this.expenses = this.expenses.filter((exp) => exp._id !== id)
        this.showToast('Bill deleted successfully', 'info')
        this.fetchHouseholdMembers()
      } catch (err) {
        console.error(err)
        this.showToast('Failed to delete bill', 'error')
      }
    },

    // persist settlement to backend so it appears for all users
    async settlePayment(settlementId) {
      const settlement = this.settlements.find((s) => s.id === settlementId)
      if (!settlement) return

      try {
        await axios.post(' https://cozyshare-backend.onrender.com/api/settlements', {
          householdCode: this.householdCode,
          from: settlement.from,
          to: settlement.to,
          amount: settlement.amount,
        })

        await this.fetchSettlements()

        this.showToast(
          `Settlement saved: ${settlement.from} → ${settlement.to} €${settlement.amount.toFixed(
            2,
          )}`,
          'success',
        )
      } catch (err) {
        console.error('Error saving settlement', err)
        this.showToast('Failed to save settlement', 'error')
      }
    },

    // UPDATED: undo settlement in backend
    async undoPayment(settlementMongoId) {
      try {
        await axios.delete(
          ` https://cozyshare-backend.onrender.com/api/settlements/${settlementMongoId}`,
        )
        await this.fetchSettlements()
        this.showToast('Settlement undone', 'info')
      } catch (err) {
        console.error('Undo settlement error', err)
        this.showToast('Failed to undo settlement', 'error')
      }
    },

    showToast(message, type = 'success') {
      this.toastMessage = message
      this.toastType = type
      setTimeout(() => (this.toastMessage = ''), 5)
    },

    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    },
  },
  mounted() {
    if (this.householdCode) {
      this.fetchHouseholdMembers()
      this.fetchExpenses()
      this.fetchSettlements()
    }
  },
}
</script>

<style scoped>
.expenses {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px 40px;
}

.expenses-header h2 {
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

.summary-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin: 24px 0;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  transition: transform 0.2s;
}

.summary-card:hover {
  transform: translateY(-2px);
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

.owe-positive .summary-content h3 {
  color: #059669;
}
.owe-negative .summary-content h3 {
  color: #dc2626;
}

.main-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 32px;
}

.bills-section {
  padding: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  color: var(--navy);
  font-size: 1.3rem;
  font-weight: 700;
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

.loading-state {
  text-align: center;
  padding: 48px 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 16px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
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

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sidebar-card {
  padding: 18px;
}

.sidebar-card h3 {
  margin: 0 0 4px;
  color: var(--navy);
  font-size: 1.1rem;
  font-weight: 700;
}

.small-subtitle {
  margin: 0 0 16px;
  font-size: 0.85rem;
  color: var(--text-light);
}

.empty-msg {
  text-align: center;
  padding: 24px 16px;
  color: var(--text-light);
}

.check-emoji,
.history-emoji {
  display: block;
  font-size: 2rem;
  margin-bottom: 8px;
}

.settlement-item {
  padding: 14px;
  background: linear-gradient(135deg, #fff5f5, #fef2f2);
  border-radius: 12px;
  margin-bottom: 10px;
  border: 1px solid #fecaca;
  transition: all 0.2s;
}

.settlement-item:hover {
  transform: translateX(2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.settlement-content {
  margin-bottom: 10px;
}

.settlement-text {
  margin: 0 0 6px;
  font-size: 0.9rem;
  color: var(--text-dark);
}

.highlight-you {
  color: var(--primary);
  font-weight: 700;
}

.settlement-amount {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 700;
  color: #dc2626;
}

.settle-btn {
  width: 100%;
  border: none;
  border-radius: 8px;
  padding: 10px;
  background: var(--primary);
  color: white;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.settle-btn:hover {
  background: var(--navy);
  transform: translateY(-1px);
}

.history-item {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px;
  background: linear-gradient(135deg, #f0fdf4, #f9fafb);
  border-radius: 12px;
  margin-bottom: 10px;
  border: 1px solid #d1fae5;
}

.history-icon {
  font-size: 1.5rem;
}

.history-content {
  flex: 1;
}

.history-text {
  margin: 0 0 4px;
  font-size: 0.85rem;
}

.history-amount {
  margin: 0 0 2px;
  font-size: 1rem;
  font-weight: 700;
  color: #059669;
}

.history-date {
  margin: 0;
  font-size: 0.75rem;
  color: var(--text-light);
}

.undo-btn {
  background: transparent;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.2s;
}

.undo-btn:hover {
  background: #f3f4f6;
  transform: scale(1.1);
}

.card {
  background: #ffffff;
  border-radius: 20px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--card-border);
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
  max-width: 600px;
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
}

.close-btn:hover {
  background: #e5e7eb;
  transform: rotate(90deg);
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
  box-shadow: 0 0 0 3px rgba(0, 48, 73, 0.1);
}

.input-with-icon {
  position: relative;
}

.currency-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.1rem;
  color: var(--text-light);
  font-weight: 600;
}

.amount-input {
  padding-left: 36px !important;
}

.split-selection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.split-helper {
  font-size: 0.85rem;
  color: var(--text-light);
}

.select-all-btn {
  background: var(--primary-light);
  border: none;
  border-radius: 8px;
  padding: 6px 12px;
  color: var(--primary);
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.2s;
}

.select-all-btn:hover {
  background: var(--primary);
  color: white;
}

.checkbox-group {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.2s;
  position: relative;
}

.checkbox-item:hover {
  background: white;
}

.checkbox-item input[type='checkbox'] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.checkbox-custom {
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  background: white;
  flex-shrink: 0;
}

.checkbox-item input:checked + .checkbox-custom {
  background: var(--primary);
  border-color: var(--primary);
}

.checkbox-item input:checked + .checkbox-custom::after {
  content: '✓';
  color: white;
  font-size: 0.9rem;
  font-weight: bold;
}

.checkbox-label {
  font-size: 0.9rem;
  color: var(--text-dark);
  font-weight: 500;
}

.you-badge {
  display: inline-block;
  margin-left: 6px;
  padding: 2px 8px;
  background: var(--primary-light);
  color: var(--primary);
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
}

.validation-hint {
  margin: 8px 0 0;
  padding: 8px 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  font-size: 0.85rem;
  color: #dc2626;
}

.split-info {
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  padding: 20px;
  border-radius: 16px;
  margin-bottom: 20px;
  border: 2px solid #bae6fd;
}

.split-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.split-icon {
  font-size: 1.5rem;
}

.split-header h4 {
  margin: 0;
  color: var(--navy);
  font-size: 1rem;
  font-weight: 700;
}

.split-summary {
  background: white;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 16px;
}

.split-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.split-row.highlight {
  padding-top: 12px;
  margin-top: 8px;
  border-top: 2px solid #e0f2fe;
}

.split-label {
  font-size: 0.9rem;
  color: var(--text-light);
  font-weight: 500;
}

.split-value {
  font-size: 0.95rem;
  color: var(--text-dark);
  font-weight: 600;
}

.split-value-large {
  font-size: 1.4rem;
  color: var(--primary);
  font-weight: 700;
}

.split-members {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: white;
  border-radius: 12px;
  font-size: 0.9rem;
}

.members-icon {
  font-size: 1.2rem;
}

.members-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.member-tag {
  color: var(--primary);
  font-weight: 600;
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

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 48, 73, 0.3);
}

.btn-primary:disabled {
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

@media (max-width: 1024px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }

  .main-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .two-cols {
    grid-template-columns: 1fr;
  }

  .checkbox-group {
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
