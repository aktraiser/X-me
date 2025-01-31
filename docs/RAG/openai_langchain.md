
Skip to main content
This is documentation for LangChain v0.1, which is no longer actively maintained. Check out the docs for the latest version here.
🦜️🔗 LangChain
Components
Integrations
Guides
API Reference
More

v0.1

🦜️🔗

💬

    Providers
        Anthropic
        AWS
        Google
        Hugging Face
        Microsoft
        OpenAI
        More

Components

    Chat models

LLMs
Embedding models

    AI21 Labs
    Aleph Alpha
    Anyscale
    AwaDB
    Azure OpenAI
    Baichuan Text Embeddings
    Baidu Qianfan
    Bedrock
    BGE on Hugging Face
    Bookend AI
    Clarifai
    Cloudflare Workers AI
    Cohere
    DashScope
    DeepInfra
    EDEN AI
    Elasticsearch
    Embaas
    ERNIE
    Fake Embeddings
    FastEmbed by Qdrant
    FireworksEmbeddings
    GigaChat
    Google Generative AI Embeddings
    Google Vertex AI PaLM
    GPT4All
    Gradient
    Hugging Face
    IBM watsonx.ai
    Infinity
    Instruct Embeddings on Hugging Face
    Intel® Extension for Transformers Quantized Text Embeddings
    Jina
    John Snow Labs
    LASER Language-Agnostic SEntence Representations Embeddings by Meta AI
    Llama-cpp
    llamafile
    LLMRails
    LocalAI
    MiniMax
    MistralAI
    ModelScope
    MosaicML
    NVIDIA NeMo embeddings
    NLP Cloud
    Nomic
    NVIDIA AI Foundation Endpoints
    oci_generative_ai
    Ollama
    OpenClip
    OpenAI
    OpenVINO
    Embedding Documents using Optimized and Quantized Embedders
    Oracle AI Vector Search: Generate Embeddings
    PremAI
    SageMaker
    SambaNova
    Self Hosted
    Sentence Transformers on Hugging Face
    SpaCy
    SparkLLM Text Embeddings
    TensorFlow Hub
    Text Embeddings Inference
    Titan Takeoff
    Together AI
    Upstage
    Volc Engine
    Voyage AI
    Xorbits inference (Xinference)
    YandexGPT

Document loaders
Document transformers
Vector stores
Retrievers
Tools
Toolkits
Memory
Graphs
Callbacks
Chat loaders
Adapters
Stores
This is documentation for LangChain v0.1, which is no longer actively maintained.
For the current stable version, see this version (Latest).

    ComponentsEmbedding modelsOpenAI

OpenAI

Let's load the OpenAI Embedding class.
Setup

First we install langchain-openai and set the required env vars

%pip install -qU langchain-openai

import getpass
import os

os.environ["OPENAI_API_KEY"] = getpass.getpass()

from langchain_openai import OpenAIEmbeddings

API Reference:

    OpenAIEmbeddings

embeddings = OpenAIEmbeddings(model="text-embedding-3-large")

text = "This is a test document."

Usage
Embed query

query_result = embeddings.embed_query(text)

Warning: model not found. Using cl100k_base encoding.

query_result[:5]

[-0.014380056377383358,
 -0.027191711627651764,
 -0.020042716111860304,
 0.057301379620345545,
 -0.022267658631828974]

Embed documents

doc_result = embeddings.embed_documents([text])

Warning: model not found. Using cl100k_base encoding.

doc_result[0][:5]

[-0.014380056377383358,
 -0.027191711627651764,
 -0.020042716111860304,
 0.057301379620345545,
 -0.022267658631828974]

Specify dimensions

With the text-embedding-3 class of models, you can specify the size of the embeddings you want returned. For example by default text-embedding-3-large returned embeddings of dimension 3072:

len(doc_result[0])

3072

But by passing in dimensions=1024 we can reduce the size of our embeddings to 1024:

embeddings_1024 = OpenAIEmbeddings(model="text-embedding-3-large", dimensions=1024)

len(embeddings_1024.embed_documents([text])[0])

Warning: model not found. Using cl100k_base encoding.

1024

Help us out by providing feedback on this documentation page:
Previous
OpenClip
Next
OpenVINO

    Setup
    Usage
        Embed query
    Embed documents
    Specify dimensions

Community

    Discord

Twitter
GitHub

    Python

JS/TS
More

    Homepage

Blog
YouTube
Copyright © 2024 LangChain, Inc.
