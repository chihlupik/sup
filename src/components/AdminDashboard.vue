<template>
  <div class="admin-dashboard">
    <header class="dashboard-header">
      <div class="header-left">
        <h1>⚙️ Панель управления</h1>
        <span class="user-badge">👤 {{ user.username }} ({{ user.role === 'admin' ? 'Администратор' : 'Учитель' }})</span>
      </div>
      <div class="header-actions">
        <button class="refresh-btn" @click="refreshData" title="Обновить данные">🔄</button>
        <button class="logout-btn" @click="handleLogout">🚪 Выйти</button>
        <button class="back-btn" @click="$emit('close')">← На главную</button>
      </div>
    </header>

    <div class="dashboard-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        class="tab-btn"
        :class="{ active: currentTab === tab.id }"
        @click="currentTab = tab.id"
      >
        {{ tab.icon }} {{ tab.name }}
      </button>
    </div>

    <!-- Вкладка: Студенты -->
    <div v-if="currentTab === 'students'" class="tab-content">
      <div class="content-header">
        <h2>📚 Управление студентами</h2>
        <button class="add-btn" @click="showAddStudentModal = true">
          ➕ Добавить студента
        </button>
      </div>

      <div class="filters">
        <div class="filter-item">
          <label>Фильтр по группе:</label>
          <select v-model="studentFilter.group">
            <option value="">Все группы</option>
            <option v-for="group in groups" :key="group.group_name" :value="group.group_name">
              {{ group.group_name }}
            </option>
          </select>
        </div>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Имя студента</th>
              <th>Группа</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="student in filteredStudents" :key="student.id">
              <td>{{ student.id }}</td>
              <td>{{ student.name }}</td>
              <td>{{ student.group_name }}</td>
              <td>
                <button class="delete-btn" @click="deleteStudent(student)" title="Удалить">
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Вкладка: Группы -->
    <div v-if="currentTab === 'groups'" class="tab-content">
      <div class="content-header">
        <h2>👥 Управление группами</h2>
        <button class="add-btn" @click="showAddGroupModal = true">
          ➕ Добавить группу
        </button>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Название группы</th>
              <th>Количество студентов</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="group in groupsWithStats" :key="group.group_name">
              <td>{{ group.group_name }}</td>
              <td>{{ group.student_count }}</td>
              <td>
                <button 
                  class="delete-btn" 
                  @click="deleteGroup(group)"
                  :disabled="group.student_count > 0"
                  :title="group.student_count > 0 ? 'Сначала удалите всех студентов' : 'Удалить группу'"
                >
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Вкладка: Предметы -->
    <div v-if="currentTab === 'subjects'" class="tab-content">
      <div class="content-header">
        <h2>📖 Управление предметами</h2>
        <button class="add-btn" @click="showAddSubjectModal = true">
          ➕ Добавить предмет
        </button>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Название предмета</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="subject in subjects" :key="subject.id">
              <td>{{ subject.id }}</td>
              <td>{{ subject.name }}</td>
              <td>
                <button class="delete-btn" @click="deleteSubject(subject)" title="Удалить">
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Вкладка: Пользователи -->
    <div v-if="currentTab === 'users'" class="tab-content">
      <div class="content-header">
        <h2>👤 Управление пользователями</h2>
        <button class="add-btn" @click="showAddUserModal = true">
          ➕ Добавить пользователя
        </button>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Имя пользователя</th>
              <th>Роль</th>
              <th>Дата создания</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="userItem in users" :key="userItem.id">
              <td>{{ userItem.id }}</td>
              <td>{{ userItem.username }}</td>
              <td>
                <span :class="['role-badge', userItem.role]">
                  {{ userItem.role === 'admin' ? 'Администратор' : 'Учитель' }}
                </span>
              </td>
              <td>{{ formatDate(userItem.created_at) }}</td>
              <td>
                <button 
                  class="delete-btn" 
                  @click="deleteUser(userItem)"
                  :disabled="userItem.role === 'admin'"
                  :title="userItem.role === 'admin' ? 'Нельзя удалить администратора' : 'Удалить пользователя'"
                >
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Модальные окна -->
    <AppModal v-if="showAddStudentModal" @close="showAddStudentModal = false">
      <template v-slot:title>➕ Добавить студента</template>
      <div class="modal-form">
        <div class="form-group">
          <label>Имя студента:</label>
          <input v-model="newStudent.name" type="text" placeholder="Введите имя">
        </div>
        <div class="form-group">
          <label>Группа:</label>
          <select v-model="newStudent.group_name">
            <option value="">Выберите группу</option>
            <option v-for="group in groups" :key="group.group_name" :value="group.group_name">
              {{ group.group_name }}
            </option>
          </select>
        </div>
        <div class="modal-actions">
          <button class="cancel-btn" @click="showAddStudentModal = false">Отмена</button>
          <button class="save-btn" @click="addStudent" :disabled="!canAddStudent">
            Сохранить
          </button>
        </div>
      </div>
    </AppModal>

    <AppModal v-if="showAddGroupModal" @close="showAddGroupModal = false">
      <template v-slot:title>👥 Добавить группу</template>
      <div class="modal-form">
        <div class="form-group">
          <label>Название группы:</label>
          <input v-model="newGroup.name" type="text" placeholder="Например: ИС-21">
        </div>
        <div class="modal-actions">
          <button class="cancel-btn" @click="showAddGroupModal = false">Отмена</button>
          <button class="save-btn" @click="addGroup" :disabled="!newGroup.name">
            Сохранить
          </button>
        </div>
      </div>
    </AppModal>

    <AppModal v-if="showAddSubjectModal" @close="showAddSubjectModal = false">
      <template v-slot:title>📖 Добавить предмет</template>
      <div class="modal-form">
        <div class="form-group">
          <label>Название предмета:</label>
          <input v-model="newSubject.name" type="text" placeholder="Например: Математика">
        </div>
        <div class="modal-actions">
          <button class="cancel-btn" @click="showAddSubjectModal = false">Отмена</button>
          <button class="save-btn" @click="addSubject" :disabled="!newSubject.name">
            Сохранить
          </button>
        </div>
      </div>
    </AppModal>

    <AppModal v-if="showAddUserModal" @close="showAddUserModal = false">
      <template v-slot:title>👤 Добавить пользователя</template>
      <div class="modal-form">
        <div class="form-group">
          <label>Имя пользователя:</label>
          <input v-model="newUser.username" type="text" placeholder="Введите логин">
        </div>
        <div class="form-group">
          <label>Пароль:</label>
          <input v-model="newUser.password" type="password" placeholder="Введите пароль">
        </div>
        <div class="form-group">
          <label>Роль:</label>
          <select v-model="newUser.role">
            <option value="teacher">Учитель</option>
          </select>
        </div>
        <div class="modal-actions">
          <button class="cancel-btn" @click="showAddUserModal = false">Отмена</button>
          <button class="save-btn" @click="addUser" :disabled="!canAddUser">
            Сохранить
          </button>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script>
import AppModal from './AppModal.vue'

export default {
  name: 'AdminDashboard',
  components: {
    AppModal
  },
  props: {
    user: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      currentTab: 'students',
      tabs: [
        { id: 'students', name: 'Студенты', icon: '📚' },
        { id: 'groups', name: 'Группы', icon: '👥' },
        { id: 'subjects', name: 'Предметы', icon: '📖' },
        { id: 'users', name: 'Пользователи', icon: '👤' }
      ],
      students: [],
      groups: [],
      subjects: [],
      users: [],
      studentFilter: {
        group: ''
      },
      showAddStudentModal: false,
      showAddGroupModal: false,
      showAddSubjectModal: false,
      showAddUserModal: false,
      newStudent: {
        name: '',
        group_name: ''
      },
      newGroup: {
        name: ''
      },
      newSubject: {
        name: ''
      },
      newUser: {
        username: '',
        password: '',
        role: 'teacher'
      }
    }
  },
  computed: {
    filteredStudents() {
      if (!this.studentFilter.group) return this.students
      return this.students.filter(s => s.group_name === this.studentFilter.group)
    },
    groupsWithStats() {
      return this.groups.map(group => {
        const count = this.students.filter(s => s.group_name === group.group_name).length
        return {
          group_name: group.group_name,
          student_count: count
        }
      })
    },
    canAddStudent() {
      return this.newStudent.name && this.newStudent.group_name
    },
    canAddUser() {
      return this.newUser.username && this.newUser.password
    }
  },
  mounted() {
    this.loadAllData()
  },
  methods: {
    refreshData() {
      this.loadAllData()
    },

    handleLogout() {
      sessionStorage.removeItem('adminUser')
      this.$emit('logout')
    },

    async loadAllData() {
      await Promise.all([
        this.loadStudents(),
        this.loadGroups(),
        this.loadSubjects(),
        this.loadUsers()
      ])
    },

    async loadStudents() {
      try {
        const response = await fetch('/api/students')
        this.students = await response.json()
      } catch (error) {
        console.error('Ошибка загрузки студентов:', error)
      }
    },

    async loadGroups() {
      try {
        const response = await fetch('/api/groups')
        this.groups = await response.json()
      } catch (error) {
        console.error('Ошибка загрузки групп:', error)
      }
    },

    async loadSubjects() {
      try {
        const response = await fetch('/api/subjects')
        this.subjects = await response.json()
      } catch (error) {
        console.error('Ошибка загрузки предметов:', error)
      }
    },

    async loadUsers() {
      try {
        const response = await fetch('/api/users')
        this.users = await response.json()
      } catch (error) {
        console.error('Ошибка загрузки пользователей:', error)
      }
    },

    async addStudent() {
      try {
        const response = await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.newStudent)
        })

        if (response.ok) {
          alert('✅ Студент успешно добавлен')
          this.showAddStudentModal = false
          this.newStudent = { name: '', group_name: '' }
          await this.loadAllData()
        } else {
          const data = await response.json()
          alert('❌ ' + (data.error || 'Ошибка при добавлении'))
        }
      } catch (error) {
        console.error('Ошибка:', error)
        alert('❌ Ошибка при добавлении студента')
      }
    },

    async deleteStudent(student) {
      if (!confirm(`🗑️ Удалить студента ${student.name}? Это также удалит все его оценки.`)) return

      try {
        const response = await fetch(`/api/students/${student.id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          alert('✅ Студент удален')
          await this.loadAllData()
        } else {
          const data = await response.json()
          alert('❌ ' + (data.error || 'Ошибка при удалении'))
        }
      } catch (error) {
        console.error('Ошибка:', error)
        alert('❌ Ошибка при удалении студента')
      }
    },

    async addGroup() {
      try {
        const response = await fetch('/api/groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ group_name: this.newGroup.name })
        })

        if (response.ok) {
          alert('✅ Группа успешно создана')
          this.showAddGroupModal = false
          this.newGroup.name = ''
          await this.loadAllData()
        } else {
          const data = await response.json()
          alert('❌ ' + (data.error || 'Ошибка при создании'))
        }
      } catch (error) {
        console.error('Ошибка:', error)
        alert('❌ Ошибка при создании группы')
      }
    },

    async deleteGroup(group) {
      if (group.student_count > 0) {
        alert('❌ Нельзя удалить группу, в которой есть студенты')
        return
      }

      if (!confirm(`🗑️ Удалить группу ${group.group_name}?`)) return

      try {
        const response = await fetch(`/api/groups/${encodeURIComponent(group.group_name)}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          alert('✅ Группа удалена')
          await this.loadAllData()
        } else {
          const data = await response.json()
          alert('❌ ' + (data.error || 'Ошибка при удалении'))
        }
      } catch (error) {
        console.error('Ошибка:', error)
        alert('❌ Ошибка при удалении группы')
      }
    },

    async addSubject() {
      try {
        const response = await fetch('/api/subjects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: this.newSubject.name })
        })

        if (response.ok) {
          alert('✅ Предмет успешно создан')
          this.showAddSubjectModal = false
          this.newSubject.name = ''
          await this.loadAllData()
        } else {
          const data = await response.json()
          alert('❌ ' + (data.error || 'Ошибка при создании'))
        }
      } catch (error) {
        console.error('Ошибка:', error)
        alert('❌ Ошибка при создании предмета')
      }
    },

    async deleteSubject(subject) {
      if (!confirm(`🗑️ Удалить предмет ${subject.name}? Это также удалит все оценки по этому предмету.`)) return

      try {
        const response = await fetch(`/api/subjects/${subject.id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          alert('✅ Предмет удален')
          await this.loadAllData()
        } else {
          const data = await response.json()
          alert('❌ ' + (data.error || 'Ошибка при удалении'))
        }
      } catch (error) {
        console.error('Ошибка:', error)
        alert('❌ Ошибка при удалении предмета')
      }
    },

    async addUser() {
      try {
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.newUser)
        })

        if (response.ok) {
          alert('✅ Пользователь успешно создан')
          this.showAddUserModal = false
          this.newUser = { username: '', password: '', role: 'teacher' }
          await this.loadAllData()
        } else {
          const data = await response.json()
          alert('❌ ' + (data.error || 'Ошибка при создании'))
        }
      } catch (error) {
        console.error('Ошибка:', error)
        alert('❌ Ошибка при создании пользователя')
      }
    },

    async deleteUser(userItem) {
      if (userItem.role === 'admin') {
        alert('❌ Нельзя удалить администратора')
        return
      }

      if (!confirm(`🗑️ Удалить пользователя ${userItem.username}?`)) return

      try {
        const response = await fetch(`/api/users/${userItem.id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          alert('✅ Пользователь удален')
          await this.loadAllData()
        } else {
          const data = await response.json()
          alert('❌ ' + (data.error || 'Ошибка при удалении'))
        }
      } catch (error) {
        console.error('Ошибка:', error)
        alert('❌ Ошибка при удалении пользователя')
      }
    },

    formatDate(dateString) {
      if (!dateString) return '—'
      return new Date(dateString).toLocaleDateString('ru-RU')
    }
  }
}
</script>

<style scoped>
.admin-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: white;
  padding: 20px 30px;
  border-radius: 15px;
  margin-bottom: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-left h1 {
  margin: 0;
  font-size: 28px;
}

.user-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  backdrop-filter: blur(5px);
}

.header-actions {
  display: flex;
  gap: 10px;
}

.refresh-btn, .logout-btn, .back-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s;
}

.refresh-btn {
  background: #4a5568;
  color: white;
  font-size: 16px;
}

.refresh-btn:hover {
  background: #2d3748;
  transform: rotate(180deg);
}

.logout-btn {
  background: #f0f0f0;
  color: #333;
}

.logout-btn:hover {
  background: #e0e0e0;
}

.back-btn {
  background: white;
  color: #1a1a2e;
}

.back-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.dashboard-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  background: white;
  padding: 10px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.tab-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #666;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.tab-btn:hover {
  background: #f0f0f0;
}

.tab-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.tab-content {
  background: white;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.content-header h2 {
  color: #333;
  font-size: 20px;
  margin: 0;
}

.add-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 5px;
}

.add-btn:hover {
  background: #218838;
}

.filters {
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-item label {
  font-weight: 600;
  color: #333;
  min-width: 120px;
}

.filter-item select {
  flex: 1;
  padding: 8px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  background: #f8f9fa;
  color: #333;
  font-weight: 600;
  padding: 12px;
  text-align: left;
  border-bottom: 2px solid #dee2e6;
}

td {
  padding: 12px;
  border-bottom: 1px solid #dee2e6;
}

tr:hover {
  background: #f8f9fa;
}

.role-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.role-badge.admin {
  background: #dc3545;
  color: white;
}

.role-badge.teacher {
  background: #28a745;
  color: white;
}

.delete-btn {
  background: #dc3545;
  color: white;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-btn:hover:not(:disabled) {
  background: #c82333;
  transform: scale(1.1);
}

.delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-form {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.cancel-btn, .save-btn {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 6px;
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

.save-btn {
  background: #28a745;
  color: white;
}

.save-btn:hover:not(:disabled) {
  background: #218838;
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>