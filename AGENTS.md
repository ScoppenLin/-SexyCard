# AGENTS.md

## GitHub Push Workflow

When code needs to be pushed to GitHub, use the GitHub Plugin workflow instead of relying on direct local HTTP/HTTPS Git commands.

This machine's HTTP/HTTPS traffic is often blocked by the firewall, so direct commands such as `git push` may fail even when the repository and credentials are otherwise correct. Prefer the GitHub Plugin for publishing branches, opening pull requests, and handling GitHub-side operations.

If a deployment is needed, update GitHub through the plugin first and then verify the Vercel commit status. Avoid treating a local `git push` or local branch state as proof that GitHub or Vercel has the latest files.

## Local Testing

Do not rely on starting a local web server for validation on this machine. Local web servers often fail to run here, so avoid spending time on local browser/server-based testing unless the user explicitly asks for it.

Prefer lightweight validation that does not require a running web server, such as parsing JSON files, checking changed files directly, or running targeted TypeScript transpile checks when dependencies are already available. Use Vercel's deployment result as the final web-app validation when the change is meant for production.

Avoid heavy local commands unless they are truly necessary. Full `npm install`, `npm run build`, broad recursive scans, and long `git diff` output can be slow or hang on this machine. Start with narrow commands such as `rg`, `cat`, `wc`, and focused file reads. If a command hangs, stop waiting, use a smaller command, and make sure any needed background session is polled or closed before finishing.

## Local Environment Notes

Assume the local workspace may contain user edits. Do not revert unrelated changes. If a clean comparison or publishing base is needed, use a temporary worktree or GitHub Plugin reads instead of modifying the user's dirty working tree.

Network access and dependency downloads are unreliable here. Prefer existing installed dependencies and the bundled Codex runtimes. Ask before doing anything that requires fresh downloads or a long-running local service.
