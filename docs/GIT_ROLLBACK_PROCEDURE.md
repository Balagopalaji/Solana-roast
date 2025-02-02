# Git Rollback Procedure

## 1. Backup Current Documentation
```bash
# Create a new branch for documentation
git checkout -b documentation-v2
git add docs/
git commit -m "docs: Complete documentation restructure with implementation guide"
git push origin documentation-v2
```

## 2. Identify Last Stable Version
```bash
# List commits to find last stable point
git log --oneline

# The last stable commit should be before Firebase integration
# Note down that commit hash
```

## 3. Create Rollback Branch
```bash
# Create and checkout rollback branch from last stable commit
git checkout -b rollback/stable-core <last-stable-commit-hash>

# Bring in only the new documentation
git checkout documentation-v2 -- docs/
git add docs/
git commit -m "feat: Add new documentation structure while maintaining stable code"
```

## 4. Verify State
```bash
# Verify only documentation was brought over
git status
git diff --name-status main

# Ensure core code is at stable version
npm run verify:providers
```

## 5. Update Package Files
```bash
# Remove problematic dependencies
npm uninstall firebase firebase-admin alchemy-sdk
npm install

# Update package.json and package-lock.json
git add package*.json
git commit -m "chore: Remove unused dependencies"
```

## 6. Create Production Branch
```bash
# Create production branch from rollback
git checkout -b production
git push origin production

# Set as default branch in GitHub
``` 