import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import RecipeLibrary from '../views/RecipeLibrary.vue'
import RecipeDetail from '../views/RecipeDetail.vue'
import ProjectView from '../views/ProjectView.vue'
import ProjectPrint from '../views/ProjectPrint.vue'
import Settings from '../views/Settings.vue'

const routes = [
  { path: '/', name: 'dashboard', component: Dashboard },
  { path: '/library', name: 'library', component: RecipeLibrary },
  { path: '/library/:recipeId', name: 'recipe-detail', component: RecipeDetail, props: true },
  { path: '/projects/:projectId', name: 'project', component: ProjectView, props: true },
  { path: '/projects/:projectId/print', name: 'project-print', component: ProjectPrint, props: true },
  { path: '/settings', name: 'settings', component: Settings },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
