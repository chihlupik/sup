<template>
  <div class="app">
    <header class="header">
      <div class="header-content">
        <h1>📚 Журнал успеваемости</h1>
        <button class="admin-btn" @click="$emit('open-admin')">
          ⚙️ Админ панель
        </button>
      </div>
    </header>

    <!-- Вкладки: Журнал и Средняя успеваемость -->
    <div class="tabs">
      <button 
        class="tab-btn" 
        :class="{ active: currentTab === 'journal' }"
        @click="currentTab = 'journal'"
      >
        📖 Журнал оценок
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: currentTab === 'average' }"
        @click="currentTab = 'average'; loadAverageData()"
      >
        📊 Средняя успеваемость
      </button>
    </div>

    <!-- Вкладка: Журнал оценок -->
    <div v-if="currentTab === 'journal'">
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

    <!-- Вкладка: Средняя успеваемость -->
    <div v-if="currentTab === 'average'" class="average-tab">
      <div class="filters">
        <div class="filter-item">
          <label for="avg-group">Группа:</label>
          <select 
            id="avg-group" 
            v-model="avgSelectedGroup" 
            @change="loadAverageData"
          >
            <option value="">Все группы</option>
            <option v-for="group in groups" :key="group.group_name" :value="group.group_name">
              {{ group.group_name }}
            </option>
          </select>
        </div>

        <div class="filter-item">
          <label for="avg-subject">Предмет:</label>
          <select 
            id="avg-subject" 
            v-model="avgSelectedSubject" 
            @change="loadAverageData"
          >
            <option value="">Все предметы</option>
            <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
              {{ subject.name }}
            </option>
          </select>
        </div>

        <div class="filter-item">
          <label for="student-avg-filter">Фильтр по студенту:</label>
          <input 
            type="text" 
            id="student-avg-filter"
            v-model="avgStudentFilter" 
            placeholder="Введите имя студента..."
            class="filter-input"
          >
        </div>

        <button class="refresh-btn" @click="loadAverageData">
          🔄 Обновить
        </button>
      </div>

      <div v-if="avgLoading" class="loading">
        <div class="spinner"></div>
        <p>Загрузка данных...</p>
      </div>

      <div v-else-if="filteredAverageData.length > 0" class="table-container">
        <table class="average-table">
          <thead>
            <tr>
              <th>Студент</th>
              <th>Группа</th>
              <th>Предмет</th>
              <th>Средний балл</th>
              <th>Всего оценок</th>
              <th>Всего пропусков</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in filteredAverageData" :key="index">
              <td class="student-name">{{ item.student_name }}</td>
              <td>{{ item.group_name }}</td>
              <td>{{ item.subject_name }}</td>
              <td :class="['average-grade', getAverageGradeClass(item.average)]">
                {{ item.average.toFixed(2) }}
              </td>
              <td>{{ item.grades_count }}</td>
              <td :class="['absences-count', getAbsencesClass(item.absences_count)]">
                {{ item.absences_count }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-state">
        <span class="empty-icon">📊</span>
        <h3>Нет данных для отображения</h3>
        <p>В системе пока нет оценок для расчета средней успеваемости</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MainPage',
  data() {
    return {
      // Общие данные
      groups: [],
      subjects: [],
      currentTab: 'journal',
      
      // Данные для журнала
      selectedGroup: '',
      selectedSubject: '',
      tableData: [],
      studentFilter: '',
      loading: false,
      
      // Данные для средней успеваемости
      avgSelectedGroup: '',
      avgSelectedSubject: '',
      avgStudentFilter: '',
      averageData: [],
      avgLoading: false
    }
  },
  computed: {
    filteredTableData() {
      if (!this.studentFilter) return this.tableData
      
      const filterLower = this.studentFilter.toLowerCase()
      return this.tableData.filter(row => 
        row.student_name.toLowerCase().includes(filterLower)
      )
    },
    
    filteredAverageData() {
      let filtered = this.averageData
      
      // Фильтр по группе
      if (this.avgSelectedGroup) {
        filtered = filtered.filter(item => item.group_name === this.avgSelectedGroup)
      }
      
      // Фильтр по предмету
      if (this.avgSelectedSubject) {
        filtered = filtered.filter(item => item.subject_id === parseInt(this.avgSelectedSubject))
      }
      
      // Фильтр по имени студента
      if (this.avgStudentFilter) {
        const filterLower = this.avgStudentFilter.toLowerCase()
        filtered = filtered.filter(item => 
          item.student_name.toLowerCase().includes(filterLower)
        )
      }
      
      // Сортировка по среднему баллу (убывание)
      return filtered.sort((a, b) => b.average - a.average)
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
      this.studentFilter = ''
      
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

    async loadAverageData() {
      this.avgLoading = true
      this.averageData = []
      
      try {
        // Получаем всех студентов
        const studentsResponse = await fetch('/api/students')
        const students = await studentsResponse.json()
        
        // Получаем все предметы
        const subjectsResponse = await fetch('/api/subjects')
        const subjects = await subjectsResponse.json()
        
        // Для каждого студента и предмета считаем средний балл и пропуски
        const averages = []
        
        for (const student of students) {
          for (const subject of subjects) {
            // Получаем все оценки студента по предмету
            const gradesResponse = await fetch(
              `/api/attendance?group=${encodeURIComponent(student.group_name)}&subjectId=${subject.id}`
            )
            const gradesData = await gradesResponse.json()
            
            // Фильтруем оценки только для этого студента
            const studentGrades = gradesData.grades.filter(g => g.student_id === student.id)
            
            // Оценки с баллами (для среднего балла)
            const graded = studentGrades.filter(g => g.grade)
            
            // Пропуски (attendance = 0)
            const absences = studentGrades.filter(g => !g.attendance)
            
            if (studentGrades.length > 0) {
              // Считаем средний балл
              let average = 0
              if (graded.length > 0) {
                const sum = graded.reduce((acc, g) => acc + parseInt(g.grade), 0)
                average = sum / graded.length
              }
              
              averages.push({
                student_id: student.id,
                student_name: student.name,
                group_name: student.group_name,
                subject_id: subject.id,
                subject_name: subject.name,
                average: average,
                grades_count: graded.length,
                absences_count: absences.length
              })
            }
          }
        }
        
        this.averageData = averages
        
      } catch (error) {
        console.error('Ошибка загрузки данных успеваемости:', error)
        alert('Ошибка при загрузке данных успеваемости')
      } finally {
        this.avgLoading = false
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
    },

    getAverageGradeClass(average) {
      if (average >= 4.5) return 'excellent'
      if (average >= 4) return 'good'
      if (average >= 3) return 'satisfactory'
      return 'bad'
    },

    getAbsencesClass(absences) {
      if (absences === 0) return 'excellent'
      if (absences <= 2) return 'good'
      if (absences <= 5) return 'satisfactory'
      return 'bad'
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

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  margin: 0;
  font-size: 28px;
}

.admin-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid white;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s;
}

.admin-btn:hover {
  background: white;
  color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(255, 255, 255, 0.3);
}

.tabs {
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
  transition: all 0.3s;
}

.tab-btn:hover {
  background: #f0f0f0;
}

.tab-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
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
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

.average-table {
  min-width: 1000px;
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

.average-grade {
  font-weight: 600;
}

.average-grade.excellent { color: #28a745; font-weight: 700; }
.average-grade.good { color: #5cb85c; font-weight: 600; }
.average-grade.satisfactory { color: #fd7e14; font-weight: 600; }
.average-grade.bad { color: #dc3545; font-weight: 600; }

.absences-count {
  font-weight: 600;
}

.absences-count.excellent { color: #28a745; }
.absences-count.good { color: #5cb85c; }
.absences-count.satisfactory { color: #fd7e14; }
.absences-count.bad { color: #dc3545; }

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

.average-tab {
  margin-top: 20px;
}

@media (max-width: 768px) {
  .filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-content {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .header h1 {
    font-size: 22px;
  }
  
  .tabs {
    flex-direction: column;
  }
  
  .filter-item {
    min-width: 100%;
  }
  
  table {
    font-size: 14px;
  }
  
  td, th {
    padding: 10px;
  }
}
</style>