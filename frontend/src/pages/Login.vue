<template>
  <section class="auth-page">
    <div class="auth-card">
      <!-- Tabs -->
      <div class="login-page">
        <h2 style="text-align: center">Welcome to CozyShare</h2>
      </div>
      <div class="tabs">
        <button :class="['tab-btn', { active: mode === 'login' }]" @click="switchMode('login')">
          Login
        </button>
        <button
          :class="['tab-btn', { active: mode === 'register' }]"
          @click="switchMode('register')"
        >
          Register
        </button>
      </div>

      <!-- SUCCESS BANNER after register -->
      <p v-if="mode === 'login' && successMessage" class="success">
        {{ successMessage }}
        <span v-if="lastHouseholdCode">
          &nbsp;Your household code is
          <strong>{{ lastHouseholdCode }}</strong
          >. Share this with your flatmates.
        </span>
      </p>

      <p class="subtitle">
        <span v-if="mode === 'login'"> Welcome back! Please login to your account. </span>
        <span v-else> Create a new household or join one using an invite code. </span>
      </p>

      <!-- LOGIN FORM -->
      <form v-if="mode === 'login'" class="form" @submit.prevent="submitLogin">
        <div class="form-control">
          <label>Email</label>
          <input v-model.trim="email" type="email" placeholder="you@example.com" required />
        </div>

        <div class="form-control">
          <label>Password</label>
          <input v-model="password" type="password" placeholder="••••••••" required />
        </div>

        <p v-if="error" class="error">{{ error }}</p>

        <button type="submit" class="btn-primary full">Login</button>
      </form>

      <!-- REGISTER FORM -->
      <form v-else class="form" @submit.prevent="submitRegister">
        <div class="form-control">
          <label>Name</label>
          <input v-model.trim="name" type="text" placeholder="Navya" required />
        </div>

        <div class="form-control">
          <label>Email</label>
          <input v-model.trim="email" type="email" placeholder="you@example.com" required />
        </div>

        <div class="form-control">
          <label>Password</label>
          <input v-model="password" type="password" placeholder="Min. 6 characters" required />
        </div>

        <div class="form-control">
          <label>Confirm Password</label>
          <input
            v-model="confirmPassword"
            type="password"
            placeholder="Repeat your password"
            required
          />
        </div>

        <!-- HOUSEHOLD MODE -->
        <div class="form-control">
          <label>Household</label>
          <div class="radio-row">
            <label>
              <input type="radio" value="create" v-model="householdMode" />
              Create new household
            </label>
            <label>
              <input type="radio" value="join" v-model="householdMode" />
              Join with invite code
            </label>
          </div>
        </div>

        <!-- Household name when creating -->
        <div v-if="householdMode === 'create'" class="form-control">
          <label>Household name</label>
          <input v-model.trim="householdName" type="text" placeholder="e.g. Heidelberg Flat 3A" />
        </div>

        <!-- Invite code when joining -->
        <div v-if="householdMode === 'join'" class="form-control">
          <label>Invite code</label>
          <input v-model.trim="inviteCode" type="text" placeholder="e.g. EXNY2S" />
          <p class="help">Ask your flatmate to share the household code.</p>
        </div>

        <p v-if="error" class="error">{{ error }}</p>

        <button type="submit" class="btn-primary full">Create account</button>
      </form>
    </div>
  </section>
</template>

<script>
import axios from 'axios'

export default {
  name: 'LoginPage',

  data() {
    return {
      mode: 'login', // 'login' or 'register'

      // shared
      email: '',
      password: '',

      // register-only
      confirmPassword: '',
      name: '',
      householdMode: 'create', // 'create' | 'join'
      householdName: '',
      inviteCode: '',

      // messages
      error: '',
      successMessage: '',
      lastHouseholdCode: '',
    }
  },

  computed: {
    isAuthenticated() {
      return this.$store.getters.isAuthenticated
    },
  },

  methods: {
    switchMode(newMode) {
      this.mode = newMode
      this.error = ''
      if (newMode === 'register') {
        this.successMessage = ''
        this.lastHouseholdCode = ''
      }
    },

    async submitLogin() {
      this.error = ''

      if (!this.email || !this.password) {
        this.error = 'Email and password are required.'
        return
      }

      try {
        const res = await axios.post('https://cozyshare-backend.onrender.com/api/auth/login', {
          email: this.email,
          password: this.password,
        })

        const raw = res.data
        const user = raw.user
        const token = raw.token
        const householdCode = user.householdCode || null

        // use Vuex action (this also saves to localStorage)
        this.$store.dispatch('login', {
          user,
          token,
          householdCode,
        })

        this.$router.push('/home')
      } catch (err) {
        console.error('Login error', err)
        this.error = err.response?.data?.message || 'Login failed. Please try again.'
      }
    },

    async submitRegister() {
      this.error = ''
      this.successMessage = ''
      this.lastHouseholdCode = ''

      // basic checks
      if (!this.name || !this.email || !this.password) {
        this.error = 'All fields are required.'
        return
      }

      if (this.password.length < 6) {
        this.error = 'Password should be at least 6 characters.'
        return
      }

      if (this.password !== this.confirmPassword) {
        this.error = 'Passwords do not match.'
        return
      }

      // create-household specific validation
      if (this.householdMode === 'create') {
        if (!this.householdName || !this.householdName.trim()) {
          this.error = 'Household name is required to create a household'
          return
        }
      }

      // join-with-code specific validation
      if (this.householdMode === 'join') {
        const code = this.inviteCode ? this.inviteCode.trim() : ''
        if (!code) {
          this.error = 'Invite code is required to join a household'
          return
        }
      }

      try {
        // BODY SHAPE must match authRoutes.js
        const body = {
          name: this.name,
          email: this.email,
          password: this.password,
          mode: this.householdMode, // 'create' or 'join'
          householdName: this.householdMode === 'create' ? this.householdName.trim() : undefined,
          inviteCode: this.householdMode === 'join' ? this.inviteCode.trim() : undefined,
        }

        const res = await axios.post(
          'https://cozyshare-backend.onrender.com/api/auth/register',
          body,
        )

        const raw = res.data
        const codeFromBackend = raw.householdCode || raw.user?.householdCode || null

        // do NOT auto-login → show success & code
        this.successMessage = 'Registered successfully. Please login to continue.'
        this.lastHouseholdCode =
          codeFromBackend || (this.householdMode === 'join' ? this.inviteCode.trim() : '')

        // switch to login tab & clear register fields
        this.mode = 'login'
        this.password = ''
        this.confirmPassword = ''
        this.householdName = ''
        this.inviteCode = ''
      } catch (err) {
        console.error('Register error', err)
        this.error =
          err.response?.data?.message ||
          'Registration failed. Please check your details and try again.'
      }
    },
  },

  mounted() {
    if (this.isAuthenticated) {
      this.$router.push('/home')
    }
  },
}
</script>

<style scoped>
.auth-page {
  min-height: calc(100vh - 4.2rem);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--cream);
  padding: 1.5rem;
}

.auth-card {
  width: 100%;
  max-width: 440px;
  background: #fff;
  border-radius: 20px;
  padding: 1.5rem 1.7rem 1.8rem;
  box-shadow: var(--soft-shadow);
  border: 1px solid var(--card-border);
}

/* Tabs */
.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.tab-btn {
  flex: 1;
  padding: 0.4rem 0.7rem;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  background: var(--primary-light);
  color: var(--navy);
}

.tab-btn.active {
  background: var(--primary);
  color: #fff;
}

/* Messages */
.subtitle {
  margin: 0 0 0.8rem;
  font-size: 0.85rem;
  color: var(--text-light);
}

.success {
  margin: 0 0 0.4rem;
  padding: 0.4rem 0.6rem;
  border-radius: 10px;
  background: #ecfdf5;
  color: #166534;
  font-size: 0.8rem;
}

.error {
  color: #b91c1c;
  font-size: 0.8rem;
  margin-bottom: 0.4rem;
}

/* Form */
.form {
  margin-top: 0.3rem;
}

.form-control {
  margin-bottom: 0.75rem;
}

.form-control label {
  display: block;
  font-size: 0.85rem;
  color: var(--text-light);
  margin-bottom: 0.2rem;
}

.form-control input {
  width: 100%;
  padding: 0.45rem 0.7rem;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  font-size: 0.9rem;
}

.radio-row {
  display: flex;
  gap: 1rem;
  font-size: 0.82rem;
  color: var(--text-dark);
}

.radio-row input {
  margin-right: 4px;
}

.help {
  margin-top: 2px;
  font-size: 0.75rem;
  color: var(--text-light);
}

/* Buttons */
.btn-primary {
  border: none;
  border-radius: 999px;
  padding: 0.55rem 1rem;
  background: linear-gradient(135deg, var(--primary), var(--peach));
  color: #fff;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
}

.btn-primary.full {
  width: 100%;
}
</style>
