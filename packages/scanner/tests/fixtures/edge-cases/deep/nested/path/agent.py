from autogen import AssistantAgent, UserProxyAgent

assistant = AssistantAgent("deep_agent", llm_config={"model": "gpt-4o"})
proxy = UserProxyAgent("user_proxy")
