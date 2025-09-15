# Smart Commit and Push System

## Quick Usage with GitHub Copilot

Since GitHub Copilot doesn't support custom slash commands, use these approaches:

### **Method 1: Natural Language with Copilot**
In GitHub Copilot Chat, simply say:
- "commit and push all changes"
- "create a smart commit message and push"
- "analyze my changes and commit with conventional format"

GitHub Copilot will recognize these patterns from our custom instructions and suggest running:
```powershell
.\commit-and-push.ps1
```

### **Method 2: VS Code Tasks**
Press `Ctrl+Shift+P` and run:
- **"Tasks: Run Task"** → **"Smart Commit and Push"**
- **"Tasks: Run Task"** → **"Smart Commit with Custom Message"**

### **Method 3: Direct Terminal**
```powershell
# Auto-generate commit message
.\commit-and-push.ps1

# Use custom message
.\commit-and-push.ps1 "your custom message"
```

## How It Works

1. **Analyzes Changes**: Detects staged, unstaged, and untracked files
2. **Smart Detection**: Determines commit type and scope based on file patterns
3. **Conventional Commits**: Generates messages like `feat(3d-map): implement hot-reloading`
4. **One Command**: Stages, commits, and pushes in one operation

## Examples of Generated Messages

- `feat(3d-map): implement configuration hot-reloading system`
- `fix(webflow): resolve CORS issues by moving config to src folder`
- `config(core): update environment detection and configuration loading`
- `docs(readme): update deployment instructions and architecture`
- `refactor(embed): consolidate production and development environments`