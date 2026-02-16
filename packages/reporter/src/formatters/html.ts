import { writeFile } from "node:fs/promises";
import type { ScanResult } from "@agentgov/scanner";

/**
 * Generate a standalone HTML report
 */
export function formatHtml(result: ScanResult): string {
  const agentRows = result.agents
    .map(
      (agent, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${escapeHtml(agent.name)}</strong></td>
        <td><span class="badge badge-${agent.framework}">${escapeHtml(agent.framework)}</span></td>
        <td><span class="confidence confidence-${getConfidenceClass(agent.confidence)}">${(agent.confidence * 100).toFixed(0)}%</span></td>
        <td><code>${escapeHtml(agent.location.filePath)}</code></td>
        <td>${escapeHtml(agent.metadata.language)}</td>
      </tr>`,
    )
    .join("\n");

  const frameworkData = JSON.stringify(
    Object.entries(result.frameworkBreakdown).map(([name, count]) => ({
      name,
      count,
    })),
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AgentGov Audit Report — ${escapeHtml(result.summary.scanPath)}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; line-height: 1.6; }
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
    .header { text-align: center; padding: 3rem 0 2rem; border-bottom: 1px solid #1e293b; margin-bottom: 2rem; }
    .header h1 { font-size: 2rem; color: #38bdf8; margin-bottom: 0.5rem; }
    .header p { color: #94a3b8; font-size: 0.9rem; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .stat-card { background: #1e293b; border-radius: 12px; padding: 1.5rem; text-align: center; }
    .stat-card .value { font-size: 2.5rem; font-weight: 700; color: #38bdf8; }
    .stat-card .label { color: #94a3b8; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .chart-container { background: #1e293b; border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem; max-width: 500px; }
    .chart-container h2 { margin-bottom: 1rem; font-size: 1.1rem; }
    table { width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 12px; overflow: hidden; }
    th { background: #334155; padding: 0.75rem 1rem; text-align: left; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; }
    td { padding: 0.75rem 1rem; border-bottom: 1px solid #1e293b; }
    tr:hover { background: #1e293b80; }
    code { background: #334155; padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.85rem; }
    .badge { display: inline-block; padding: 0.15rem 0.6rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; background: #334155; }
    .confidence { font-weight: 700; }
    .confidence-high { color: #4ade80; }
    .confidence-medium { color: #fbbf24; }
    .confidence-low { color: #f87171; }
    .section { margin-bottom: 2rem; }
    .section h2 { font-size: 1.3rem; margin-bottom: 1rem; color: #f1f5f9; }
    .footer { text-align: center; padding: 2rem 0; border-top: 1px solid #1e293b; margin-top: 2rem; color: #64748b; font-size: 0.85rem; }
    .footer a { color: #38bdf8; text-decoration: none; }
    .footer a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AgentGov Audit Report</h1>
      <p>Scanned: ${escapeHtml(result.summary.scanPath)} &bull; ${new Date(result.summary.timestamp).toLocaleString()} &bull; ${(result.summary.scanDuration / 1000).toFixed(1)}s</p>
    </div>

    <div class="stats">
      <div class="stat-card">
        <div class="value">${result.summary.totalAgents}</div>
        <div class="label">Agents Found</div>
      </div>
      <div class="stat-card">
        <div class="value">${result.summary.totalFiles}</div>
        <div class="label">Files Scanned</div>
      </div>
      <div class="stat-card">
        <div class="value">${Object.keys(result.frameworkBreakdown).length}</div>
        <div class="label">Frameworks</div>
      </div>
      <div class="stat-card">
        <div class="value">${(result.summary.scanDuration / 1000).toFixed(1)}s</div>
        <div class="label">Scan Time</div>
      </div>
    </div>

    <div class="chart-container">
      <h2>Framework Breakdown</h2>
      <canvas id="frameworkChart" width="400" height="300"></canvas>
    </div>

    <div class="section">
      <h2>Discovered Agents</h2>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Agent</th>
            <th>Framework</th>
            <th>Confidence</th>
            <th>Location</th>
            <th>Language</th>
          </tr>
        </thead>
        <tbody>
          ${agentRows}
        </tbody>
      </table>
    </div>

    <div class="footer">
      <p>Generated by <a href="https://agent-gov.com">AgentGov</a> v${result.metadata.version} &bull; AI Agent Governance Platform</p>
      <p style="margin-top: 0.5rem;">Want governance for these agents? Visit <a href="https://agent-gov.com">agent-gov.com</a></p>
    </div>
  </div>

  <script>
    const data = ${frameworkData};
    const colors = ['#38bdf8', '#818cf8', '#a78bfa', '#f472b6', '#fb923c', '#4ade80', '#fbbf24', '#f87171', '#94a3b8'];
    new Chart(document.getElementById('frameworkChart'), {
      type: 'doughnut',
      data: {
        labels: data.map(d => d.name),
        datasets: [{
          data: data.map(d => d.count),
          backgroundColor: colors.slice(0, data.length),
          borderWidth: 0,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#e2e8f0', padding: 12, font: { size: 12 } }
          }
        }
      }
    });
  </script>
</body>
</html>`;
}

/**
 * Write HTML report to file
 */
export async function writeHtmlReport(result: ScanResult, outputPath: string): Promise<void> {
  const html = formatHtml(result);
  await writeFile(outputPath, html, "utf-8");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getConfidenceClass(confidence: number): string {
  if (confidence >= 0.8) return "high";
  if (confidence >= 0.6) return "medium";
  return "low";
}
