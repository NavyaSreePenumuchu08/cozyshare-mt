<template>
  <header class="header">
    <div class="header__logo">
      <router-link to="/" class="logo-link">
        <img class="logo-img" src="@/logo.png" alt="CozyShare logo" />
      </router-link>
      <router-link to="/" class="logo-text">CozyShare</router-link>
    </div>

    <nav class="header__nav" v-if="isLoggedIn">
      <ul>
        <li>
          <router-link to="/home" active-class="active">Home</router-link>
        </li>
        <li>
          <router-link to="/chores" active-class="active">Chores</router-link>
        </li>
        <li>
          <router-link to="/groceries" active-class="active">Groceries</router-link>
        </li>
        <li>
          <router-link to="/expenses" active-class="active">Expenses</router-link>
        </li>
        <li>
          <router-link to="/ai-assistant" active-class="active">AI Assistant</router-link>
        </li>
      </ul>
    </nav>

    <div class="header__actions">
      <div v-if="isLoggedIn" class="user-info">
        <span class="welcome">Hi, {{ userName || 'Roomie' }} </span>
        <span v-if="householdName" > Name:{{ householdName }} </span>
        <span v-if="householdCode" class="household-chip"> Code: {{ householdCode }} </span>
      </div>
      <button v-if="isLoggedIn" class="btn btn-light" @click="logout">Logout</button>
    </div>
  </header>
</template>

<script>
export default {
  name: 'HeaderComponent',
  computed: {
    isLoggedIn() {
      return this.$store.getters.isAuthenticated
    },
    userName() {
      return this.$store.getters.userName
    },
    householdName() {
      return this.$store.getters.householdName
    },
    householdCode() {
      return this.$store.getters.householdCode
    },
  },
  methods: {
    goToLogin() {
      this.$router.push('/login')
    },
    logout() {
      this.$store.dispatch('logout')
      this.$router.push('/login')
    },
  },
}
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  height: 4.2rem;
  background: linear-gradient(135deg, var(--primary), var(--peach));
  color: white;
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.25);
  position: sticky;
  top: 0;
  z-index: 1000;
}

/* Logo */
.header__logo {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.logo-link {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  text-decoration: none;
}

.logo-img {
  width: 2.8rem;
  height: 2.8rem;
  border-radius: 999px;
  background: #fefcfb;
  padding: 6px;
  object-fit: contain;
}

.logo-text {
  font-weight: 800;
  font-size: 1.25rem;
  letter-spacing: 0.06em;
  text-decoration: none;
  color: white;
}

/* Nav */
.header__nav ul {
  display: flex;
  gap: 1rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.header__nav a {
  color: white;
  text-decoration: none;
  font-weight: 500;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  transition: background 0.2s ease;
}

.header__nav a:hover {
  background: rgba(255, 255, 255, 0.12);
}

.header__nav a.active {
  background: rgba(255, 255, 255, 0.24);
}

/* Actions */
.header__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.welcome {
  font-size: 0.85rem;
}

.household-chip {
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
}

/* Buttons */
.btn {
  border-radius: 999px;
  padding: 0.3rem 0.9rem;
  font-size: 0.85rem;
  border: none;
  cursor: pointer;
}

.btn-light {
  background: white;
  color: var(--navy);
  font-weight: 600;
}

.btn-outline {
  background: transparent;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.4);
}
</style>
