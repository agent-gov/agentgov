from autogen import AssistantAgent, UserProxyAgent, ConversableAgent

assistant = AssistantAgent(
    name="assistant",
    llm_config={"model": "gpt-4o"},
)

user_proxy = UserProxyAgent(
    name="user_proxy",
    human_input_mode="NEVER",
)

result = user_proxy.initiate_chat(
    assistant,
    message="What is the weather today?",
)
