# Contributing to HooksDream

First off, thank you for considering contributing to HooksDream! It's people like you that make HooksDream such a great project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/AbdolHamidDev/HooksDream.git
   cd HooksDream
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/AbdolHamidDev/HooksDream.git
   ```
4. **Create a new branch** for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check the existing issues as you might find that the problem has already been reported. When creating a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** (code snippets, screenshots, etc.)
- **Describe the behavior you observed** and what behavior you expected
- **Include information about your environment** (OS, Node.js version, browser, etc.)

### Suggesting Features

Feature requests are welcome! Please:

- **Use a clear and descriptive title**
- **Provide a detailed description of the proposed feature**
- **Explain why this feature would be useful** to most users
- **List some alternatives** you've considered, if any

### Pull Requests

1. **Fork the repo** and create your branch from `main`
2. **Make your changes** following our coding standards
3. **Add tests** for any new functionality
4. **Ensure all tests pass**
5. **Update documentation** if needed
6. **Submit a pull request** with a clear description

## Development Setup

### Prerequisites

- Node.js >= 20.x
- Python >= 3.9
- MongoDB
- Git

### Backend Setup (Node.js)

```bash
cd backend
npm install
cp .env.example .env  # Configure your environment variables
npm run dev
```

### Frontend Setup (React)

```bash
cd frontend
npm install
cp .env.example .env  # Configure your environment variables
npm run dev
```

### Python Backend Setup

```bash
cd pyBackend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Configure your environment variables
python run.py
```

## Pull Request Process

1. **Update the README.md** with details of changes to the interface, if applicable
2. **Update the CHANGELOG.md** with a note describing your change
3. **Ensure all tests pass** and there are no linting errors
4. **Request review** from at least one maintainer
5. **Address review comments** and push updates
6. Once approved, a maintainer will merge your PR

### PR Title Format

Use conventional commits format:

- `feat: add dark mode support`
- `fix: resolve login redirect issue`
- `docs: update installation guide`
- `refactor: simplify post controller logic`
- `test: add unit tests for auth service`
- `chore: update dependencies`

## Coding Standards

### General

- Write clean, readable, and maintainable code
- Follow the existing code style in each module
- Comment your code when necessary, especially for complex logic
- Keep functions small and focused on a single responsibility

### JavaScript/TypeScript (Backend & Frontend)

- Use ES6+ syntax
- Follow [Airbnb JavaScript Style Guide](https://airbnb.io/javascript/)
- Use meaningful variable and function names
- Prefer `const` and `let` over `var`
- Use async/await for asynchronous operations
- Handle errors appropriately with try/catch

### Python

- Follow [PEP 8](https://pep8.org/) style guide
- Use type hints where appropriate
- Write docstrings for functions and classes
- Use meaningful variable and function names

### Git

- Write clear, descriptive commit messages
- Keep commits atomic (one logical change per commit)
- Don't commit commented-out code or debug statements
- Don't commit secrets or credentials

## Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (formatting, etc.)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools
- `ci`: Changes to CI configuration files and scripts
- `revert`: Reverts a previous commit

### Examples

```bash
feat(auth): add OTP verification for login
fix(posts): resolve image upload error on mobile
docs: update installation instructions
refactor(chat): simplify message controller logic
test(auth): add unit tests for login endpoint
```

## Reporting Bugs

### Before Submitting a Bug Report

- **Check the documentation** for known issues
- **Search existing issues** to avoid duplicates
- **Try the latest version** to see if the bug has been fixed
- **Collect relevant information** (error messages, logs, screenshots)

### Bug Report Template

```markdown
## Description
A clear and concise description of what the bug is.

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior
A clear and concise description of what you expected to happen.

## Actual Behavior
A clear and concise description of what actually happened.

## Screenshots
If applicable, add screenshots to help explain your problem.

## Environment
- OS: [e.g. Windows 11, macOS Sonoma]
- Browser: [e.g. Chrome 120, Firefox 121]
- Node.js version: [e.g. 20.10.0]
- Python version: [e.g. 3.11.0]

## Additional Context
Add any other context about the problem here.
```

## Suggesting Features

### Feature Request Template

```markdown
## Feature Description
A clear and concise description of the feature you'd like to see.

## Problem Statement
Is your feature request related to a problem? Please describe.
Example: "I'm always frustrated when..."

## Proposed Solution
A clear and concise description of what you want to happen.

## Alternatives Considered
A clear and concise description of any alternative solutions or features you've considered.

## Additional Context
Add any other context, mockups, or screenshots about the feature request here.
```

## Questions?

If you have any questions or need help, feel free to:

- Open an issue with the `question` label
- 💼 LinkedIn: [www.linkedin.com/in/hamidabdol](https://www.linkedin.com/in/hamidabdol)
- 📧 Email: [abdolhamid.dev@gmail.com](mailto:abdolhamid.dev@gmail.com)
- 🌐 Portfolio: [https://hamid.id.vn](https://hamid.id.vn)
- ☕ Buy Me a Coffee: [https://buymeacoffee.com/hamidabdol](https://buymeacoffee.com/hamidabdol)

Thank you for contributing! 🎉
