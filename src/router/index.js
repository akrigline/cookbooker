import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import RecipeLibrary from '../views/RecipeLibrary.vue'
import RecipeEditor from '../views/RecipeEditor.vue'
import RecipeImport from '../views/RecipeImport.vue'
import ProjectView from '../views/ProjectView.vue'
import ProjectPrint from '../views/ProjectPrint.vue'
import RecipePrint from '../views/RecipePrint.vue'
import Settings from '../views/Settings.vue'

const routes = [
  { path: '/', name: 'dashboard', component: Dashboard },
  { path: '/library', name: 'library', component: RecipeLibrary },
  { path: '/library/new', name: 'recipe-new', component: RecipeEditor },
  { path: '/library/import', name: 'recipe-import', component: RecipeImport },
  { path: '/library/:recipeId', name: 'recipe-detail', component: RecipeEditor, props: true },
  { path: '/projects/:projectId', name: 'project', component: ProjectView, props: true },
  { path: '/projects/:projectId/print', name: 'project-print', component: ProjectPrint, props: true },
  {
    path: '/projects/:projectId/recipes/:recipeId/print',
    name: 'recipe-print',
    component: RecipePrint,
    props: true,
  },
  { path: '/settings', name: 'settings', component: Settings },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
