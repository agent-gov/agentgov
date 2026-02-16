"""
A file that imports multiple frameworks — tests that we detect all of them
"""
from langchain.agents import AgentExecutor, create_react_agent
from crewai import Agent as CrewAgent, Crew, Task
from autogen import AssistantAgent

# LangChain agent
lc_agent = create_react_agent(llm=None, tools=[], prompt=None)
executor = AgentExecutor(agent=lc_agent, tools=[])

# CrewAI agent
crew_agent = CrewAgent(
    role="Researcher",
    goal="Research things",
    backstory="I research",
)
crew = Crew(agents=[crew_agent], tasks=[])

# AutoGen agent
ag_agent = AssistantAgent("autogen_agent", llm_config={"model": "gpt-4o"})
