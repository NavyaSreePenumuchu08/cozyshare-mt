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

    <!-- WEATHER + AI HOUSEHOLD SUGGESTION -->
    <div class="card weather-card">
      <div class="section-header">
        <div>
          <h3>Weather</h3>
          <p class="section-subtitle">Weather-aware household recommendations</p>
        </div>

        <button class="refresh-btn" @click="fetchWeather" title="Refresh weather">🔄</button>
      </div>

      <div v-if="weatherLoading" class="weather-loading">Loading weather...</div>

      <div v-else-if="weather" class="weather-content">
        <div class="weather-main">
          <div class="weather-icon">
            {{ weatherIcon }}
          </div>

          <div>
            <div class="weather-location">
              {{ weather.location }}
            </div>

            <div class="weather-temperature">{{ weather.temperature }}°C</div>

            <div class="weather-condition">
              {{ weatherDescription }}
            </div>
          </div>
        </div>

        <div class="weather-details">
          <div class="weather-detail">
            <span>🌡️ Feels like</span>
            <strong>{{ weather.feelsLike }}°C</strong>
          </div>

          <div class="weather-detail">
            <span>💧 Humidity</span>
            <strong>{{ weather.humidity }}%</strong>
          </div>

          <!-- <div class="weather-detail">
            <span>🌧️ Rain</span>
            <strong>{{ weather.precipitation }} mm</strong>
          </div> -->

          <div class="weather-detail">
            <span>🌧️ Rain</span>

            <strong> {{ weather.rainProbability }}% </strong>
          </div>

          <div class="weather-detail">
            <span>💨 Wind</span>
            <strong>{{ weather.windSpeed }} km/h</strong>
          </div>
        </div>

        <div class="weather-ai-box">
          <div class="weather-ai-header">
            <span class="weather-ai-icon">🤖</span>

            <div>
              <strong>CozyShare AI Suggestion</strong>
              <p>Based on today's weather</p>
            </div>
          </div>

          <p v-if="weatherSuggestionLoading" class="weather-ai-text">Preparing a suggestion...</p>

          <p v-else class="weather-ai-text">
            {{ weatherSuggestion || 'No suggestion available at the moment.' }}
          </p>
        </div>
      </div>

      <p v-else-if="weatherError" class="error-msg">⚠️ {{ weatherError }}</p>
    </div>

    <!-- SMART HOUSEHOLD ANALYTICS -->
    <div class="analytics-section">
      <div class="section-header">
        <div>
          <h3>Household Insights</h3>
          <p class="section-subtitle">A quick overview of your household activity</p>
        </div>
      </div>

      <div class="analytics-stats">
        <div class="analytics-card">
          <div class="analytics-icon">📋</div>

          <div>
            <div class="analytics-number">
              {{ totalChores }}
            </div>

            <div class="analytics-label">Total Chores</div>
          </div>
        </div>

        <div class="analytics-card">
          <div class="analytics-icon">✅</div>

          <div>
            <div class="analytics-number">
              {{ completedChores }}
            </div>

            <div class="analytics-label">Completed</div>
          </div>
        </div>

        <div class="analytics-card">
          <div class="analytics-icon">⏳</div>

          <div>
            <div class="analytics-number">
              {{ pendingChores }}
            </div>

            <div class="analytics-label">Pending</div>
          </div>
        </div>

        <div class="analytics-card">
          <div class="analytics-icon">🤖</div>

          <div>
            <div class="analytics-number">
              {{ smartTasks }}
            </div>

            <div class="analytics-label">AI / AR Tasks</div>
          </div>
        </div>
      </div>

      <!-- COMPLETION RATE -->
      <div class="card analytics-detail-card">
        <div class="analytics-detail-header">
          <div>
            <h3>Chore Completion</h3>

            <p class="section-subtitle">Household completion progress</p>
          </div>

          <span class="completion-percentage"> {{ completionRate }}% </span>
        </div>

        <div class="progress-track">
          <div class="progress-fill" :style="{ width: `${completionRate}%` }"></div>
        </div>

        <div class="completion-info">
          <span> ✅ {{ completedChores }} completed </span>

          <span> ⏳ {{ pendingChores }} pending </span>
        </div>
      </div>

      <!-- MEMBER WORKLOAD -->
      <div v-if="memberWorkload.length" class="card analytics-detail-card">
        <div class="section-header">
          <div>
            <h3>Household Workload</h3>

            <p class="section-subtitle">Chore distribution between household members</p>
          </div>
        </div>

        <div class="workload-list">
          <div v-for="member in memberWorkload" :key="member.name" class="workload-row">
            <div class="workload-member">
              <div class="member-avatar">
                {{ member.name.charAt(0).toUpperCase() }}
              </div>

              <div>
                <strong>{{ member.name }}</strong>

                <p>{{ member.completed }} completed · {{ member.pending }} pending</p>
              </div>
            </div>

            <span class="workload-count">
              {{ member.total }}
            </span>
          </div>
        </div>
      </div>

      <!-- TASK SOURCES + CATEGORIES -->
      <div class="analytics-grid">
        <div class="card analytics-detail-card">
          <div class="section-header">
            <div>
              <h3>Task Sources</h3>

              <p class="section-subtitle">Manual and intelligent task creation</p>
            </div>
          </div>

          <div class="source-row">
            <span>👤 Manual Tasks</span>
            <strong>{{ manualTasks }}</strong>
          </div>

          <div class="source-row">
            <span>🤖 AI / AR Tasks</span>
            <strong>{{ smartTasks }}</strong>
          </div>
        </div>

        <div class="card analytics-detail-card">
          <div class="section-header">
            <div>
              <h3>Task Categories</h3>

              <p class="section-subtitle">Most common household activities</p>
            </div>
          </div>

          <div v-if="categoryStats.length" class="category-list">
            <div
              v-for="category in categoryStats.slice(0, 5)"
              :key="category.name"
              class="source-row"
            >
              <span>{{ category.name }}</span>
              <strong>{{ category.count }}</strong>
            </div>
          </div>

          <p v-else class="empty-message">No categorized chores yet.</p>
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

      // Weather
      weather: null,
      weatherLoading: false,
      weatherSuggestion: '',
      weatherSuggestionLoading: false,
      weatherError: '',
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

    totalChores() {
      return this.allChores.length
    },

    completedChores() {
      return this.allChores.filter((chore) => chore.completed).length
    },

    pendingChores() {
      return this.allChores.filter((chore) => !chore.completed).length
    },

    completionRate() {
      if (this.totalChores === 0) return 0

      return Math.round((this.completedChores / this.totalChores) * 100)
    },

    smartTasks() {
      return this.allChores.filter((chore) => {
        const source = (chore.source || '').toLowerCase()

        return source.includes('ai') || source.includes('ar')
      }).length
    },

    manualTasks() {
      return this.allChores.filter((chore) => {
        const source = (chore.source || 'Manual').toLowerCase()

        return !source.includes('ai') && !source.includes('ar')
      }).length
    },

    memberWorkload() {
      const workload = {}

      this.allChores.forEach((chore) => {
        const member = chore.assignedTo || 'Shared'

        if (!workload[member]) {
          workload[member] = {
            total: 0,
            completed: 0,
            pending: 0,
          }
        }

        workload[member].total += 1

        if (chore.completed) {
          workload[member].completed += 1
        } else {
          workload[member].pending += 1
        }
      })

      return Object.entries(workload)
        .map(([name, stats]) => ({
          name,
          ...stats,
        }))
        .sort((a, b) => b.total - a.total)
    },

    categoryStats() {
      const categories = {}

      this.allChores.forEach((chore) => {
        const category = chore.category || 'General'

        categories[category] = (categories[category] || 0) + 1
      })

      return Object.entries(categories)
        .map(([name, count]) => ({
          name,
          count,
        }))
        .sort((a, b) => b.count - a.count)
    },

    weatherIcon() {
      if (!this.weather) return '🌤️'
      if (this.weather.rainExpectedSoon) {
        return '🌧️'
      }

      const code = this.weather.weatherCode

      if ([0].includes(code)) return '☀️'
      if ([1, 2].includes(code)) return '🌤️'
      if ([3].includes(code)) return '☁️'
      if ([45, 48].includes(code)) return '🌫️'

      if ([51, 53, 55, 56, 57].includes(code)) {
        return '🌦️'
      }

      if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
        return '🌧️'
      }

      if ([71, 73, 75, 77, 85, 86].includes(code)) {
        return '❄️'
      }

      if ([95, 96, 99].includes(code)) {
        return '⛈️'
      }

      return '🌤️'
    },

    weatherDescription() {
      if (!this.weather) return ''

      const code = this.weather.weatherCode

      // Forecast takes priority when rain is expected soon
      if (
        this.weather.rainExpectedSoon &&
        ![61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code)
      ) {
        return 'Showers expected'
      }

      if (code === 0) return 'Clear sky'

      if (code === 1) {
        return 'Mostly clear'
      }

      if (code === 2) {
        return 'Partly cloudy'
      }

      if (code === 3) {
        return 'Cloudy'
      }

      if ([45, 48].includes(code)) {
        return 'Foggy'
      }

      if ([51, 53, 55, 56, 57].includes(code)) {
        return 'Drizzle'
      }

      if ([61, 63, 65, 66, 67].includes(code)) {
        return 'Rain'
      }

      if ([80, 81, 82].includes(code)) {
        return 'Rain showers'
      }

      if ([71, 73, 75, 77, 85, 86].includes(code)) {
        return 'Snow'
      }

      if ([95, 96, 99].includes(code)) {
        return 'Thunderstorm'
      }

      return 'Current weather'
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

      const res = await axios.get(' https://cozyshare-mt-backend.onrender.com/api/notices', {
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
      const res = await axios.get(' https://cozyshare-mt-backend.onrender.com/api/groceries', {
        params: { householdCode: this.householdCode },
      })
      this.allGroceries = res.data || []
    },

    async fetchChores() {
      if (!this.householdCode) return
      const res = await axios.get(' https://cozyshare-mt-backend.onrender.com/api/chores', {
        params: { householdCode: this.householdCode },
      })
      this.allChores = res.data || []
    },

    async fetchExpenses() {
      if (!this.householdCode) return
      const res = await axios.get(' https://cozyshare-mt-backend.onrender.com/api/expenses', {
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

        const res = await axios.post(' https://cozyshare-mt-backend.onrender.com/api/notices', body)

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
          ` https://cozyshare-mt-backend.onrender.com/api/notices/${id}/like`,
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
          ` https://cozyshare-mt-backend.onrender.com/api/notices/${id}/comments`,
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
        await axios.put(` https://cozyshare-mt-backend.onrender.com/api/notices/${notice._id}`, {
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
        await axios.delete(` https://cozyshare-mt-backend.onrender.com/api/notices/${id}`, {
          data: { user: me }, //  backend needs this for "only author can delete"
        })
      } catch (err) {
        console.error('Delete failed', err)
        alert(err.response?.data?.message || 'Delete failed')
        this.notices = backup // restore if delete rejected
      }
    },

    async fetchWeather() {
      try {
        this.weatherLoading = true
        this.weatherError = ''

        let latitude
        let longitude
        let locationName = 'Your location'

        locationName = await this.getLocationName(latitude, longitude)

        // Try to use the user's real location
        try {
          const position = await new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
              reject(new Error('Geolocation is not supported'))
              return
            }

            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 5 * 60 * 1000,
            })
          })

          latitude = position.coords.latitude
          longitude = position.coords.longitude
        } catch (locationError) {
          console.warn('GPS location unavailable. Trying approximate location:', locationError)

          try {
            const locationResponse = await axios.get(
              'https://api.bigdatacloud.net/data/reverse-geocode-client',
              {
                params: {
                  localityLanguage: 'en',
                },
              },
            )

            latitude = locationResponse.data.latitude
            longitude = locationResponse.data.longitude

            locationName =
              locationResponse.data.city ||
              locationResponse.data.locality ||
              locationResponse.data.principalSubdivision ||
              locationResponse.data.countryName ||
              'Current location'

            console.log('Approximate location:', locationName, latitude, longitude)
          } catch (fallbackError) {
            console.error('Could not determine location:', fallbackError)

            this.weatherError =
              'Could not determine your location. Please enable location permission.'

            return
          }
        }

        const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
          params: {
            latitude,
            longitude,

            current:
              'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m',

            hourly: 'temperature_2m,precipitation_probability,precipitation,rain,weather_code',

            forecast_days: 2,
            timezone: 'auto',
          },
        })

        const current = response.data.current
        const hourly = response.data.hourly

        // Find the current hour in the hourly forecast
        const now = new Date()

        let currentHourIndex = hourly.time.findIndex((time) => {
          const forecastTime = new Date(time)

          return (
            forecastTime.getFullYear() === now.getFullYear() &&
            forecastTime.getMonth() === now.getMonth() &&
            forecastTime.getDate() === now.getDate() &&
            forecastTime.getHours() === now.getHours()
          )
        })

        if (currentHourIndex === -1) {
          currentHourIndex = 0
        }

        // Look at the next 6 hours
        const nextHoursEnd = Math.min(currentHourIndex + 6, hourly.time.length)

        const nextRainProbabilities = hourly.precipitation_probability.slice(
          currentHourIndex,
          nextHoursEnd,
        )

        const nextWeatherCodes = hourly.weather_code.slice(currentHourIndex, nextHoursEnd)

        const nextRain = hourly.rain.slice(currentHourIndex, nextHoursEnd)

        const maxRainProbability =
          nextRainProbabilities.length > 0 ? Math.max(...nextRainProbabilities) : 0

        const expectedRain = nextRain.length > 0 ? Math.max(...nextRain) : 0

        const rainyCodes = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]

        const rainExpectedSoon =
          maxRainProbability >= 40 ||
          expectedRain > 0 ||
          nextWeatherCodes.some((code) => rainyCodes.includes(code))

        this.weather = {
          location: locationName,

          latitude,
          longitude,

          temperature: Math.round(current.temperature_2m),

          feelsLike: Math.round(current.apparent_temperature),

          humidity: current.relative_humidity_2m,

          precipitation: current.precipitation || 0,

          rain: current.rain || 0,

          windSpeed: current.wind_speed_10m,

          weatherCode: current.weather_code,

          rainProbability: maxRainProbability,

          rainExpectedSoon,
        }

        await this.fetchWeatherSuggestion()
      } catch (error) {
        console.error('Weather error:', error)

        this.weatherError = 'Weather information is currently unavailable.'
      } finally {
        this.weatherLoading = false
      }
    },

    async fetchWeatherSuggestion() {
      if (!this.weather) return

      try {
        this.weatherSuggestionLoading = true

        const response = await axios.post(
          'https://cozyshare-mt-backend.onrender.com/api/ai/weather-suggestion',
          {
            location: this.weather.location,
            temperature: this.weather.temperature,
            feelsLike: this.weather.feelsLike,
            humidity: this.weather.humidity,
            precipitation: this.weather.precipitation,
            rain: this.weather.rain,
            windSpeed: this.weather.windSpeed,
            condition: this.weatherDescription,
            rainProbability: this.weather.rainProbability,
            rainExpectedSoon: this.weather.rainExpectedSoon,
          },
        )

        this.weatherSuggestion = response.data.suggestion || ''
      } catch (error) {
        console.error('Weather AI suggestion error:', error.response?.data || error)

        this.weatherSuggestion =
          'Plan household activities according to the current weather conditions.'
      } finally {
        this.weatherSuggestionLoading = false
      }
    },

    async getLocationName(latitude, longitude) {
      try {
        const response = await axios.get(
          'https://api.bigdatacloud.net/data/reverse-geocode-client',
          {
            params: {
              latitude,
              longitude,
              localityLanguage: 'en',
            },
          },
        )

        return (
          response.data.city ||
          response.data.locality ||
          response.data.principalSubdivision ||
          response.data.countryName ||
          'Your location'
        )
      } catch (error) {
        console.error('Location name error:', error)
        return 'Your location'
      }
    },
  },
  mounted() {
    if (this.isAuthenticated && this.householdCode) {
      this.fetchAll()
      this.fetchWeather()
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

/* SMART HOUSEHOLD ANALYTICS */

.analytics-section {
  margin: 24px 0;
}

.analytics-section > .section-header {
  margin-bottom: 14px;
}

.analytics-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 14px;
}

.analytics-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 14px;
  border: 1px solid var(--card-border);
  box-shadow: var(--soft-shadow);
  display: flex;
  align-items: center;
  gap: 10px;
}

.analytics-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary-light), var(--pink));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
}

.analytics-number {
  color: var(--navy);
  font-size: 1.4rem;
  font-weight: 700;
}

.analytics-label {
  color: var(--text-light);
  font-size: 0.8rem;
  margin-top: 2px;
}

.analytics-detail-card {
  margin-bottom: 14px;
  padding: 20px;
}

.analytics-detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.analytics-detail-header h3 {
  margin: 0 0 4px;
  color: var(--navy);
  font-size: 1.2rem;
}

.completion-percentage {
  font-size: 1.6rem;
  color: var(--navy);
  font-weight: 700;
}

.progress-track {
  width: 100%;
  height: 10px;
  background: #f3f4f6;
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, var(--primary), var(--peach));
  border-radius: inherit;
  transition: width 0.4s ease;
}

.completion-info {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 10px;
  color: var(--text-light);
  font-size: 0.82rem;
}

.workload-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.workload-row {
  background: #f9fafb;
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.workload-member {
  display: flex;
  align-items: center;
  gap: 10px;
}

.member-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--peach));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.workload-member strong {
  color: var(--navy);
  font-size: 0.9rem;
}

.workload-member p {
  margin: 3px 0 0;
  color: var(--text-light);
  font-size: 0.78rem;
}

.workload-count {
  min-width: 32px;
  padding: 5px 9px;
  border-radius: 10px;
  background: var(--primary-light);
  color: var(--navy);
  text-align: center;
  font-weight: 700;
}

.analytics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.source-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: #f9fafb;
  border-radius: 12px;
  margin-bottom: 8px;
  color: var(--text-light);
  font-size: 0.88rem;
}

.source-row strong {
  color: var(--navy);
}

.category-list {
  display: flex;
  flex-direction: column;
}

/* RESPONSIVE ANALYTICS */

@media (max-width: 768px) {
  .analytics-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .analytics-grid {
    grid-template-columns: 1fr;
  }

  .completion-info {
    flex-direction: column;
    gap: 5px;
  }
}

@media (max-width: 480px) {
  .analytics-stats {
    grid-template-columns: 1fr 1fr;
  }

  .analytics-card {
    padding: 12px;
  }

  .analytics-icon {
    width: 36px;
    height: 36px;
    font-size: 1.1rem;
  }

  .analytics-number {
    font-size: 1.2rem;
  }
}
/* WEATHER */

.weather-card {
  padding: 20px;
  margin-bottom: 24px;
}

.weather-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.weather-main {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--primary-light), var(--pink));
}

.weather-icon {
  font-size: 3rem;
}

.weather-location {
  color: var(--navy);
  font-size: 0.9rem;
  font-weight: 600;
}

.weather-temperature {
  color: var(--navy);
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.1;
}

.weather-condition {
  margin-top: 3px;
  color: var(--text-light);
  font-size: 0.9rem;
}

.weather-details {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.weather-detail {
  background: #f9fafb;
  border-radius: 12px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.weather-detail span {
  color: var(--text-light);
  font-size: 0.75rem;
}

.weather-detail strong {
  color: var(--navy);
  font-size: 0.9rem;
}

.weather-ai-box {
  padding: 16px;
  border-radius: 16px;
  background: #fff7f5;
  border: 1px solid var(--card-border);
}

.weather-ai-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.weather-ai-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary), var(--peach));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.weather-ai-header strong {
  color: var(--navy);
  font-size: 0.95rem;
}

.weather-ai-header p {
  margin: 2px 0 0;
  color: var(--text-light);
  font-size: 0.75rem;
}

.weather-ai-text {
  margin: 12px 0 0;
  color: var(--text-dark);
  font-size: 0.9rem;
  line-height: 1.6;
}

.weather-loading {
  padding: 32px;
  text-align: center;
  color: var(--text-light);
}

@media (max-width: 768px) {
  .weather-details {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
