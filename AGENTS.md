# Repository Guidelines

## Style
- Use two spaces for indentation in TypeScript and JSON files.
- Ensure files end with a newline and no trailing whitespace.
- Never use hardcoded strings in your code. Always add or use variables from the config folder.

## Testing
- After making changes, run `npx playwright test --workers=4 --grep-invert "@setup" --max-failures=1`.
- If failures occur, attempt to fix them and re-run the command.

## Commit Messages
- Write concise commit messages describing the change.
