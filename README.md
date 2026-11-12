<h1 align="center">Modern Angular Workshop</h1>

<p align="center">
  <img alt="workshops-de-logo-blue" src="docs/logo-workshops-de.png" width="120">
  <br>
  <em>The best way to start embracing AI for your all-day development tasks</em>
  <br>
</p>

<p align="center">
  <a href="https://workshops.de/seminare-schulungen-kurse/angular-ai-agent-driven-development" target="_blank"><strong>workshops.de</strong></a>
  <br>
</p>

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the tech stack, dependencies, and application architecture.

## Local Development

| Command       | Description                                      |
| ------------- | ------------------------------------------------ |
| `npm install` | Installs the packages to develop the Angular app |
| `npm start`   | Starts the Angular app                           |

## Code generation evaluation

The evaluator lives in `web-codegen-scorer-playground`. From this repository root,
install its dependencies with `npm --prefix web-codegen-scorer-playground install`.
Use the project's Node.js 24 version. In PowerShell, configure credentials for the
GPT-5.1 generator and Gemini automatic ratings/summary, then run:

```powershell
$env:OPENAI_API_KEY = '<your OpenAI API key>'
$env:GEMINI_API_KEY = '<your Gemini API key>'
npm run eval.gpt
```

The launcher runs `goal-tracker` with `gpt-5.1-no-thinking` in the playground directory
and adapts Windows file imports for scorer 0.0.69. Evaluation builds install their
Angular template dependencies automatically. Additional scorer arguments are
forwarded; use `npm run eval.gpt -- --help` to inspect them without model calls.
The old `npm run eval.opus` command remains an alias for the GPT evaluation.
Saved reports retain the model selected for their original run; rerun the
evaluation and select the new report to see the GPT model in Assessment Summary.

View saved results with `npm run report` at `http://localhost:4201`. The viewer reads
`web-codegen-scorer-playground/.web-codegen-scorer/reports` and needs no API key for
viewing reports. It uses a different default port from BookMonkey. To select another
port, run `npm run report -- --port=4300`.

A run with `results: []` and zero maximum points has no assessment percentage.
Check `summary.json` under `details.summary.completionStats.failedPrompts` for
the failure. The Windows launcher uses directory junctions for scorer workspaces
to avoid `EPERM` when linking `node_modules`. After fixing a failed run, rerun
`npm run eval.gpt`, restart the report viewer, and open the new report.

## The API

| Command              | Description                                       |
| -------------------- | ------------------------------------------------- |
| `npx bookmonkey-api` | Installs and starts the HTTP API "Bookmonkey API" |

The API provides fake data that you can use in your Angular application.

> [!NOTE]
> The API starts at http://localhost:4730.
> When you open this page, you’ll find documentation for all endpoints. 🚀

## VS Code

If you are using [VS Code](https://code.visualstudio.com/) as you editor of choice, you might see a popup after opening this repository.
We added a few plugin recommendations to simplify writing code during the workshop:

1. Angular Language Service - Adds better syntax-highlighting & automatic refactorings
1. Prettier - Formats your code automatically in the same way across your project.
