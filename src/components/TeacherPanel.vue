<template>
  <div class="teacher-panel">
    <header class="teacher-header">
      <div class="header-left">
        <h1>📝 Панель учителя</h1>
        <span class="user-badge">👤 {{ user.username }} (Учитель)</span>
      </div>
      <div class="header-actions">
        <button class="refresh-btn" @click="loadData" title="Обновить данные">🔄</button>
        <button class="logout-btn" @click="handleLogout">🚪 Выйти</button>
        <button class="back-btn" @click="$emit('close')">← На главную</button>
      </div>
    </header>

    <div class="filters">
      <div class="filter-item">
        <label for="teacher-group">Группа:</label>
        <select 
          id="teacher-group" 
          v-model="selectedGroup" 
          @change="loadData"
        >
          <option value="">Выберите группу</option>
          <option v-for="group in groups" :key="group.group_name" :value="group.group_name">
            {{ group.group_name }}
          </option>
        </select>
      </div>

      <div class="filter-item">
        <label for="teacher-subject">Предмет:</label>
        <select 
          id="teacher-subject" 
          v-model="selectedSubject" 
          @change="loadData"
        >
          <option value="">Выберите предмет</option>
          <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
            {{ subject.name }}
          </option>
        </select>
      </div>

      <div class="filter-item" v-if="selectedGroup && selectedSubject">
        <label for="student-filter">Фильтр по студенту:</label>
        <input 
          type="text" 
          id="student-filter"
          v-model="studentFilter" 
          placeholder="Введите имя студента..."
          class="filter-input"
        >
      </div>
    </div>

    <!-- Блок добавления отметки -->
    <div class="add-grade-section" v-if="selectedGroup && selectedSubject">
      <h2>➕ Добавить отметку</h2>
      <div class="add-grade-form">
        <select v-model="newGrade.studentId" class="form-control">
          <option value="">Выберите студента</option>
          <option v-for="student in studentsList" :key="student.id" :value="student.id">
            {{ student.name }}
          </option>
        </select>

        <input 
          type="date" 
          v-model="newGrade.date" 
          class="form-control"
          :max="today"
        >

        <select v-model="newGrade.attendance" class="form-control">
          <option value="1">✅ Присутствовал</option>
          <option value="0">❌ Отсутствовал</option>
        </select>

        <input 
          type="number" 
          v-model="newGrade.grade" 
          placeholder="Оценка (2-5)"
          min="2" 
          max="5" 
          class="form-control"
          :disabled="newGrade.attendance === '0'"
        >

        <button 
          class="add-btn" 
          @click="addGrade"
          :disabled="!canAddGrade"
        >
          ➕ Добавить
        </button>
      </div>
    </div>

    <!-- Таблица с отметками -->
    <div class="table-container" v-if="filteredTableData.length > 0">
      <table>
        <thead>
          <tr>
            <th>Студент</th>
            <th>Отметка</th>
            <th>Дата</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in filteredTableData" :key="index">
            <td class="student-name">{{ row.student_name }}</td>
            <td :class="['grade', getGradeClass(row)]">
              {{ getGradeText(row) }}
            </td>
            <td>{{ formatDate(row.date) }}</td>
            <td>
              <button class="delete-btn" @click="deleteGrade(row)" title="Удалить">
                🗑️
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else-if="selectedGroup && selectedSubject && tableData.length > 0" class="empty-state">
      <span class="empty-icon">🔍</span>
      <h3>Ничего не найдено</h3>
      <p>Попробуйте изменить фильтр поиска</p>
    </div>

    <div v-else-if="selectedGroup && selectedSubject" class="empty-state">
      <span class="empty-icon">📊</span>
      <h3>Нет данных для отображения</h3>
      <p>Добавьте первую отметку для этой группы и предмета</p>
    </div>

    <div v-else class="welcome-message">
      <span class="welcome-icon">👆</span>
      <h3>Выберите группу и предмет</h3>
      <p>Чтобы начать работу с отметками, выберите группу и предмет выше</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TeacherPanel',
  props: {
    user: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      groups: [],
      subjects: [],
      studentsList: [],
      selectedGroup: '',
      selectedSubject: '',
      tableData: [],
      studentFilter: '',
      newGrade: {
        studentId: '',
        date: new Date().toISOString().split('T')[0],
        attendance: '1',
        grade: ''
      }
    }
  },
  computed: {
    today() {
      return new Date().toISOString().split('T')[0]
    },
    canAddGrade() {
      return this.newGrade.studentId && 
             this.newGrade.date && 
             (this.newGrade.attendance === '0' || 
              (this.newGrade.attendance === '1' && this.newGrade.grade >= 2 && this.newGrade.grade <= 5))
    },
    filteredTableData() {
      if (!this.studentFilter) return this.tableData
      
      const filterLower = this.studentFilter.toLowerCase()
      return this.tableData.filter(row => 
        row.student_name.toLowerCase().includes(filterLower)
      )
    }
  },
  mounted() {
    this.loadGroups()
    this.loadSubjects()
  },
  methods: {
    handleLogout() {
      sessionStorage.removeItem('adminUser')
      this.$emit('logout')
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

    async loadStudents() {
      if (!this.selectedGroup) return
      try {
        const response = await fetch(`/api/students?group=${encodeURIComponent(this.selectedGroup)}`)
        this.studentsList = await response.json()
      } catch (error) {
        console.error('Ошибка загрузки студентов:', error)
      }
    },

    async loadData() {
      if (!this.selectedGroup || !this.selectedSubject) return
      
      await this.loadStudents()
      this.studentFilter = '' // Сбрасываем фильтр при загрузке новых данных
      
      try {
        const url = `/api/attendance?group=${encodeURIComponent(this.selectedGroup)}&subjectId=${this.selectedSubject}`
        const response = await fetch(url)
        const data = await response.json()
        this.tableData = data.grades || []
      } catch (error) {
        console.error('Ошибка загрузки:', error)
      }
    },

    async addGrade() {
      try {
        const response = await fetch('/api/grade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: this.newGrade.studentId,
            subjectId: this.selectedSubject,
            grade: this.newGrade.attendance === '1' ? this.newGrade.grade : null,
            attendance: parseInt(this.newGrade.attendance),
            date: this.newGrade.date
          })
        })

        if (response.ok) {
          alert('✅ Отметка успешно добавлена!')
          this.newGrade = {
            studentId: '',
            date: this.today,
            attendance: '1',
            grade: ''
          }
          this.loadData()
        }
      } catch (error) {
        console.error('Ошибка добавления:', error)
        alert('❌ Не удалось добавить отметку')
      }
    },

    async deleteGrade(row) {
      if (!confirm(`🗑️ Удалить отметку для студента ${row.student_name} от ${this.formatDate(row.date)}?`)) return

      try {
        const response = await fetch('/api/grade', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: row.student_id,
            subjectId: this.selectedSubject,
            date: row.date
          })
        })

        if (response.ok) {
          alert('✅ Отметка удалена')
          this.loadData()
        }
      } catch (error) {
        console.error('Ошибка удаления:', error)
        alert('❌ Не удалось удалить отметку')
      }
    },

    formatDate(dateString) {
      if (!dateString) return '—'
      try {
        const date = new Date(dateString)
        return date.toLocaleDateString('ru-RU')
      } catch {
        return '—'
      }
    },

    getGradeText(row) {
      if (!row.attendance) return '❌ Отсутствовал'
      if (row.grade) return `Оценка: ${row.grade}`
      return '✅ Присутствовал'
    },

    getGradeClass(row) {
      if (!row.attendance) return 'absent'
      if (row.grade) {
        const grade = parseInt(row.grade)
        if (grade >= 4) return 'good'
        if (grade === 3) return 'satisfactory'
        if (grade <= 2) return 'bad'
      }
      return 'present'
    }
  },
  watch: {
    selectedGroup() {
      this.loadData()
    },
    selectedSubject() {
      this.loadData()
    }
  }
}
</script>

<style scoped>
.teacher-panel {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.teacher-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  padding: 20px 30px;
  border-radius: 15px;
  margin-bottom: 20px;
  box-shadow: 0 10px 30px rgba(40, 167, 69, 0.3);
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
  color: #28a745;
}

.back-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.filters {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
  background: white;
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
  align-items: flex-end;
  flex-wrap: wrap;
}

.filter-item {
  flex: 1;
  min-width: 200px;
}

.filter-item label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
}

.filter-item select,
.filter-item input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s;
}

.filter-item select:focus,
.filter-item input:focus {
  outline: none;
  border-color: #28a745;
}

.filter-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
}

.add-grade-section {
  background: white;
  padding: 20px;
  border-radius: 15px;
  margin-bottom: 30px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
}

.add-grade-section h2 {
  color: #333;
  margin-bottom: 20px;
  font-size: 20px;
}

.add-grade-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.form-control {
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s;
}

.form-control:focus {
  outline: none;
  border-color: #28a745;
}

.add-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  transition: background 0.3s;
}

.add-btn:hover:not(:disabled) {
  background: #218838;
}

.add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.table-container {
  background: white;
  border-radius: 15px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  padding: 15px;
  font-weight: 600;
  text-align: left;
}

td {
  padding: 12px 15px;
  border-bottom: 1px solid #f0f0f0;
}

tr:hover {
  background: #f8f9fa;
}

.delete-btn {
  background: #dc3545;
  color: white;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  font-size: 18px;
}

.delete-btn:hover {
  background: #c82333;
  transform: scale(1.1);
}

.student-name {
  font-weight: 500;
  color: #2c3e50;
}

.grade {
  font-weight: 500;
}

.grade.present { color: #28a745; }
.grade.absent { color: #dc3545; }
.grade.good { color: #28a745; font-weight: 600; }
.grade.satisfactory { color: #fd7e14; font-weight: 600; }
.grade.bad { color: #dc3545; font-weight: 600; }

.empty-state, .welcome-message {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 15px;
  color: #6c757d;
}

.empty-icon, .welcome-icon {
  font-size: 60px;
  color: #dee2e6;
  margin-bottom: 20px;
  display: block;
}

@media (max-width: 768px) {
  .filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .add-grade-form {
    grid-template-columns: 1fr;
  }
  
  .teacher-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .header-left {
    flex-direction: column;
    gap: 10px;
  }
  
  .header-actions {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .filter-item {
    min-width: 100%;
  }
}
</style>