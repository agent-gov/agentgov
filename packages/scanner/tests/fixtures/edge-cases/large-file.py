# This file is intentionally NOT large — the test will check scanner behavior
# with the MAX_FILE_SIZE constant. We test the skip logic, not actual large files.
from langchain import agent
x = agent.run("test")
