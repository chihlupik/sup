<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <h2>🔐 Вход в админ панель</h2>
      
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="username">Имя пользователя:</label>
          <input 
            type="text" 
            id="username" 
            v-model="username" 
            required
            placeholder="admin"
            autocomplete="off"
          >
        </div>

        <div class="form-group">
          <label for="password">Пароль:</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            required
            placeholder="••••••••"
          >
        </div>

        <div v-if="error" class="error-message">
          ❌ {{ error }}
        </div>

        <div class="modal-actions">
          <button type="button" class="cancel-btn" @click="$emit('close')">
            Отмена
          </button>
          <button type="submit" class="login-btn" :disabled="loading">
            {{ loading ? 'Вход...' : 'Войти' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LoginModal',
  data() {
    return {
      username: '',
      password: '',
      error: '',
      loading: false
    }
  },
  methods: {
    async handleLogin() {
      this.loading = true
      this.error = ''

      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: this.username,
            password: this.password
          })
        })

        const data = await response.json()

        if (response.ok) {
          this.$emit('login-success', data.user)
          this.$emit('close')
        } else {
          this.error = data.error || 'Ошибка авторизации'
        }
      } catch (error) {
        this.error = 'Ошибка соединения с сервером'
        console.error('Login error:', error)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 15px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.modal-content h2 {
  color: #333;
  margin-bottom: 25px;
  text-align: center;
  font-size: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  text-align: center;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.cancel-btn, .login-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.cancel-btn {
  background: #f0f0f0;
  color: #333;
}

.cancel-btn:hover {
  background: #e0e0e0;
}

.login-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.login-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>