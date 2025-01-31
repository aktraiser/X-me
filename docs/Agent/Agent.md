What is an agent?
In its most fundamental form, a Generative AI agent can be defined as an application that
attempts to achieve a goal by observing the world and acting upon it using the tools that it
has at its disposal. Agents are autonomous and can act independently of human intervention,
especially when provided with proper goals or objectives they are meant to achieve. Agents
can also be proactive in their approach to reaching their goals. Even in the absence of
explicit instruction sets from a human, an agent can reason about what it should do next to
achieve its ultimate goal. While the notion of agents in AI is quite general and powerful, this
whitepaper focuses on the specific types of agents that Generative AI models are capable of
building at the time of publication.
In order to understand the inner workings of an agent, let’s first introduce the foundational
components that drive the agent’s behavior, actions, and decision making. The combination
of these components can be described as a cognitive architecture, and there are many
such architectures that can be achieved by the mixing and matching of these components.
Focusing on the core functionalities, there are three essential components in an agent’s
cognitive architecture

The model
In the scope of an agent, a model refers to the language model (LM) that will be utilized as
the centralized decision maker for agent processes. The model used by an agent can be one
or multiple LM’s of any size (small / large) that are capable of following instruction based
reasoning and logic frameworks, like ReAct, Chain-of-Thought, or Tree-of-Thoughts. Models
can be general purpose, multimodal or fine-tuned based on the needs of your specific agent
architecture. For best production results, you should leverage a model that best fits your
desired end application and, ideally, has been trained on data signatures associated with the
tools that you plan to use in the cognitive architecture. It’s important to note that the model is
typically not trained with the specific configuration settings (i.e. tool choices, orchestration/
reasoning setup) of the agent. However, it’s possible to further refine the model for the
agent’s tasks by providing it with examples that showcase the agent’s capabilities, including
instances of the agent using specific tools or reasoning steps in various contexts.

The tools
Foundational models, despite their impressive text and image generation, remain constrained
by their inability to interact with the outside world. Tools bridge this gap, empowering agents
to interact with external data and services while unlocking a wider range of actions beyond
that of the underlying model alone. Tools can take a variety of forms and have varying
depths of complexity, but typically align with common web API methods like GET, POST,
PATCH, and DELETE. For example, a tool could update customer information in a database
or fetch weather data to influence a travel recommendation that the agent is providing to
the user. With tools, agents can access and process real-world information. This empowers
them to support more specialized systems like retrieval augmented generation (RAG),
which significantly extends an agent’s capabilities beyond what the foundational model can
achieve on its own. We’ll discuss tools in more detail below, but the most important thing
to understand is that tools bridge the gap between the agent’s internal capabilities and the
external world, unlocking a broader range of possibilities.

The orchestration layer
The orchestration layer describes a cyclical process that governs how the agent takes in
information, performs some internal reasoning, and uses that reasoning to inform its next
action or decision. In general, this loop will continue until an agent has reached its goal or a
stopping point. The complexity of the orchestration layer can vary greatly depending on the
agent and task it’s performing. Some loops can be simple calculations with decision rules,
while others may contain chained logic, involve additional machine learning algorithms, or
implement other probabilistic reasoning techniques. We’ll discuss more about the detailed
implementation of the agent orchestration layers in the cognitive architecture section.

Tools: Our keys to the outside world
While language models excel at processing information, they lack the ability to directly
perceive and influence the real world. This limits their usefulness in situations requiring
interaction with external systems or data. This means that, in a sense, a language model
is only as good as what it has learned from its training data. But regardless of how much
data we throw at a model, they still lack the fundamental ability to interact with the outside
world. So how can we empower our models to have real-time, context-aware interaction with
external systems? Functions, Extensions, Data Stores and Plugins are all ways to provide this
critical capability to the model.
While they go by many names, tools are what create a link between our foundational models
and the outside world. This link to external systems and data allows our agent to perform a
wider variety of tasks and do so with more accuracy and reliability. For instance, tools can
enable agents to adjust smart home settings, update calendars, fetch user information from
a database, or send emails based on a specific set of instructions.
As of the date of this publication, there are three primary tool types that Google models are
able to interact with: Extensions, Functions, and Data Stores. By equipping agents with tools,
we unlock a vast potential for them to not only understand the world but also act upon it,
opening doors to a myriad of new applications and possibilities.
