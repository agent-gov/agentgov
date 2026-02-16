import { describe, it, expect } from "vitest";
import {
  CONFIDENCE_THRESHOLDS,
  getConfidenceLabel,
  getConfidenceColor,
  summarizeEvidence,
} from "../../src/analyzers/confidence.js";
import type { DetectionEvidence } from "../../src/types/index.js";

describe("CONFIDENCE_THRESHOLDS", () => {
  it("should have REPORT threshold at 0.4", () => {
    expect(CONFIDENCE_THRESHOLDS.REPORT).toBe(0.4);
  });

  it("should have AUTO_CONFIRM threshold at 0.8", () => {
    expect(CONFIDENCE_THRESHOLDS.AUTO_CONFIRM).toBe(0.8);
  });

  it("should have thresholds in ascending order", () => {
    expect(CONFIDENCE_THRESHOLDS.LOW).toBeLessThan(CONFIDENCE_THRESHOLDS.REPORT);
    expect(CONFIDENCE_THRESHOLDS.REPORT).toBeLessThan(CONFIDENCE_THRESHOLDS.MEDIUM);
    expect(CONFIDENCE_THRESHOLDS.MEDIUM).toBeLessThan(CONFIDENCE_THRESHOLDS.HIGH);
  });
});

describe("getConfidenceLabel", () => {
  it("should return 'High' for >= 0.8", () => {
    expect(getConfidenceLabel(0.8)).toBe("High");
    expect(getConfidenceLabel(1.0)).toBe("High");
    expect(getConfidenceLabel(0.95)).toBe("High");
  });

  it("should return 'Medium' for >= 0.6 and < 0.8", () => {
    expect(getConfidenceLabel(0.6)).toBe("Medium");
    expect(getConfidenceLabel(0.7)).toBe("Medium");
    expect(getConfidenceLabel(0.79)).toBe("Medium");
  });

  it("should return 'Low' for >= 0.4 and < 0.6", () => {
    expect(getConfidenceLabel(0.4)).toBe("Low");
    expect(getConfidenceLabel(0.5)).toBe("Low");
  });

  it("should return 'Very Low' for < 0.4", () => {
    expect(getConfidenceLabel(0.3)).toBe("Very Low");
    expect(getConfidenceLabel(0.1)).toBe("Very Low");
    expect(getConfidenceLabel(0)).toBe("Very Low");
  });
});

describe("getConfidenceColor", () => {
  it("should return green for high confidence", () => {
    expect(getConfidenceColor(0.9)).toBe("green");
  });

  it("should return yellow for medium confidence", () => {
    expect(getConfidenceColor(0.7)).toBe("yellow");
  });

  it("should return red for low confidence", () => {
    expect(getConfidenceColor(0.5)).toBe("red");
  });

  it("should return dim for very low confidence", () => {
    expect(getConfidenceColor(0.2)).toBe("dim");
  });
});

describe("summarizeEvidence", () => {
  it("should summarize import evidence", () => {
    const evidence: DetectionEvidence[] = [
      {
        type: "import",
        pattern: "test",
        matchedText: "from langchain",
        filePath: "test.py",
        confidenceContribution: 0.3,
      },
    ];
    expect(summarizeEvidence(evidence)).toBe("import detected");
  });

  it("should summarize multiple evidence types", () => {
    const evidence: DetectionEvidence[] = [
      {
        type: "import",
        pattern: "test",
        matchedText: "from langchain",
        filePath: "test.py",
        confidenceContribution: 0.3,
      },
      {
        type: "instantiation",
        pattern: "test",
        matchedText: "AgentExecutor(",
        filePath: "test.py",
        confidenceContribution: 0.3,
      },
      {
        type: "dependency",
        pattern: "langchain",
        matchedText: "langchain>=0.1",
        filePath: "requirements.txt",
        confidenceContribution: 0.1,
      },
    ];
    const summary = summarizeEvidence(evidence);
    expect(summary).toContain("import detected");
    expect(summary).toContain("agent instantiation found");
    expect(summary).toContain("framework in dependencies");
  });

  it("should return empty string for no evidence", () => {
    expect(summarizeEvidence([])).toBe("");
  });
});
