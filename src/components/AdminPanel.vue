<template>
  <div class="admin-panel">
    <!-- Если пользователь не авторизован, показываем окно входа -->
    <LoginModal 
      v-if="!user" 
      @close="$emit('close')"
      @login-success="handleLoginSuccess"
    />
    
    <!-- Если пользователь авторизован, показываем соответствующий интерфейс -->
    <AdminDashboard 
      v-else-if="user.role === 'admin'"
      :user="user"
      @logout="handleLogout"
      @close="$emit('close')"
    />
    
    <!-- Интерфейс для учителя -->
    <TeacherPanel 
      v-else-if="user.role === 'teacher'"
      :user="user"
      @logout="handleLogout"
      @close="$emit('close')"
    />
  </div>
</template>

<script>
import LoginModal from './LoginModal.vue'
import AdminDashboard from './AdminDashboard.vue'
import TeacherPanel from './TeacherPanel.vue'

export default {
  name: 'AdminPanel',
  components: {
    LoginModal,
    AdminDashboard,
    TeacherPanel
  },
  data() {
    return {
      user: null
    }
  },
  mounted() {
    // Проверяем, есть ли сохраненная сессия
    const savedUser = sessionStorage.getItem('adminUser')
    if (savedUser) {
      this.user = JSON.parse(savedUser)
    }
  },
  methods: {
    handleLoginSuccess(user) {
      this.user = user
      sessionStorage.setItem('adminUser', JSON.stringify(user))
    },
    handleLogout() {
      this.user = null
      sessionStorage.removeItem('adminUser')
      this.$emit('close')
    }
  }
}
</script>