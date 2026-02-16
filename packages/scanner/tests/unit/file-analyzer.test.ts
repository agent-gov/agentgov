import { describe, it, expect } from "vitest";
import { join } from "node:path";
import {
  analyzeFile,
  analyzeContent,
  extractAgentName,
  detectLanguage,
} from "../../src/analyzers/file-analyzer.js";

const FIXTURES_DIR = join(import.meta.dirname, "../fixtures");

describe("detectLanguage", () => {
  it("should detect Python files", () => {
    expect(detectLanguage("agent.py")).toBe("python");
    expect(detectLanguage("main.pyw")).toBe("python");
  });

  it("should detect TypeScript files", () => {
    expect(detectLanguage("agent.ts")).toBe("typescript");
    expect(detectLanguage("App.tsx")).toBe("typescript");
  });

  it("should detect JavaScript files", () => {
    expect(detectLanguage("agent.js")).toBe("javascript");
    expect(detectLanguage("agent.mjs")).toBe("javascript");
    expect(detectLanguage("agent.cjs")).toBe("javascript");
  });

  it("should return unknown for non-source files", () => {
    expect(detectLanguage("README.md")).toBe("unknown");
    expect(detectLanguage("data.json")).toBe("unknown");
    expect(detectLanguage("image.png")).toBe("unknown");
    expect(detectLanguage("Dockerfile")).toBe("unknown");
  });
});

describe("analyzeFile", () => {
  it("should detect LangChain in Python fixture", async () => {
    const result = await analyzeFile(join(FIXTURES_DIR, "python-langchain/agent.py"));

    expect(result.language).toBe("python");
    expect(result.detections.length).toBeGreaterThanOrEqual(1);

    const langchainDetection = result.detections.find((d) => d.framework === "langchain");
    expect(langchainDetection).toBeDefined();
    expect(langchainDetection!.totalConfidence).toBeGreaterThanOrEqual(0.6);
  });

  it("should detect CrewAI in Python fixture", async () => {
    const result = await analyzeFile(join(FIXTURES_DIR, "python-crewai/crew.py"));

    expect(result.language).toBe("python");
    const crewaiDetection = result.detections.find((d) => d.framework === "crewai");
    expect(crewaiDetection).toBeDefined();
    expect(crewaiDetection!.totalConfidence).toBeGreaterThanOrEqual(0.5);
  });

  it("should detect LangChain.js in TypeScript fixture", async () => {
    const result = await analyzeFile(join(FIXTURES_DIR, "ts-langchain/agent.ts"));

    expect(result.language).toBe("typescript");
    const langchainDetection = result.detections.find((d) => d.framework === "langchain");
    expect(langchainDetection).toBeDefined();
    expect(langchainDetection!.totalConfidence).toBeGreaterThanOrEqual(0.6);
  });

  it("should detect AutoGen in mixed project fixture", async () => {
    const result = await analyzeFile(join(FIXTURES_DIR, "mixed-project/agents/autogen_agent.py"));

    const autogenDetection = result.detections.find((d) => d.framework === "autogen");
    expect(autogenDetection).toBeDefined();
    expect(autogenDetection!.totalConfidence).toBeGreaterThanOrEqual(0.6);
  });

  it("should find NO detections in non-agent code", async () => {
    const result = await analyzeFile(join(FIXTURES_DIR, "no-agents/app.py"));

    expect(result.detections).toHaveLength(0);
  });

  it("should return empty for non-existent file", async () => {
    const result = await analyzeFile("/nonexistent/file.py");
    expect(result.detections).toHaveLength(0);
  });

  it("should return empty for unknown language", async () => {
    const result = await analyzeFile(join(FIXTURES_DIR, "python-crewai/crewai.yaml"));
    expect(result.language).toBe("unknown");
    expect(result.detections).toHaveLength(0);
  });
});

describe("analyzeContent", () => {
  it("should detect LangChain from inline content", () => {
    const content = `
from langchain.agents import AgentExecutor, create_react_agent
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o")
agent = create_react_agent(llm, tools, prompt)
executor = AgentExecutor(agent=agent, tools=tools)
`;
    const result = analyzeContent(content, "test.py", "python");

    const detection = result.detections.find((d) => d.framework === "langchain");
    expect(detection).toBeDefined();
    expect(detection!.totalConfidence).toBeGreaterThanOrEqual(0.8);
    expect(detection!.evidence.length).toBeGreaterThanOrEqual(3);
  });

  it("should detect multiple frameworks in the same content", () => {
    const content = `
from langchain_openai import ChatOpenAI
from autogen import AssistantAgent

llm = ChatOpenAI(model="gpt-4o")
assistant = AssistantAgent(name="helper")
`;
    const result = analyzeContent(content, "multi.py", "python");

    expect(result.detections.length).toBeGreaterThanOrEqual(2);
    const frameworks = result.detections.map((d) => d.framework);
    expect(frameworks).toContain("langchain");
    expect(frameworks).toContain("autogen");
  });

  it("should produce evidence with correct file paths and line numbers", () => {
    const content = `import os\nfrom langchain.agents import AgentExecutor\nprint("hello")`;
    const result = analyzeContent(content, "test.py", "python");

    const detection = result.detections.find((d) => d.framework === "langchain");
    expect(detection).toBeDefined();

    const importEvidence = detection!.evidence.find((e) => e.type === "import");
    expect(importEvidence).toBeDefined();
    expect(importEvidence!.line).toBe(2); // Line 2 (1-indexed)
    expect(importEvidence!.filePath).toBe("test.py");
  });

  it("should cap confidence at 1.0", () => {
    // Content with tons of signals — should still cap at 1.0
    const content = `
from langchain.agents import AgentExecutor, create_react_agent
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_anthropic import ChatAnthropic
from langchain_community.tools import DuckDuckGoSearchRun

agent = create_react_agent(llm, tools, prompt)
executor = AgentExecutor(agent=agent, tools=tools)
agent2 = create_openai_functions_agent(llm, tools, prompt)
agent3 = initialize_agent(tools, llm)
agent4 = create_tool_calling_agent(llm, tools, prompt)
`;
    const result = analyzeContent(content, "test.py", "python");
    const detection = result.detections.find((d) => d.framework === "langchain");
    expect(detection).toBeDefined();
    expect(detection!.totalConfidence).toBeLessThanOrEqual(1.0);
  });
});

describe("extractAgentName", () => {
  it("should extract class name containing 'Agent'", () => {
    const content = "class BillingAgent:\n    pass";
    expect(extractAgentName("billing.py", content)).toBe("BillingAgent");
  });

  it("should extract class name containing 'Crew'", () => {
    const content = "class ResearchCrew:\n    pass";
    expect(extractAgentName("crew.py", content)).toBe("ResearchCrew");
  });

  it("should fall back to cleaned filename", () => {
    expect(extractAgentName("langchain_agent.py")).toBe("Langchain Agent");
    expect(extractAgentName("my-cool-bot.ts")).toBe("My Cool Bot");
  });

  it("should handle files with no meaningful name", () => {
    expect(extractAgentName(".py")).toBe("Unknown Agent");
  });
});
