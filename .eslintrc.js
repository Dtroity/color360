module.exports = {
  root: true,
  extends: ["next", "turbo", "prettier"],
  settings: {
    next: {
      rootDir: ["apps/*/"],
    },
  },
  ignorePatterns: ["**/dist/**", "**/.next/**", "**/node_modules/**"],
};

