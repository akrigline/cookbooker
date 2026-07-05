import { defineStore } from 'pinia'
import * as db from '../js/db'

export const useProjectsStore = defineStore('projects', {
  state: () => ({
    projects: [],
    chapters: [],
    projectRecipes: [],
    loaded: false,
  }),
  actions: {
    async load() {
      this.projects = await db.getAllProjects()
      const chapterLists = await Promise.all(
        this.projects.map((p) => db.getChaptersForProject(p.id)),
      )
      const projectRecipeLists = await Promise.all(
        this.projects.map((p) => db.getProjectRecipes(p.id)),
      )
      this.chapters = chapterLists.flat()
      this.projectRecipes = projectRecipeLists.flat()
      this.loaded = true
    },
    async createProject(project) {
      const id = await db.addProject(project)
      this.projects.push({ ...project, id })
      return id
    },
    async editProject(id, changes) {
      await db.updateProject(id, changes)
      const project = this.projects.find((p) => p.id === id)
      if (project) Object.assign(project, changes)
    },
    async removeProject(id) {
      await db.deleteProject(id)
      this.projects = this.projects.filter((p) => p.id !== id)
      this.chapters = this.chapters.filter((c) => c.projectId !== id)
      this.projectRecipes = this.projectRecipes.filter((pr) => pr.projectId !== id)
    },
    async createChapter(chapter) {
      const id = await db.addChapter(chapter)
      this.chapters.push({ ...chapter, id })
      return id
    },
    async editChapter(id, changes) {
      await db.updateChapter(id, changes)
      const chapter = this.chapters.find((c) => c.id === id)
      if (chapter) Object.assign(chapter, changes)
    },
    async addRecipeToChapter(association) {
      const id = await db.addProjectRecipe(association)
      this.projectRecipes.push({ ...association, id })
      return id
    },
    async moveProjectRecipe(id, changes) {
      await db.updateProjectRecipe(id, changes)
      const association = this.projectRecipes.find((pr) => pr.id === id)
      if (association) Object.assign(association, changes)
    },
    async removeProjectRecipe(id) {
      await db.removeProjectRecipe(id)
      this.projectRecipes = this.projectRecipes.filter((pr) => pr.id !== id)
    },
  },
})
