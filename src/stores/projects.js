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
      // Three reads total rather than one per project: both child tables are
      // fetched whole and bucketed by the project ids we just read, which keeps
      // the previous semantics (rows for unknown projects stay out) without the
      // per-project round trips.
      const [projects, chapters, projectRecipes] = await Promise.all([
        db.getAllProjects(),
        db.getAllChapters(),
        db.getAllProjectRecipes(),
      ])
      const projectIds = new Set(projects.map((p) => p.id))
      this.projects = projects
      this.chapters = chapters.filter((c) => projectIds.has(c.projectId))
      this.projectRecipes = projectRecipes.filter((pr) => projectIds.has(pr.projectId))
      this.loaded = true
    },
    async createProject(project) {
      // `db.createProject` owns the column defaults and hands back the rows it
      // wrote - don't re-declare them here, or the two copies drift.
      const { projectId, project: created, miscChapter } = await db.createProject(project)
      this.projects.push(created)
      this.chapters.push(miscChapter)
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
      const { id, sequence } = await db.addChapter(projectId, name)
      this.chapters.push({ id, projectId, name, sequence, isDefault: false })
      return id
    },
    async editChapter(id, changes) {
      await db.updateChapter(id, changes)
      const chapter = this.chapters.find((c) => c.id === id)
      if (chapter) Object.assign(chapter, changes)
    },
    async removeChapter(id) {
      // Apply the reassignments db.js actually persisted. Recomputing them here
      // walked `projectRecipes` in insertion order while db.js walked the rows
      // in primary-key order, so the two orderings could disagree.
      const { reassigned } = await db.deleteChapter(id)
      for (const { id: prId, chapterId, sequence } of reassigned) {
        const pr = this.projectRecipes.find((p) => p.id === prId)
        if (pr) Object.assign(pr, { chapterId, sequence })
      }
      this.chapters = this.chapters.filter((c) => c.id !== id)
    },
    /**
     * Mirrors the `project_recipes` cascade `db.deleteRecipe` performs, so the
     * in-memory associations don't outlive the recipe they point at. Called by
     * the recipes store; an in-memory cascade must mirror every DB cascade.
     */
    pruneRecipeAssociations(recipeId) {
      this.projectRecipes = this.projectRecipes.filter((pr) => pr.recipeId !== recipeId)
    },
    async addRecipeToProject(projectId, recipeId, chapterId = null) {
      let row
      try {
        row = await db.addRecipeToProject(projectId, recipeId, chapterId)
      } catch (err) {
        // db.js enforces "a recipe appears at most once per cookbook". The UI
        // filters already-added recipes, so hitting this means a stale list -
        // the user's intent (recipe is in the cookbook) already holds, so
        // reconcile with the existing row instead of failing the interaction.
        if (!(err instanceof db.DuplicateRecipeError)) throw err
        const { id, chapterId: existingChapterId, sequence } = err.existing
        if (!this.projectRecipes.some((pr) => pr.id === id)) {
          this.projectRecipes.push({
            id,
            projectId,
            recipeId,
            chapterId: existingChapterId,
            sequence,
          })
        }
        return id
      }
      const { id, sequence, chapterId: targetChapterId } = row
      this.projectRecipes.push({ id, projectId, recipeId, chapterId: targetChapterId, sequence })
      return id
    },
    /**
     * Batch counterpart of `addRecipeToProject`. db.js reports already-present
     * recipes instead of throwing, so reconcile them the same way the single
     * add does. Returns `{ added, duplicates }` so a caller can word its
     * confirmation for what actually happened.
     */
    async addRecipesToProject(projectId, recipeIds, chapterId = null) {
      const { added, duplicates } = await db.addRecipesToProject(projectId, recipeIds, chapterId)
      for (const row of added) this.projectRecipes.push({ ...row })
      for (const { existing } of duplicates) {
        if (!this.projectRecipes.some((pr) => pr.id === existing.id)) {
          this.projectRecipes.push({ ...existing })
        }
      }
      return { added, duplicates }
    },
    async moveProjectRecipe(id, changes) {
      await db.moveProjectRecipe(id, changes)
      const association = this.projectRecipes.find((pr) => pr.id === id)
      if (association) Object.assign(association, changes)
    },
    /** Transactional N-row resequence; applies whatever db.js persisted. */
    async resequenceProjectRecipes(orderedIds) {
      const updated = await db.resequenceProjectRecipes(orderedIds)
      for (const { id, sequence } of updated) {
        const association = this.projectRecipes.find((pr) => pr.id === id)
        if (association) association.sequence = sequence
      }
    },
    /** Transactional N-row chapter move; applies whatever db.js persisted. */
    async moveProjectRecipesToChapter(ids, chapterId) {
      const moved = await db.moveProjectRecipesToChapter(ids, chapterId)
      for (const { id, chapterId: target, sequence } of moved) {
        const association = this.projectRecipes.find((pr) => pr.id === id)
        if (association) Object.assign(association, { chapterId: target, sequence })
      }
    },
    async removeProjectRecipe(id) {
      await db.removeProjectRecipe(id)
      this.projectRecipes = this.projectRecipes.filter((pr) => pr.id !== id)
    },
    async removeProjectRecipes(ids) {
      await db.removeProjectRecipes(ids)
      const removed = new Set(ids)
      this.projectRecipes = this.projectRecipes.filter((pr) => !removed.has(pr.id))
    },
    /** Returns whether a swap happened, so a caller can skip confirming a no-op. */
    async reorderChapter(chapterId, direction) {
      const chapter = this.chapters.find((c) => c.id === chapterId)
      if (!chapter || chapter.isDefault) return false
      const siblings = this.chapters
        .filter((c) => c.projectId === chapter.projectId && !c.isDefault)
        .sort((a, b) => a.sequence - b.sequence)
      const index = siblings.findIndex((c) => c.id === chapterId)
      const swapIndex = index + direction
      if (swapIndex < 0 || swapIndex >= siblings.length) return false
      await this.swapChapterSequences(chapter.id, siblings[swapIndex].id)
      return true
    },
    /** Transactional two-row sequence swap; applies whatever db.js persisted. */
    async swapChapterSequences(idA, idB) {
      const swapped = await db.swapChapterSequences(idA, idB)
      for (const { id, sequence } of swapped) {
        const chapter = this.chapters.find((c) => c.id === id)
        if (chapter) chapter.sequence = sequence
      }
    },
    async reorderProjectRecipe(projectRecipeId, direction) {
      const pr = this.projectRecipes.find((p) => p.id === projectRecipeId)
      if (!pr) return
      const siblings = this.projectRecipesForChapter(pr.chapterId)
      const index = siblings.findIndex((p) => p.id === projectRecipeId)
      const swapIndex = index + direction
      if (swapIndex < 0 || swapIndex >= siblings.length) return
      const swapped = await db.swapProjectRecipeSequences(pr.id, siblings[swapIndex].id)
      for (const { id, sequence } of swapped) {
        const association = this.projectRecipes.find((p) => p.id === id)
        if (association) association.sequence = sequence
      }
    },
  },
})
