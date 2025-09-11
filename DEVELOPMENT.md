# Development Guide

## 🛠️ Preventive Measures for Deployment Issues

This project is configured with several tools to catch deployment issues early and prevent them from reaching Vercel.

### **Available Scripts**

```bash
# Development
npm run dev          # Start development server

# Quality Checks
npm run lint         # Run ESLint
npm run lint:fix     # Run ESLint with auto-fix
npm run type-check   # Run TypeScript type checking
npm run build        # Build for production

# Comprehensive Checks
npm run check-all    # Run all checks (type-check + lint + build)
npm run pre-deploy   # Alias for check-all (run before deploying)
```

### **Pre-commit Hooks**

The project uses Husky and lint-staged to automatically run checks before each commit:

- **ESLint**: Fixes auto-fixable issues and reports errors
- **TypeScript**: Type checks all TypeScript files
- **Prevents commits** with errors from being made

### **Strict Configuration**

#### TypeScript (`tsconfig.json`)
- `strict: true` - Enables all strict type checking options
- `noUnusedLocals: true` - Error on unused local variables
- `noUnusedParameters: true` - Error on unused function parameters
- `exactOptionalPropertyTypes: true` - Stricter optional property handling

#### ESLint (`eslint.config.mjs`)
- `@typescript-eslint/no-unused-vars: "error"` - Error on unused variables
- `@typescript-eslint/no-explicit-any: "error"` - Error on `any` types
- `react-hooks/exhaustive-deps: "error"` - Error on missing useEffect dependencies
- `react/no-unescaped-entities: "error"` - Error on unescaped HTML entities

### **Best Practices**

#### Before Committing
```bash
npm run check-all
```
This will catch the same issues that Vercel will catch.

#### Before Pushing
```bash
npm run pre-deploy
```
This ensures your code will pass Vercel's build process.

#### If You Get Errors
1. **TypeScript errors**: Fix type issues
2. **ESLint errors**: Run `npm run lint:fix` to auto-fix many issues
3. **Build errors**: Check for missing dependencies or configuration issues

### **Why This Helps**

- **Catches issues early**: Before they reach Vercel
- **Consistent environment**: Same checks locally and in production
- **Prevents deployment failures**: No more surprise build failures
- **Improves code quality**: Enforces best practices automatically

### **Troubleshooting**

If you encounter issues:

1. **Clear cache**: `rm -rf .next node_modules && npm install`
2. **Check TypeScript**: `npm run type-check`
3. **Check ESLint**: `npm run lint`
4. **Test build**: `npm run build`

The goal is to make the development experience as close as possible to the production build environment.
