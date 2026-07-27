import { defineStore } from 'pinia'
import * as db from '../js/db'

export const useProjectsStore = defineStore('projects', {
  state: () => ({
    projects: [],
    chapters: [],
    projectRecipes: [],
    loaded: false,
  }),
  getters: {
    chaptersForProject: (state) => (projectId) =>
      state.chapters
        .filter((c) => c.projectId === projectId)
        .sort((a, b) => a.sequence - b.sequence),
    projectRecipesForProject: (state) => (projectId) =>
      state.projectRecipes.filter((pr) => pr.projectId === projectId),
    projectRecipesForChapter: (state) => (chapterId) =>
      state.projectRecipes
        .filter((pr) => pr.chapterId === chapterId)
        .sort((a, b) => a.sequence - b.sequence),
  },
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
      const { projectId, miscChapterId } = await db.createProject(project)
      this.projects.push({
        id: projectId,
        title: '',
        subtitle: '',
        author: '',
        accentColor: '#d97742',
        coverTemplate: 'classic',
        pageNumbersEnabled: true,
        ...project,
      })
      this.chapters.push({
        id: miscChapterId,
        projectId,
        name: db.MISC_CHAPTER_NAME,
        sequence: 0,
        isDefault: true,
      })
      return projectId
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
    async createChapter(projectId, name) {
      const id = await db.addChapter(projectId, name)
      const existing = this.chaptersForProject(projectId)
      const sequence = existing.length
        ? Math.max(...existing.map((c) => c.sequence ?? 0)) + 1
        : 0
      this.chapters.push({ id, projectId, name, sequence, isDefault: false })
      return id
    },
    async editChapter(id, changes) {
      await db.updateChapter(id, changes)
      const chapter = this.chapters.find((c) => c.id === id)
      if (chapter) Object.assign(chapter, changes)
    },
    async removeChapter(id) {
      await db.deleteChapter(id)
      const chapter = this.chapters.find((c) => c.id === id)
      if (chapter) {
        const misc = this.chapters.find(
          (c) => c.projectId === chapter.projectId && c.isDefault,
        )
        if (misc) {
          this.projectRecipes
            .filter((pr) => pr.chapterId === id)
            .forEach((pr) => {
              pr.chapterId = misc.id
            })
        }
      }
      this.chapters = this.chapters.filter((c) => c.id !== id)
    },
    async addRecipeToProject(projectId, recipeId, chapterId = null) {
      const id = await db.addRecipeToProject(projectId, recipeId, chapterId)
      const targetChapterId =
        chapterId ?? this.chapters.find((c) => c.projectId === projectId && c.isDefault)?.id
      this.projectRecipes.push({ id, projectId, recipeId, chapterId: targetChapterId, sequence: 0 })
      return id
    },
    async moveProjectRecipe(id, changes) {
      await db.moveProjectRecipe(id, changes)
      const association = this.projectRecipes.find((pr) => pr.id === id)
      if (association) Object.assign(association, changes)
    },
    async removeProjectRecipe(id) {
      await db.removeProjectRecipe(id)
      this.projectRecipes = this.projectRecipes.filter((pr) => pr.id !== id)
    },
    async reorderChapter(chapterId, direction) {
      const chapter = this.chapters.find((c) => c.id === chapterId)
      if (!chapter || chapter.isDefault) return
      const siblings = this.chapters
        .filter((c) => c.projectId === chapter.projectId && !c.isDefault)
        .sort((a, b) => a.sequence - b.sequence)
      const index = siblings.findIndex((c) => c.id === chapterId)
      const swapIndex = index + direction
      if (swapIndex < 0 || swapIndex >= siblings.length) return
      const other = siblings[swapIndex]
      const [seqA, seqB] = [chapter.sequence, other.sequence]
      await Promise.all([
        this.editChapter(chapter.id, { sequence: seqB }),
        this.editChapter(other.id, { sequence: seqA }),
      ])
    },
    async reorderProjectRecipe(projectRecipeId, direction) {
      const pr = this.projectRecipes.find((p) => p.id === projectRecipeId)
      if (!pr) return
      const siblings = this.projectRecipesForChapter(pr.chapterId)
      const index = siblings.findIndex((p) => p.id === projectRecipeId)
      const swapIndex = index + direction
      if (swapIndex < 0 || swapIndex >= siblings.length) return
      const other = siblings[swapIndex]
      const [seqA, seqB] = [pr.sequence, other.sequence]
      await Promise.all([
        this.moveProjectRecipe(pr.id, { sequence: seqB }),
        this.moveProjectRecipe(other.id, { sequence: seqA }),
      ])
    },
  },
})
