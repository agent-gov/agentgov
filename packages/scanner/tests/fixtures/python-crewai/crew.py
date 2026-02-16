from crewai import Agent, Crew, Process, Task
from crewai_tools import SerperDevTool

search_tool = SerperDevTool()

researcher = Agent(
    role="Senior Research Analyst",
    goal="Uncover cutting-edge developments in AI",
    backstory="You are an expert AI researcher.",
    tools=[search_tool],
    verbose=True,
)

writer = Agent(
    role="Tech Content Strategist",
    goal="Craft compelling content on tech advancements",
    backstory="You are a skilled tech writer.",
    verbose=True,
)

research_task = Task(
    description="Research the latest AI agent frameworks for 2026.",
    expected_output="A detailed report on AI agent frameworks.",
    agent=researcher,
)

writing_task = Task(
    description="Write a blog post about AI agent frameworks.",
    expected_output="A polished blog post.",
    agent=writer,
)

crew = Crew(
    agents=[researcher, writer],
    tasks=[research_task, writing_task],
    process=Process.sequential,
    verbose=True,
)
