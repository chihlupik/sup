<template>
  <div id="app">
    <MainPage 
      v-if="!showAdmin" 
      @open-admin="showAdmin = true"
    />
    <AdminPanel 
      v-else 
      @close="showAdmin = false"
    />
  </div>
</template>

<script>
import MainPage from './components/MainPage.vue'
import AdminPanel from './components/AdminPanel.vue'

export default {
  name: 'App',
  components: {
    MainPage,
    AdminPanel
  },
  data() {
    return {
      showAdmin: false
    }
  }
}
</script>

<style>
#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  margin: 0;
  padding: 0;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}
</style>