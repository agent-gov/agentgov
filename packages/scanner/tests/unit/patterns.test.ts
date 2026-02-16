import { describe, it, expect } from "vitest";
import { ALL_PATTERNS, getPatternsForLanguage } from "../../src/patterns/index.js";

describe("Pattern Registry", () => {
  it("should have patterns for all major Python frameworks", () => {
    const pythonPatterns = getPatternsForLanguage("python");
    const frameworks = pythonPatterns.map((p) => p.framework);

    expect(frameworks).toContain("langchain");
    expect(frameworks).toContain("langgraph");
    expect(frameworks).toContain("crewai");
    expect(frameworks).toContain("autogen");
    expect(frameworks).toContain("semantic-kernel");
    expect(frameworks).toContain("haystack");
    expect(frameworks).toContain("llamaindex");
    expect(frameworks).toContain("openai-assistants");
    expect(frameworks).toContain("anthropic-claude");
    expect(frameworks).toContain("aws-bedrock");
    expect(frameworks).toContain("google-vertex");
  });

  it("should have patterns for TypeScript/JavaScript frameworks", () => {
    const tsPatterns = getPatternsForLanguage("typescript");
    const frameworks = tsPatterns.map((p) => p.framework);

    expect(frameworks).toContain("langchain");
    expect(frameworks).toContain("vercel-ai");
    expect(frameworks).toContain("openai-assistants");
  });

  it("should have at least 13 total framework pattern sets", () => {
    expect(ALL_PATTERNS.length).toBeGreaterThanOrEqual(13);
  });

  it("should have at least one import pattern per framework", () => {
    for (const pattern of ALL_PATTERNS) {
      expect(
        pattern.imports.length,
        `${pattern.framework} should have at least one import pattern`,
      ).toBeGreaterThanOrEqual(1);
    }
  });

  it("should have valid confidence values (0-1) for all patterns", () => {
    for (const fp of ALL_PATTERNS) {
      for (const p of [...fp.imports, ...fp.instantiations]) {
        expect(p.confidence).toBeGreaterThanOrEqual(0);
        expect(p.confidence).toBeLessThanOrEqual(1);
      }
    }
  });

  it("should return empty array for unknown language", () => {
    const patterns = getPatternsForLanguage("unknown");
    expect(patterns).toHaveLength(0);
  });
});

describe("Python Pattern Matching", () => {
  const pythonPatterns = getPatternsForLanguage("python");

  describe("LangChain", () => {
    const langchain = pythonPatterns.find((p) => p.framework === "langchain")!;

    it("should match 'from langchain' imports", () => {
      const line = "from langchain.agents import AgentExecutor";
      const matches = langchain.imports.some((p) => p.pattern.test(line));
      expect(matches).toBe(true);
    });

    it("should match langchain_openai imports", () => {
      const line = "from langchain_openai import ChatOpenAI";
      const matches = langchain.imports.some((p) => p.pattern.test(line));
      expect(matches).toBe(true);
    });

    it("should match AgentExecutor instantiation", () => {
      const line = "executor = AgentExecutor(agent=agent, tools=tools)";
      const matches = langchain.instantiations.some((p) => p.pattern.test(line));
      expect(matches).toBe(true);
    });

    it("should match create_react_agent", () => {
      const line = "agent = create_react_agent(llm, tools, prompt)";
      const matches = langchain.instantiations.some((p) => p.pattern.test(line));
      expect(matches).toBe(true);
    });

    it("should NOT match unrelated imports", () => {
      const line = "from flask import Flask";
      const matches = langchain.imports.some((p) => p.pattern.test(line));
      expect(matches).toBe(false);
    });
  });

  describe("CrewAI", () => {
    const crewai = pythonPatterns.find((p) => p.framework === "crewai")!;

    it("should match crewai imports", () => {
      const line = "from crewai import Agent, Crew, Task";
      const matches = crewai.imports.some((p) => p.pattern.test(line));
      expect(matches).toBe(true);
    });

    it("should match Crew instantiation", () => {
      const line = "crew = Crew(agents=[researcher], tasks=[task])";
      const matches = crewai.instantiations.some((p) => p.pattern.test(line));
      expect(matches).toBe(true);
    });

    it("should match @CrewBase decorator", () => {
      const line = "@CrewBase";
      const matches = crewai.instantiations.some((p) => p.pattern.test(line));
      expect(matches).toBe(true);
    });

    it("should have crewai.yaml in config files", () => {
      expect(crewai.configFiles).toContain("crewai.yaml");
    });
  });

  describe("AutoGen", () => {
    const autogen = pythonPatterns.find((p) => p.framework === "autogen")!;

    it("should match autogen imports", () => {
      const line = "from autogen import AssistantAgent, UserProxyAgent";
      const matches = autogen.imports.some((p) => p.pattern.test(line));
      expect(matches).toBe(true);
    });

    it("should match AG2 imports", () => {
      const line = "from ag2 import ConversableAgent";
      const matches = autogen.imports.some((p) => p.pattern.test(line));
      expect(matches).toBe(true);
    });

    it("should match AssistantAgent instantiation", () => {
      const line = 'assistant = AssistantAgent(name="helper")';
      const matches = autogen.instantiations.some((p) => p.pattern.test(line));
      expect(matches).toBe(true);
    });
  });

  describe("AWS Bedrock", () => {
    const bedrock = pythonPatterns.find((p) => p.framework === "aws-bedrock")!;

    it("should match bedrock-agent client creation", () => {
      const line = "client = boto3.client('bedrock-agent')";
      const matches = bedrock.imports.some((p) => p.pattern.test(line));
      expect(matches).toBe(true);
    });

    it("should match bedrock-agent-runtime", () => {
      const line = 'client = boto3.client("bedrock-agent-runtime")';
      const matches = bedrock.imports.some((p) => p.pattern.test(line));
      expect(matches).toBe(true);
    });

    it("should NOT match regular boto3 s3 client", () => {
      const line = "client = boto3.client('s3')";
      const matches = bedrock.imports.some((p) => p.pattern.test(line));
      expect(matches).toBe(false);
    });
  });
});

describe("TypeScript Pattern Matching", () => {
  const tsPatterns = getPatternsForLanguage("typescript");

  describe("LangChain.js", () => {
    const langchain = tsPatterns.find((p) => p.framework === "langchain")!;

    it("should match @langchain scoped imports", () => {
      const line = 'import { ChatOpenAI } from "@langchain/openai";';
      const matches = langchain.imports.some((p) => p.pattern.test(line));
      expect(matches).toBe(true);
    });

    it("should match langchain string imports", () => {
      const line = 'import { AgentExecutor } from "langchain/agents";';
      const matches = langchain.imports.some((p) => p.pattern.test(line));
      expect(matches).toBe(true);
    });

    it("should match new AgentExecutor", () => {
      const line = "const executor = new AgentExecutor({ agent, tools });";
      const matches = langchain.instantiations.some((p) => p.pattern.test(line));
      expect(matches).toBe(true);
    });
  });

  describe("Vercel AI SDK", () => {
    const vercel = tsPatterns.find((p) => p.framework === "vercel-ai")!;

    it('should match import from "ai"', () => {
      const line = 'import { generateText } from "ai";';
      const matches = vercel.imports.some((p) => p.pattern.test(line));
      expect(matches).toBe(true);
    });

    it("should match @ai-sdk imports", () => {
      const line = 'import { openai } from "@ai-sdk/openai";';
      const matches = vercel.imports.some((p) => p.pattern.test(line));
      expect(matches).toBe(true);
    });

    it("should match generateText call", () => {
      const line = "const result = await generateText({ model, prompt });";
      const matches = vercel.instantiations.some((p) => p.pattern.test(line));
      expect(matches).toBe(true);
    });
  });
});
