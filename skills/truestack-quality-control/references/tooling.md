# Per-language QC tooling

Detect the project's language from memory, then run the right tools for each layer.

| Layer | Node / Express | .NET / C# | Python |
|---|---|---|---|
| Tests | jest / vitest + supertest | xUnit / NUnit (`dotnet test`) | pytest |
| Property-based | fast-check | FsCheck / CsCheck | Hypothesis |
| Type-check | `tsc --noEmit` | build with warnings-as-errors | mypy / pyright |
| Lint / format | eslint + prettier | `dotnet format` + Roslyn analyzers | ruff |
| Perf / load | autocannon, clinic.js | BenchmarkDotNet, dotnet-trace | locust, py-spy, cProfile |
| Security | `npm audit`, eslint-plugin-security | `dotnet list package --vulnerable` | pip-audit, bandit |

Run tests, type-check, and lint **every time**. Reach for property-based tests on
accuracy-critical logic, and load/profiling tools on hot paths. Fix at the source — never
suppress a warning to make the suite pass.

(React frontend tooling lives in the `truestack-react-frontend` skill: React Testing Library +
jest-axe for a11y + Playwright for E2E + bundle analyzer / Lighthouse for Core Web Vitals.)
