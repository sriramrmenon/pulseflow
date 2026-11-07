
# Contributing to PulseFlow

Thank you for your interest in contributing to PulseFlow.

PulseFlow is a camera-based breathing visualisation application developed using JavaScript, Node.js, Electron and the Presage SmartSpectra SDK.

This document describes the Git branching strategy, development workflow and contribution guidelines used in the project.

## 1. Branching Strategy

PulseFlow follows a lightweight feature-branch workflow.

The `master` branch is the main development and release branch. All changes should be developed in separate branches and merged into `master` through pull requests.

### Branch Naming Convention

Branches should include the relevant Jira issue key.

| Branch Type | Naming Convention | Purpose |
|-------------|-------------------|---------|
| Main | `master` | Stable, reviewed code |
| Feature | `feature/PUL-XX-description` | New functionality |
| Bug Fix | `bugfix/PUL-XX-description` | Fixing application bugs |
| Maintenance | `chore/PUL-XX-description` | Configuration and maintenance |
| Documentation | `docs/PUL-XX-description` | Documentation updates |

Example:

`feature/PUL-15-install-smartspectra-sdk`

## 2. Development Workflow

Follow these steps when working on a Jira issue.

### Step 1: Update the Main Branch

Ensure your local `master` branch is up to date with the remote repository.

```bash
git switch master
git pull --ff-only origin master
```

### Step 2: Create a Branch

Create a branch using the Jira issue key and a short description.

Example:

```bash
git switch -c feature/PUL-15-install-smartspectra-sdk
```

### Step 3: Implement Changes

Make the required changes for the Jira issue.

Keep changes focused on the issue being addressed.

Before committing:

- Review the code for errors.
- Run relevant tests.
- Check that no credentials or sensitive data have been added.
- Update documentation where necessary.

### Step 4: Stage and Commit

Stage only the required files.

```bash
git add <file-name>
```

Review the staged changes:

```bash
git diff --cached
```

Commit using the project's commit message convention.

Example:

```bash
git commit -m "feat(PUL-15): integrate SmartSpectra SDK"
```

### Step 5: Push the Branch

Push the feature branch to Bitbucket.

```bash
git push -u origin feature/PUL-15-install-smartspectra-sdk
```

### Step 6: Create a Pull Request

Create a pull request in Bitbucket.

- Source branch: Your feature branch
- Destination branch: `master`
- Title: Include the Jira issue key and a meaningful description
- Description: Summarise the changes, testing performed and any known limitations

Example PR title:

`PUL-15: Integrate SmartSpectra SDK`

Review the changes before merging.

### Step 7: Merge the Pull Request

Once the changes have been reviewed and the required checks pass, merge the pull request into `master`.

Do not merge changes that contain known security issues or failing mandatory tests.

### Step 8: Delete the Completed Branch

After merging the pull request, delete the remote feature branch.

Update your local repository:

```bash
git switch master
git pull --ff-only origin master
```

Delete the local feature branch:

```bash
git branch -d feature/PUL-15-install-smartspectra-sdk
```

## 3. Commit Message Convention

PulseFlow follows the Conventional Commits format with Jira issue references.

Format:

`type(PUL-XX): short description`

### Commit Types

| Type | Purpose |
|------|---------|
| `feat` | Introduces a new feature |
| `fix` | Fixes a bug |
| `docs` | Documentation changes |
| `chore` | Maintenance or configuration |
| `refactor` | Code changes without changing external behaviour |
| `test` | Adding or updating tests |
| `ci` | CI/CD pipeline changes |

Examples:

`feat(PUL-18): implement breathing measurement handling`

`fix(PUL-27): handle camera permission errors`

`docs(PUL-7): document Git branching strategy`

`ci(PUL-33): add Bitbucket pipeline configuration`

## 4. Pull Request Guidelines

Each pull request should:

- Reference the relevant Jira issue.
- Explain the purpose of the changes.
- Contain only related modifications.
- Include appropriate tests when applicable.
- Pass all required CI checks.
- Avoid committing API keys or sensitive information.
- Update documentation where necessary.

### Pull Request Description Template

**Jira Issue:** PUL-XX

**Summary:**
Describe the changes made.

**Testing:**
Explain how the changes were tested.

**Known Limitations:**
List any remaining limitations.

**Checklist:**
- [ ] Code reviewed
- [ ] Tests completed
- [ ] No secrets committed
- [ ] Documentation updated

## 5. Security Guidelines

PulseFlow uses a camera-based physiological measurement SDK.

Contributors must take care not to expose sensitive information.

The following must not be committed to the repository:

- API keys or access tokens
- `.env` files containing credentials
- Private camera recordings
- Raw physiological measurements containing personal information
- Sensitive application logs

Use environment variables or another secure configuration mechanism for credentials.

Where an `.env.example` file is provided, it must contain placeholder values only.

## 6. Testing

Before raising a pull request:

1. Verify that the application starts successfully.
2. Run available unit tests and linting checks.
3. Test the relevant functionality.
4. Document any manual testing performed.
5. Confirm that existing functionality has not been broken.

Automated testing and CI/CD requirements will be expanded as the project develops.

## 7. Jira Workflow

PulseFlow uses Jira to manage development work.

Issues follow this workflow:

`To Do → In Progress → Done`

- **To Do:** Work has been identified but not started.
- **In Progress:** Development or testing is underway.
- **Done:** Acceptance criteria have been met and any required pull request has been merged.

Where possible, Git branches, commits and pull requests should reference the Jira issue key.

## 8. Code of Conduct

Contributors should communicate respectfully, provide constructive feedback and collaborate professionally.

Technical discussions should remain focused on improving the project and helping contributors learn.

## 9. Project Status

PulseFlow is currently under active development as part of the Presage SmartSpectra SDK Challenge 2026.

The development workflow and guidelines may evolve as the project grows.
