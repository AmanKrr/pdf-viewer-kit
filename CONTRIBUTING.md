# Contributing to pdf-viewer-kit

Thank you for your interest in contributing to pdf-viewer-kit! We welcome contributions from the community.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/pdf-viewer-kit.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Push to your fork and submit a pull request

## Development Setup
```bash
# Install dependencies
npm install

# Run development build
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Coding Standards

### Naming Conventions

We follow specific naming conventions for class members:

- **`__methodName`** or **`__variableName`**: Private methods/variables (double underscore)
- **`_methodName`** or **`_variableName`**: Protected methods/variables (single underscore)
- **`methodName`** or **`variableName`**: Public methods/variables

**Example:**
```typescript
class PDFViewer {
  // Public property
  public currentPage: number;

  // Protected property
  protected _config: ViewerConfig;

  // Private property
  private __internalState: State;

  // Public method
  public render(): void {
    this.__initializeCanvas();
  }

  // Protected method
  protected _validateConfig(): boolean {
    return this.__checkBounds();
  }

  // Private method
  private __checkBounds(): boolean {
    // Implementation
  }
}
```

### General Guidelines

- Write clean, readable, and maintainable code
- Add comments for complex logic
- Follow TypeScript best practices
- Ensure type safety - avoid `any` types when possible
- Write unit tests for new features
- Update documentation for API changes

## Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for clear and semantic commit messages. This enables automated versioning through semantic release.

### Commit Message Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: A new feature (triggers MINOR version bump)
- **fix**: A bug fix (triggers PATCH version bump)
- **docs**: Documentation only changes
- **style**: Changes that don't affect code meaning (formatting, whitespace)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Changes to build process or auxiliary tools
- **ci**: Changes to CI configuration files and scripts

### Breaking Changes

Add `BREAKING CHANGE:` in the commit body or append `!` after the type/scope to indicate breaking changes (triggers MAJOR version bump):
```
feat!: redesign viewer API

BREAKING CHANGE: The initialize() method now requires a config object
```

### Examples
```bash
# Feature addition
git commit -m "feat(viewer): add zoom controls"

# Bug fix
git commit -m "fix(rendering): resolve page rendering issue on mobile"

# Documentation
git commit -m "docs(readme): update installation instructions"

# Breaking change
git commit -m "feat(api)!: change constructor parameters

BREAKING CHANGE: PDFViewer constructor now accepts options object instead of individual parameters"

# With scope and body
git commit -m "refactor(core): optimize rendering engine

Improved performance by implementing canvas pooling and 
reducing unnecessary re-renders."
```

### Scope Guidelines

Use scopes to indicate which part of the codebase is affected:

- `viewer`: PDF viewer component
- `rendering`: Rendering engine
- `controls`: UI controls (zoom, navigation, etc.)
- `api`: Public API changes
- `core`: Core functionality
- `utils`: Utility functions
- `types`: TypeScript type definitions
- `deps`: Dependency updates

## Pull Request Process

1. **Update documentation**: Ensure README.md and relevant docs are updated
2. **Add tests**: Include tests for new features or bug fixes
3. **Follow commit convention**: Use conventional commits for all commits
4. **Update CHANGELOG**: Not required - semantic-release will handle this automatically
5. **Describe your changes**: Provide a clear description in the PR

### PR Title Format

PR titles should also follow conventional commit format:
```
feat(viewer): add thumbnail navigation
fix(rendering): resolve memory leak in canvas cleanup
docs: improve API documentation
```

### PR Checklist

Before submitting your PR, ensure:

- [ ] Code follows the naming conventions (__, _, public)
- [ ] All commits follow conventional commit format
- [ ] Tests pass (`npm test`)
- [ ] Documentation is updated
- [ ] No console.log or debugging code left
- [ ] Code is properly typed (TypeScript)
- [ ] Branch is up to date with main

## Reporting Bugs

When reporting bugs, please include:

- **Description**: Clear description of the issue
- **Steps to reproduce**: Detailed steps to reproduce the behavior
- **Expected behavior**: What you expected to happen
- **Actual behavior**: What actually happened
- **Environment**: Browser, OS, pdf-viewer-kit version
- **Screenshots**: If applicable
- **Code sample**: Minimal reproduction code

Use the issue template if available.

## Suggesting Features

We welcome feature suggestions! Please:

1. Check existing issues to avoid duplicates
2. Clearly describe the feature and its use case
3. Explain why this feature would be useful
4. Provide examples or mockups if possible

## Questions?

Feel free to open an issue for questions or reach out through GitHub discussions.

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to pdf-viewer-kit! 🎉
