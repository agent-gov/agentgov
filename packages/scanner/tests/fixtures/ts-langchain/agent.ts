import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createReactAgent } from "langchain/agents";
import { pull } from "langchain/hub";
import { DuckDuckGoSearch } from "@langchain/community/tools/duckduckgo";

const llm = new ChatOpenAI({
  model: "gpt-4o",
  temperature: 0,
});

const tools = [new DuckDuckGoSearch()];

async function main() {
  const prompt = await pull("hwchase17/react");
  const agent = await createReactAgent({ llm, tools, prompt });
  const agentExecutor = new AgentExecutor({ agent, tools });

  const result = await agentExecutor.invoke({
    input: "What are the latest AI agent frameworks?",
  });

  console.log(result);
}

main();
