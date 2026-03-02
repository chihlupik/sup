<template>
  <div class="app">
    <header class="header">
      <h1>📚 Журнал успеваемости</h1>
    </header>

    <div class="admin-section">
      <button class="admin-btn" @click="$emit('open-admin')">
        ⚙️ Админ панель
      </button>
    </div>

    <div class="filters">
      <div class="filter-item">
        <label for="group">Группа:</label>
        <select 
          id="group" 
          v-model="selectedGroup" 
          @change="loadData"
          :disabled="loading"
        >
          <option value="">Выберите группу</option>
          <option v-for="group in groups" :key="group.group_name" :value="group.group_name">
            {{ group.group_name }}
          </option>
        </select>
      </div>

      <div class="filter-item">
        <label for="subject">Предмет:</label>
        <select 
          id="subject" 
          v-model="selectedSubject" 
          @change="loadData"
          :disabled="loading"
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

      <button 
        class="refresh-btn" 
        @click="loadData" 
        :disabled="loading || !selectedGroup || !selectedSubject"
      >
        🔄 Обновить
      </button>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Загрузка данных...</p>
    </div>

    <div v-else-if="filteredTableData.length > 0" class="table-container">
      <table>
        <thead>
          <tr>
            <th>Студент</th>
            <th>Отметка</th>
            <th>Дата</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in filteredTableData" :key="index">
            <td class="student-name">{{ row.student_name }}</td>
            <td :class="['grade', getGradeClass(row)]">
              {{ getGradeText(row) }}
            </td>
            <td>{{ formatDate(row.date) }}</td>
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
      <p>Для выбранной группы и предмета пока нет оценок</p>
    </div>

    <div v-else class="welcome">
      <span class="welcome-icon">⬆️</span>
      <h3>Выберите группу и предмет</h3>
      <p>Используйте фильтры выше для просмотра журнала</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MainPage',
  data() {
    return {
      groups: [],
      subjects: [],
      selectedGroup: '',
      selectedSubject: '',
      tableData: [],
      studentFilter: '',
      loading: false
    }
  },
  computed: {
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
    
    const savedGroup = localStorage.getItem('selectedGroup')
    const savedSubject = localStorage.getItem('selectedSubject')
    
    if (savedGroup) this.selectedGroup = savedGroup
    if (savedSubject) this.selectedSubject = savedSubject
    
    if (savedGroup && savedSubject) {
      this.loadData()
    }
  },
  methods: {
    async loadGroups() {
      try {
        const response = await fetch('/api/groups')
        if (!response.ok) throw new Error('Ошибка загрузки групп')
        this.groups = await response.json()
      } catch (error) {
        console.error('Ошибка:', error)
        alert('Не удалось загрузить список групп')
      }
    },

    async loadSubjects() {
      try {
        const response = await fetch('/api/subjects')
        if (!response.ok) throw new Error('Ошибка загрузки предметов')
        this.subjects = await response.json()
      } catch (error) {
        console.error('Ошибка:', error)
        alert('Не удалось загрузить список предметов')
      }
    },

    async loadData() {
      if (!this.selectedGroup || !this.selectedSubject) return

      this.loading = true
      this.tableData = []
      this.studentFilter = '' // Сбрасываем фильтр при загрузке новых данных
      
      try {
        localStorage.setItem('selectedGroup', this.selectedGroup)
        localStorage.setItem('selectedSubject', this.selectedSubject)
        
        const url = `/api/attendance?group=${encodeURIComponent(this.selectedGroup)}&subjectId=${this.selectedSubject}`
        
        const response = await fetch(url)
        const data = await response.json()
        
        if (data.grades && data.grades.length > 0) {
          this.tableData = data.grades
        }
        
      } catch (error) {
        console.error('Ошибка загрузки:', error)
        alert('Ошибка при загрузке данных: ' + error.message)
      } finally {
        this.loading = false
      }
    },

    formatDate(dateString) {
      if (!dateString) return '—'
      try {
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return '—'
        return date.toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
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
  }
}
</script>

<style scoped>
.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px 30px;
  border-radius: 15px;
  margin-bottom: 30px;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
}

.header h1 {
  margin: 0;
  font-size: 28px;
}

.admin-section {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.admin-btn {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  transition: transform 0.3s, box-shadow 0.3s;
}

.admin-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(220, 53, 69, 0.3);
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
  font-size: 14px;
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
  border-color: #667eea;
}

.filter-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
}

.refresh-btn {
  padding: 12px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  height: 42px;
  transition: background 0.3s;
}

.refresh-btn:hover:not(:disabled) {
  background: #5a67d8;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  padding: 60px;
  background: white;
  border-radius: 15px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 15px;
  font-weight: 600;
  font-size: 14px;
  text-align: left;
}

td {
  padding: 12px 15px;
  border-bottom: 1px solid #f0f0f0;
  color: #333;
}

tr:hover {
  background: #f9f9f9;
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

.empty-state, .welcome {
  text-align: center;
  padding: 80px 20px;
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

.welcome h3, .empty-state h3 {
  margin-bottom: 10px;
  color: #495057;
}

@media (max-width: 768px) {
  .filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header h1 {
    font-size: 22px;
  }
  
  table {
    font-size: 14px;
  }
  
  td, th {
    padding: 10px;
  }
  
  .filter-item {
    min-width: 100%;
  }
}
</style>