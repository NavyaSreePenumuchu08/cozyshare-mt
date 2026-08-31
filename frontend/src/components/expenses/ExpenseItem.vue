<template>
  <article class="expense-item">
    <div class="expense-icon" :style="{ background: typeColor }">
      {{ typeIcon }}
    </div>

    <div class="expense-main">
      <div class="title-row">
        <h4 class="title">{{ expense.title }}</h4>
        <span class="expense-type-badge">{{ expense.type }}</span>
      </div>

      <div class="expense-details">
        <div class="detail-item">
          <span class="label">Amount:</span>
          <span class="value amount"
            >{{ currencySymbol }}{{ Number(expense.amount || 0).toFixed(2) }}</span
          >
        </div>

        <div class="detail-item">
          <span class="label">Paid by:</span>
          <span class="value" :class="{ 'paid-by-you': isPaidByYou }">
            {{ expense.paidBy }}
            {{ isPaidByYou ? '(You)' : '' }}
          </span>
        </div>

        <div class="detail-item">
          <span class="label">Your share:</span>
          <span class="value share">
            {{ currencySymbol }}{{ Number(yourShare || 0).toFixed(2) }}
          </span>
        </div>

        <div class="detail-item">
          <span class="label">Purchased on:</span>
          <span class="value">{{ formatDate(expense.purchaseDate) }}</span>
        </div>

        <div v-if="expense.dueDate" class="detail-item">
          <span class="label">Due:</span>
          <span class="value">{{ formatDate(expense.dueDate) }}</span>
        </div>
      </div>

      <p v-if="expense.notes" class="notes">{{ expense.notes }}</p>
    </div>

    <div class="expense-actions">
      <!-- Emit ONLY the id -->
      <button class="delete-btn" @click="$emit('delete', expense._id)" title="Delete bill">
        🗑️
      </button>
    </div>
  </article>
</template>

<script>
export default {
  name: 'ExpenseItem',

  props: {
    expense: {
      type: Object,
      required: true,
    },
    // parent passes currentUser object, so accept Object
    currentUser: {
      type: Object,
      default: null,
    },
  },

  emits: ['delete'],

  computed: {
    currentUserName() {
      return this.currentUser?.name || this.currentUser?.email || ''
    },

    isPaidByYou() {
      return this.expense.paidBy === this.currentUserName
    },

    yourShare() {
      // If you are not included in the split, you owe nothing
      if (!this.expense.splitWith?.includes(this.currentUserName)) {
        return 0
      }
      return this.expense.perPerson || 0
    },

    currencySymbol() {
      const symbols = {
        EUR: '€',
        USD: '$',
        GBP: '£',
        INR: '₹',
      }

      return symbols[this.expense.currency] || '€'
    },

    typeIcon() {
      return this.expense.type === 'monthly' ? '🔄' : '💳'
    },

    typeColor() {
      return this.expense.type === 'monthly' ? '#d4f1f0' : '#fef8ec'
    },
  },

  methods: {
    formatDate(dateString) {
      if (!dateString) return ''
      return new Date(dateString).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    },
  },
}
</script>

<style scoped>
.expense-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #ffffff, #fafbfc);
  border-radius: 16px;
  border: 1px solid var(--card-border);
  margin-bottom: 12px;
  transition: all 0.2s;
}

.expense-item:hover {
  border-color: var(--primary);
  box-shadow: 0 4px 12px rgba(0, 48, 73, 0.1);
  transform: translateY(-2px);
}

/* Icon */
.expense-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  flex-shrink: 0;
}

/* Main Content */
.expense-main {
  flex: 1;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--navy);
}

.expense-type-badge {
  font-size: 0.7rem;
  padding: 4px 10px;
  border-radius: 8px;
  font-weight: 600;
  text-transform: uppercase;
  background: var(--primary-light);
  color: var(--primary);
  letter-spacing: 0.5px;
}

/* Details Grid */
.expense-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 16px;
  margin-bottom: 8px;
}

.detail-item {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.label {
  font-size: 0.8rem;
  color: var(--text-light);
  font-weight: 500;
}

.value {
  font-size: 0.9rem;
  color: var(--text-dark);
  font-weight: 600;
}

.value.amount {
  font-size: 1.1rem;
  color: var(--primary);
}

.value.share {
  color: var(--peach);
}

.paid-by-you {
  color: var(--primary);
  font-weight: 700;
}

/* Notes */
.notes {
  margin: 8px 0 0;
  font-size: 0.85rem;
  color: var(--text-medium);
  font-style: italic;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 3px solid var(--primary-light);
}

/* Actions */
.expense-actions {
  display: flex;
  align-items: flex-start;
  padding-top: 4px;
}

.delete-btn {
  background: transparent;
  border: none;
  font-size: 1.3rem;
  cursor: pointer;
  transition: all 0.2s;
  opacity: 0.6;
  padding: 4px;
}

.delete-btn:hover {
  opacity: 1;
  transform: scale(1.15);
}

/* Responsive */
@media (max-width: 768px) {
  .expense-details {
    grid-template-columns: 1fr;
  }

  .expense-item {
    flex-direction: column;
  }

  .expense-icon {
    align-self: flex-start;
  }
}

/* Modal styles remain (unused currently but kept) */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}

.modal-content.small {
  background: white;
  padding: 24px;
  border-radius: 16px;
  width: 320px;
  text-align: center;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.btn-danger {
  background: #dc2626;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 10px;
  cursor: pointer;
}

.btn-danger:hover {
  background: #b91c1c;
}
</style>
