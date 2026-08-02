## 1. Database & Store Updates

- [x] 1.1 Update `src/js/db.js` project defaults and methods to remove `author` / `authorName` reference
- [x] 1.2 Update `src/stores/projects.js` project store to remove `author` / `authorName` handling

## 2. Component & UI Updates

- [x] 2.1 Remove author input field from `src/views/ProjectView.vue`
- [x] 2.2 Remove author rendering from `src/components/CoverPage.vue`

## 3. Test & Verification

- [x] 3.1 Update unit tests in `src/stores/projects.test.js` and `src/js/db.test.js` to remove `author` property expectations
- [x] 3.2 Run test suite (`npm test`) and production build (`npm run build`) to ensure all pass clean
