
Skip to main content
🦜🔗 LangChain documentation - Home

    Reference

⌘
+
K
Docs

GitHub

    X / Twitter

Section Navigation

Base packages

    Core
    Langchain
    Text Splitters
    Community

    adapters
    agent_toolkits
    agents
    cache
    callbacks
    chains
    chat_loaders
    chat_message_histories
    chat_models
    cross_encoders
    docstore
    document_compressors
    document_loaders
    document_transformers
    embeddings
    example_selectors
    graph_vectorstores
    graphs
    indexes
    llms
    memory
    output_parsers
    query_constructors
    retrievers
    storage
    tools
    utilities
    utils
    vectorstores

            Aerospike
            AlibabaCloudOpenSearch
            AlibabaCloudOpenSearchSettings
            AnalyticDB
            Annoy
            ApacheDoris
            ApacheDorisSettings
            ApertureDB
            AtlasDB
            AwaDB
            AzureCosmosDBVectorSearch
            CosmosDBSimilarityType
            CosmosDBVectorSearchType
            AzureCosmosDBNoSqlVectorSearch
            Condition
            CosmosDBQueryType
            PreFilter
            AzureSearch
            AzureSearchVectorStoreRetriever
            Bagel
            BESVectorStore
            BaiduVectorDB
            ConnectionParams
            TableParams
            Cassandra
            Clarifai
            Clickhouse
            ClickhouseSettings
            DashVector
            DeepLake
            Dingo
            DocArrayIndex
            DocArrayHnswSearch
            DocArrayInMemorySearch
            DocumentDBSimilarityType
            DocumentDBVectorSearch
            DuckDB
            EcloudESVectorStore
            BaseRetrievalStrategy
            Epsilla
            FAISS
            FalkorDBVector
            IndexType
            SearchType
            HanaDB
            Hippo
            Hologres
            Infinispan
            InfinispanVS
            Jaguar
            KDBAI
            Dimension
            DistanceStrategy
            Kinetica
            KineticaSettings
            LanceDB
            BaseEmbeddingStore
            DistanceStrategy
            Lantern
            QueryResult
            LLMRails
            LLMRailsRetriever
            ManticoreSearch
            ManticoreSearchSettings
            Marqo
            Meilisearch
            MomentoVectorIndex
            MyScale
            MyScaleSettings
            MyScaleWithoutJSON
            NucliaDB
            OpenSearchVectorSearch
            OracleVS
            PathwayVectorClient
            BaseModel
            CollectionStore
            EmbeddingStore
            PGEmbedding
            QueryResult
            PGVecto_rs
            BaseModel
            DistanceStrategy
            QdrantException
            RedisVectorStoreRetriever
            RedisFilter
            RedisFilterExpression
            RedisFilterField
            RedisFilterOperator
            RedisNum
            RedisTag
            RedisText
            FlatVectorField
            HNSWVectorField
            NumericFieldSchema
            RedisDistanceMetric
            RedisField
            RedisModel
            RedisVectorField
            TagFieldSchema
            TextFieldSchema
            Relyt
            Rockset
            ScaNN
            SemaDB
            SingleStoreDB
            BaseSerializer
            BsonSerializer
            JsonSerializer
            ParquetSerializer
            SKLearnVectorStore
            SKLearnVectorStoreException
            SQLiteVec
            SQLiteVSS
            StarRocks
            StarRocksSettings
            SupabaseVectorStore
            SurrealDBStore
            TablestoreVectorStore
            Tair
            ConnectionParams
            IndexParams
            MetaField
            TencentVectorDB
            NeuralDBClientVectorStore
            NeuralDBVectorStore
            TiDBVectorStore
            Tigris
            TileDB
            TimescaleVector
            Typesense
            UpstashVectorStore
            USearch
            DistanceStrategy
            Vald
            VDMS
            Vearch
            MMRConfig
            RerankConfig
            SummaryConfig
            Vectara
            VectaraQueryConfig
            VectaraRAG
            VectaraRetriever
            VespaStore
            VikingDB
            VikingDBConfig
            VLite
            Weaviate
            XataVectorStore
            Yellowbrick
            CollectionConfig
            ZepVectorStore
            ZepCloudVectorStore
            Zilliz
            create_metadata
            dependable_annoy_import
            has_mul_sub_str
            dependable_faiss_import
            construct_metadata_filter
            dict_to_yaml_str
            generate_random_string
            process_index_data
            import_lancedb
            to_lance_filter
            get_embedding_store
            has_mul_sub_str
            create_index
            drop_index_if_exists
            drop_table_purge
            sync_call_fallback
            check_index_exists
            check_operator_misuse
            read_schema
            dependable_scann_import
            normalize
            serialize_f32
            debug_output
            get_named_result
            has_mul_sub_str
            translate_filter
            dependable_tiledb_import
            get_documents_array_uri
            get_documents_array_uri_from_group
            get_vector_index_uri
            get_vector_index_uri_from_group
            dependable_usearch_import
            filter_complex_metadata
            maximal_marginal_relevance
            VDMS_Client
            embedding2bytes
            AstraDB
            BigQueryVectorSearch
            Chroma
            CouchbaseVectorStore
            DatabricksVectorSearch
            ElasticKnnSearch
            ElasticVectorSearch
            ApproxRetrievalStrategy
            ElasticsearchStore
            ExactRetrievalStrategy
            SparseRetrievalStrategy
            MatchingEngine
            Milvus
            MongoDBAtlasVectorSearch
            IndexType
            Neo4jVector
            SearchType
            PGVector
            Pinecone
            Qdrant
            Redis
            check_if_not_null
            collect_params
            combine_queries
            construct_metadata_filter
            dict_to_yaml_str
            remove_lucene_chars
            sort_by_index_name
    Experimental

Integrations

    AI21
    Anthropic
    AstraDB
    AWS
    Azure Dynamic Sessions
    Box
    Cerebras
    Chroma
    Cohere
    Couchbase
    Databricks
    Elasticsearch
    Exa
    Fireworks
    Google Community
    Google GenAI
    Google VertexAI
    Groq
    Huggingface
    IBM
    Milvus
    MistralAI
    Neo4J
    Nomic
    Nvidia Ai Endpoints
    Ollama
    OpenAI
    Pinecone
    Postgres
    Prompty
    Qdrant
    Redis
    Sema4
    Snowflake
    Sqlserver
    Standard Tests
    Together
    Unstructured
    Upstage
    VoyageAI
    Weaviate
    XAI

    LangChain Python API Reference
    langchain-community: 0.3.13
    vectorstores
    Chroma

Chroma
class langchain_community.vectorstores.chroma.Chroma(collection_name: str = 'langchain', embedding_function: Embeddings | None = None, persist_directory: str | None = None, client_settings: chromadb.config.Settings | None = None, collection_metadata: Dict | None = None, client: chromadb.Client | None = None, relevance_score_fn: Callable[[float], float] | None = None)
[source]

Deprecated since version 0.2.9: Use :class:`~langchain_chroma.Chroma` instead. It will be removed in None==1.0.

ChromaDB vector store.

To use, you should have the chromadb python package installed.

Example

from langchain_community.vectorstores import Chroma
from langchain_community.embeddings.openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings()
vectorstore = Chroma("langchain_store", embeddings)

Initialize with a Chroma client.

Attributes

embeddings
	

Access the query embedding object if available.

Methods

__init__([collection_name, ...])
	

Initialize with a Chroma client.

aadd_documents(documents, **kwargs)
	

Async run more documents through the embeddings and add to the vectorstore.

aadd_texts(texts[, metadatas, ids])
	

Async run more texts through the embeddings and add to the vectorstore.

add_documents(documents, **kwargs)
	

Add or update documents in the vectorstore.

add_images(uris[, metadatas, ids])
	

Run more images through the embeddings and add to the vectorstore.

add_texts(texts[, metadatas, ids])
	

Run more texts through the embeddings and add to the vectorstore.

adelete([ids])
	

Async delete by vector ID or other criteria.

afrom_documents(documents, embedding, **kwargs)
	

Async return VectorStore initialized from documents and embeddings.

afrom_texts(texts, embedding[, metadatas, ids])
	

Async return VectorStore initialized from texts and embeddings.

aget_by_ids(ids, /)
	

Async get documents by their IDs.

amax_marginal_relevance_search(query[, k, ...])
	

Async return docs selected using the maximal marginal relevance.

amax_marginal_relevance_search_by_vector(...)
	

Async return docs selected using the maximal marginal relevance.

as_retriever(**kwargs)
	

Return VectorStoreRetriever initialized from this VectorStore.

asearch(query, search_type, **kwargs)
	

Async return docs most similar to query using a specified search type.

asimilarity_search(query[, k])
	

Async return docs most similar to query.

asimilarity_search_by_vector(embedding[, k])
	

Async return docs most similar to embedding vector.

asimilarity_search_with_relevance_scores(query)
	

Async return docs and relevance scores in the range [0, 1].

asimilarity_search_with_score(*args, **kwargs)
	

Async run similarity search with distance.

delete([ids])
	

Delete by vector IDs.

delete_collection()
	

Delete the collection.

encode_image(uri)
	

Get base64 string from image URI.

from_documents(documents[, embedding, ids, ...])
	

Create a Chroma vectorstore from a list of documents.

from_texts(texts[, embedding, metadatas, ...])
	

Create a Chroma vectorstore from a raw documents.

get([ids, where, limit, offset, ...])
	

Gets the collection.

get_by_ids(ids, /)
	

Get documents by their IDs.

max_marginal_relevance_search(query[, k, ...])
	

Return docs selected using the maximal marginal relevance.

max_marginal_relevance_search_by_vector(...)
	

Return docs selected using the maximal marginal relevance.

persist()
	

search(query, search_type, **kwargs)
	

Return docs most similar to query using a specified search type.

similarity_search(query[, k, filter])
	

Run similarity search with Chroma.

similarity_search_by_image(uri[, k, filter])
	

Search for similar images based on the given image URI.

similarity_search_by_image_with_relevance_score(uri)
	

Search for similar images based on the given image URI.

similarity_search_by_vector(embedding[, k, ...])
	

Return docs most similar to embedding vector.

similarity_search_by_vector_with_relevance_scores(...)
	

Return docs most similar to embedding vector and similarity score.

similarity_search_with_relevance_scores(query)
	

Return docs and relevance scores in the range [0, 1].

similarity_search_with_score(query[, k, ...])
	

Run similarity search with Chroma with distance.

update_document(document_id, document)
	

Update a document in the collection.

update_documents(ids, documents)
	

Update a document in the collection.

Parameters:

        collection_name (str)

        embedding_function (Optional[Embeddings])

        persist_directory (Optional[str])

        client_settings (Optional[chromadb.config.Settings])

        collection_metadata (Optional[Dict])

        client (Optional[chromadb.Client])

        relevance_score_fn (Optional[Callable[[float], float]])

__init__(collection_name: str = 'langchain', embedding_function: Embeddings | None = None, persist_directory: str | None = None, client_settings: chromadb.config.Settings | None = None, collection_metadata: Dict | None = None, client: chromadb.Client | None = None, relevance_score_fn: Callable[[float], float] | None = None) → None
[source]

    Initialize with a Chroma client.

    Parameters:

            collection_name (str)

            embedding_function (Optional[Embeddings])

            persist_directory (Optional[str])

            client_settings (Optional[chromadb.config.Settings])

            collection_metadata (Optional[Dict])

            client (Optional[chromadb.Client])

            relevance_score_fn (Optional[Callable[[float], float]])

    Return type:

        None

async aadd_documents(documents: list[Document], **kwargs: Any) → list[str]

    Async run more documents through the embeddings and add to the vectorstore.

    Parameters:

            documents (list[Document]) – Documents to add to the vectorstore.

            kwargs (Any) – Additional keyword arguments.

    Returns:

        List of IDs of the added texts.
    Raises:

        ValueError – If the number of IDs does not match the number of documents.
    Return type:

        list[str]

async aadd_texts(texts: Iterable[str], metadatas: list[dict] | None = None, *, ids: list[str] | None = None, **kwargs: Any) → list[str]

    Async run more texts through the embeddings and add to the vectorstore.

    Parameters:

            texts (Iterable[str]) – Iterable of strings to add to the vectorstore.

            metadatas (list[dict] | None) – Optional list of metadatas associated with the texts. Default is None.

            ids (list[str] | None) – Optional list

            **kwargs (Any) – vectorstore specific parameters.

    Returns:

        List of ids from adding the texts into the vectorstore.
    Raises:

            ValueError – If the number of metadatas does not match the number of texts.

            ValueError – If the number of ids does not match the number of texts.

    Return type:

        list[str]

add_documents(documents: list[Document], **kwargs: Any) → list[str]

    Add or update documents in the vectorstore.

    Parameters:

            documents (list[Document]) – Documents to add to the vectorstore.

            kwargs (Any) – Additional keyword arguments. if kwargs contains ids and documents contain ids, the ids in the kwargs will receive precedence.

    Returns:

        List of IDs of the added texts.
    Raises:

        ValueError – If the number of ids does not match the number of documents.
    Return type:

        list[str]

add_images(uris: List[str], metadatas: List[dict] | None = None, ids: List[str] | None = None, **kwargs: Any) → List[str]
[source]

    Run more images through the embeddings and add to the vectorstore.

    Parameters:

            List[str] (uris) – File path to the image.

            metadatas (Optional[List[dict]], optional) – Optional list of metadatas.

            ids (Optional[List[str]], optional) – Optional list of IDs.

            uris (List[str])

            kwargs (Any)

    Returns:

        List of IDs of the added images.
    Return type:

        List[str]

add_texts(texts: Iterable[str], metadatas: List[dict] | None = None, ids: List[str] | None = None, **kwargs: Any) → List[str]
[source]

    Run more texts through the embeddings and add to the vectorstore.

    Parameters:

            texts (Iterable[str]) – Texts to add to the vectorstore.

            metadatas (Optional[List[dict]], optional) – Optional list of metadatas.

            ids (Optional[List[str]], optional) – Optional list of IDs.

            kwargs (Any)

    Returns:

        List of IDs of the added texts.
    Return type:

        List[str]

async adelete(ids: list[str] | None = None, **kwargs: Any) → bool | None

    Async delete by vector ID or other criteria.

    Parameters:

            ids (list[str] | None) – List of ids to delete. If None, delete all. Default is None.

            **kwargs (Any) – Other keyword arguments that subclasses might use.

    Returns:

        True if deletion is successful, False otherwise, None if not implemented.
    Return type:

        Optional[bool]

async classmethod afrom_documents(documents: list[Document], embedding: Embeddings, **kwargs: Any) → VST

    Async return VectorStore initialized from documents and embeddings.

    Parameters:

            documents (list[Document]) – List of Documents to add to the vectorstore.

            embedding (Embeddings) – Embedding function to use.

            kwargs (Any) – Additional keyword arguments.

    Returns:

        VectorStore initialized from documents and embeddings.
    Return type:

        VectorStore

async classmethod afrom_texts(texts: list[str], embedding: Embeddings, metadatas: list[dict] | None = None, *, ids: list[str] | None = None, **kwargs: Any) → VST

    Async return VectorStore initialized from texts and embeddings.

    Parameters:

            texts (list[str]) – Texts to add to the vectorstore.

            embedding (Embeddings) – Embedding function to use.

            metadatas (list[dict] | None) – Optional list of metadatas associated with the texts. Default is None.

            ids (list[str] | None) – Optional list of IDs associated with the texts.

            kwargs (Any) – Additional keyword arguments.

    Returns:

        VectorStore initialized from texts and embeddings.
    Return type:

        VectorStore

async aget_by_ids(ids: Sequence[str], /) → list[Document]

    Async get documents by their IDs.

    The returned documents are expected to have the ID field set to the ID of the document in the vector store.

    Fewer documents may be returned than requested if some IDs are not found or if there are duplicated IDs.

    Users should not assume that the order of the returned documents matches the order of the input IDs. Instead, users should rely on the ID field of the returned documents.

    This method should NOT raise exceptions if no documents are found for some IDs.

    Parameters:

        ids (Sequence[str]) – List of ids to retrieve.
    Returns:

        List of Documents.
    Return type:

        list[Document]

    Added in version 0.2.11.

async amax_marginal_relevance_search(query: str, k: int = 4, fetch_k: int = 20, lambda_mult: float = 0.5, **kwargs: Any) → list[Document]

    Async return docs selected using the maximal marginal relevance.

    Maximal marginal relevance optimizes for similarity to query AND diversity among selected documents.

    Parameters:

            query (str) – Text to look up documents similar to.

            k (int) – Number of Documents to return. Defaults to 4.

            fetch_k (int) – Number of Documents to fetch to pass to MMR algorithm. Default is 20.

            lambda_mult (float) – Number between 0 and 1 that determines the degree of diversity among the results with 0 corresponding to maximum diversity and 1 to minimum diversity. Defaults to 0.5.

            kwargs (Any)

    Returns:

        List of Documents selected by maximal marginal relevance.
    Return type:

        list[Document]

async amax_marginal_relevance_search_by_vector(embedding: list[float], k: int = 4, fetch_k: int = 20, lambda_mult: float = 0.5, **kwargs: Any) → list[Document]

    Async return docs selected using the maximal marginal relevance.

    Maximal marginal relevance optimizes for similarity to query AND diversity among selected documents.

    Parameters:

            embedding (list[float]) – Embedding to look up documents similar to.

            k (int) – Number of Documents to return. Defaults to 4.

            fetch_k (int) – Number of Documents to fetch to pass to MMR algorithm. Default is 20.

            lambda_mult (float) – Number between 0 and 1 that determines the degree of diversity among the results with 0 corresponding to maximum diversity and 1 to minimum diversity. Defaults to 0.5.

            **kwargs (Any) – Arguments to pass to the search method.

    Returns:

        List of Documents selected by maximal marginal relevance.
    Return type:

        list[Document]

as_retriever(**kwargs: Any) → VectorStoreRetriever

Return VectorStoreRetriever initialized from this VectorStore.

Parameters:

    **kwargs (Any) –

    Keyword arguments to pass to the search function. Can include: search_type (Optional[str]): Defines the type of search that

        the Retriever should perform. Can be “similarity” (default), “mmr”, or “similarity_score_threshold”.

    search_kwargs (Optional[Dict]): Keyword arguments to pass to the

        search function. Can include things like:

            k: Amount of documents to return (Default: 4) score_threshold: Minimum relevance threshold

                for similarity_score_threshold

            fetch_k: Amount of documents to pass to MMR algorithm

                (Default: 20)
            lambda_mult: Diversity of results returned by MMR;

                1 for minimum diversity and 0 for maximum. (Default: 0.5)

            filter: Filter by document metadata

Returns:

    Retriever class for VectorStore.
Return type:

    VectorStoreRetriever

Examples:

# Retrieve more documents with higher diversity
# Useful if your dataset has many similar documents
docsearch.as_retriever(
    search_type="mmr",
    search_kwargs={'k': 6, 'lambda_mult': 0.25}
)

# Fetch more documents for the MMR algorithm to consider
# But only return the top 5
docsearch.as_retriever(
    search_type="mmr",
    search_kwargs={'k': 5, 'fetch_k': 50}
)

# Only retrieve documents that have a relevance score
# Above a certain threshold
docsearch.as_retriever(
    search_type="similarity_score_threshold",
    search_kwargs={'score_threshold': 0.8}
)

# Only get the single most similar document from the dataset
docsearch.as_retriever(search_kwargs={'k': 1})

# Use a filter to only retrieve documents from a specific paper
docsearch.as_retriever(
    search_kwargs={'filter': {'paper_title':'GPT-4 Technical Report'}}
)

async asearch(query: str, search_type: str, **kwargs: Any) → list[Document]

    Async return docs most similar to query using a specified search type.

    Parameters:

            query (str) – Input text.

            search_type (str) – Type of search to perform. Can be “similarity”, “mmr”, or “similarity_score_threshold”.

            **kwargs (Any) – Arguments to pass to the search method.

    Returns:

        List of Documents most similar to the query.
    Raises:

        ValueError – If search_type is not one of “similarity”, “mmr”, or “similarity_score_threshold”.
    Return type:

        list[Document]

async asimilarity_search(query: str, k: int = 4, **kwargs: Any) → list[Document]

    Async return docs most similar to query.

    Parameters:

            query (str) – Input text.

            k (int) – Number of Documents to return. Defaults to 4.

            **kwargs (Any) – Arguments to pass to the search method.

    Returns:

        List of Documents most similar to the query.
    Return type:

        list[Document]

async asimilarity_search_by_vector(embedding: list[float], k: int = 4, **kwargs: Any) → list[Document]

    Async return docs most similar to embedding vector.

    Parameters:

            embedding (list[float]) – Embedding to look up documents similar to.

            k (int) – Number of Documents to return. Defaults to 4.

            **kwargs (Any) – Arguments to pass to the search method.

    Returns:

        List of Documents most similar to the query vector.
    Return type:

        list[Document]

async asimilarity_search_with_relevance_scores(query: str, k: int = 4, **kwargs: Any) → list[tuple[Document, float]]

    Async return docs and relevance scores in the range [0, 1].

    0 is dissimilar, 1 is most similar.

    Parameters:

            query (str) – Input text.

            k (int) – Number of Documents to return. Defaults to 4.

            **kwargs (Any) –

            kwargs to be passed to similarity search. Should include: score_threshold: Optional, a floating point value between 0 to 1 to

                filter the resulting set of retrieved docs

    Returns:

        List of Tuples of (doc, similarity_score)
    Return type:

        list[tuple[Document, float]]

async asimilarity_search_with_score(*args: Any, **kwargs: Any) → list[tuple[Document, float]]

    Async run similarity search with distance.

    Parameters:

            *args (Any) – Arguments to pass to the search method.

            **kwargs (Any) – Arguments to pass to the search method.

    Returns:

        List of Tuples of (doc, similarity_score).
    Return type:

        list[tuple[Document, float]]

delete(ids: List[str] | None = None, **kwargs: Any) → None
[source]

    Delete by vector IDs.

    Parameters:

            ids (List[str] | None) – List of ids to delete.

            kwargs (Any)

    Return type:

        None

delete_collection() → None
[source]

    Delete the collection.

    Return type:

        None

encode_image(uri: str) → str
[source]

    Get base64 string from image URI.

    Parameters:

        uri (str)
    Return type:

        str

classmethod from_documents(documents: List[Document], embedding: Embeddings | None = None, ids: List[str] | None = None, collection_name: str = 'langchain', persist_directory: str | None = None, client_settings: chromadb.config.Settings | None = None, client: chromadb.Client | None = None, collection_metadata: Dict | None = None, **kwargs: Any) → Chroma
[source]

    Create a Chroma vectorstore from a list of documents.

    If a persist_directory is specified, the collection will be persisted there. Otherwise, the data will be ephemeral in-memory.

    Parameters:

            collection_name (str) – Name of the collection to create.

            persist_directory (Optional[str]) – Directory to persist the collection.

            ids (Optional[List[str]]) – List of document IDs. Defaults to None.

            documents (List[Document]) – List of documents to add to the vectorstore.

            embedding (Optional[Embeddings]) – Embedding function. Defaults to None.

            client_settings (Optional[chromadb.config.Settings]) – Chroma client settings

            collection_metadata (Optional[Dict]) – Collection configurations. Defaults to None.

            client (Optional[chromadb.Client])

            kwargs (Any)

    Returns:

        Chroma vectorstore.
    Return type:

        Chroma

classmethod from_texts(texts: List[str], embedding: Embeddings | None = None, metadatas: List[dict] | None = None, ids: List[str] | None = None, collection_name: str = 'langchain', persist_directory: str | None = None, client_settings: chromadb.config.Settings | None = None, client: chromadb.Client | None = None, collection_metadata: Dict | None = None, **kwargs: Any) → Chroma
[source]

    Create a Chroma vectorstore from a raw documents.

    If a persist_directory is specified, the collection will be persisted there. Otherwise, the data will be ephemeral in-memory.

    Parameters:

            texts (List[str]) – List of texts to add to the collection.

            collection_name (str) – Name of the collection to create.

            persist_directory (Optional[str]) – Directory to persist the collection.

            embedding (Optional[Embeddings]) – Embedding function. Defaults to None.

            metadatas (Optional[List[dict]]) – List of metadatas. Defaults to None.

            ids (Optional[List[str]]) – List of document IDs. Defaults to None.

            client_settings (Optional[chromadb.config.Settings]) – Chroma client settings

            collection_metadata (Optional[Dict]) – Collection configurations. Defaults to None.

            client (Optional[chromadb.Client])

            kwargs (Any)

    Returns:

        Chroma vectorstore.
    Return type:

        Chroma

get(ids: OneOrMany[ID] | None = None, where: Where | None = None, limit: int | None = None, offset: int | None = None, where_document: WhereDocument | None = None, include: List[str] | None = None) → Dict[str, Any]
[source]

    Gets the collection.

    Parameters:

            ids (Optional[OneOrMany[ID]]) – The ids of the embeddings to get. Optional.

            where (Optional[Where]) – A Where type dict used to filter results by. E.g. {“color” : “red”, “price”: 4.20}. Optional.

            limit (Optional[int]) – The number of documents to return. Optional.

            offset (Optional[int]) – The offset to start returning results from. Useful for paging results with limit. Optional.

            where_document (Optional[WhereDocument]) – A WhereDocument type dict used to filter by the documents. E.g. {$contains: “hello”}. Optional.

            include (Optional[List[str]]) – A list of what to include in the results. Can contain “embeddings”, “metadatas”, “documents”. Ids are always included. Defaults to [“metadatas”, “documents”]. Optional.

    Return type:

        Dict[str, Any]

get_by_ids(ids: Sequence[str], /) → list[Document]

    Get documents by their IDs.

    The returned documents are expected to have the ID field set to the ID of the document in the vector store.

    Fewer documents may be returned than requested if some IDs are not found or if there are duplicated IDs.

    Users should not assume that the order of the returned documents matches the order of the input IDs. Instead, users should rely on the ID field of the returned documents.

    This method should NOT raise exceptions if no documents are found for some IDs.

    Parameters:

        ids (Sequence[str]) – List of ids to retrieve.
    Returns:

        List of Documents.
    Return type:

        list[Document]

    Added in version 0.2.11.

max_marginal_relevance_search(query: str, k: int = 4, fetch_k: int = 20, lambda_mult: float = 0.5, filter: Dict[str, str] | None = None, where_document: Dict[str, str] | None = None, **kwargs: Any) → List[Document]
[source]

    Return docs selected using the maximal marginal relevance. Maximal marginal relevance optimizes for similarity to query AND diversity among selected documents.

    Parameters:

            query (str) – Text to look up documents similar to.

            k (int) – Number of Documents to return. Defaults to 4.

            fetch_k (int) – Number of Documents to fetch to pass to MMR algorithm.

            lambda_mult (float) – Number between 0 and 1 that determines the degree of diversity among the results with 0 corresponding to maximum diversity and 1 to minimum diversity. Defaults to 0.5.

            filter (Optional[Dict[str, str]]) – Filter by metadata. Defaults to None.

            where_document (Dict[str, str] | None)

            kwargs (Any)

    Returns:

        List of Documents selected by maximal marginal relevance.
    Return type:

        List[Document]

max_marginal_relevance_search_by_vector(embedding: List[float], k: int = 4, fetch_k: int = 20, lambda_mult: float = 0.5, filter: Dict[str, str] | None = None, where_document: Dict[str, str] | None = None, **kwargs: Any) → List[Document]
[source]

    Return docs selected using the maximal marginal relevance. Maximal marginal relevance optimizes for similarity to query AND diversity among selected documents.

    Parameters:

            embedding (List[float]) – Embedding to look up documents similar to.

            k (int) – Number of Documents to return. Defaults to 4.

            fetch_k (int) – Number of Documents to fetch to pass to MMR algorithm.

            lambda_mult (float) – Number between 0 and 1 that determines the degree of diversity among the results with 0 corresponding to maximum diversity and 1 to minimum diversity. Defaults to 0.5.

            filter (Optional[Dict[str, str]]) – Filter by metadata. Defaults to None.

            where_document (Dict[str, str] | None)

            kwargs (Any)

    Returns:

        List of Documents selected by maximal marginal relevance.
    Return type:

        List[Document]

persist() → None
[source]

    Deprecated since version langchain-community==0.1.17: Since Chroma 0.4.x the manual persistence method is no longer supported as docs are automatically persisted. It will not be removed until langchain-community==1.0.

    Persist the collection.

    This can be used to explicitly persist the data to disk. It will also be called automatically when the object is destroyed.

    Since Chroma 0.4.x the manual persistence method is no longer supported as docs are automatically persisted.

    Return type:

        None

search(query: str, search_type: str, **kwargs: Any) → list[Document]

    Return docs most similar to query using a specified search type.

    Parameters:

            query (str) – Input text

            search_type (str) – Type of search to perform. Can be “similarity”, “mmr”, or “similarity_score_threshold”.

            **kwargs (Any) – Arguments to pass to the search method.

    Returns:

        List of Documents most similar to the query.
    Raises:

        ValueError – If search_type is not one of “similarity”, “mmr”, or “similarity_score_threshold”.
    Return type:

        list[Document]

similarity_search(query: str, k: int = 4, filter: Dict[str, str] | None = None, **kwargs: Any) → List[Document]
[source]

    Run similarity search with Chroma.

    Parameters:

            query (str) – Query text to search for.

            k (int) – Number of results to return. Defaults to 4.

            filter (Optional[Dict[str, str]]) – Filter by metadata. Defaults to None.

            kwargs (Any)

    Returns:

        List of documents most similar to the query text.
    Return type:

        List[Document]

similarity_search_by_image(uri: str, k: int = 4, filter: Dict[str, str] | None = None, **kwargs: Any) → List[Document]
[source]

    Search for similar images based on the given image URI.

    Parameters:

            uri (str) – URI of the image to search for.

            k (int, optional) – Number of results to return. Defaults to DEFAULT_K.

            filter (Optional[Dict[str, str]], optional) – Filter by metadata.

            **kwargs (Any) – Additional arguments to pass to function.

    Returns:

        List of Images most similar to the provided image. Each element in list is a Langchain Document Object. The page content is b64 encoded image, metadata is default or as defined by user.
    Raises:

        ValueError – If the embedding function does not support image embeddings.
    Return type:

        List[Document]

similarity_search_by_image_with_relevance_score(uri: str, k: int = 4, filter: Dict[str, str] | None = None, **kwargs: Any) → List[Tuple[Document, float]]
[source]

    Search for similar images based on the given image URI.

    Parameters:

            uri (str) – URI of the image to search for.

            k (int, optional) – Number of results to return.

            DEFAULT_K. (Defaults to)

            filter (Optional[Dict[str, str]], optional) – Filter by metadata.

            **kwargs (Any) – Additional arguments to pass to function.

    Returns:

        List of tuples containing documents similar to the query image and their similarity scores. 0th element in each tuple is a Langchain Document Object. The page content is b64 encoded img, metadata is default or defined by user.
    Return type:

        List[Tuple[Document, float]]
    Raises:

        ValueError – If the embedding function does not support image embeddings.

similarity_search_by_vector(embedding: List[float], k: int = 4, filter: Dict[str, str] | None = None, where_document: Dict[str, str] | None = None, **kwargs: Any) → List[Document]
[source]

    Return docs most similar to embedding vector. :param embedding: Embedding to look up documents similar to. :type embedding: List[float] :param k: Number of Documents to return. Defaults to 4. :type k: int :param filter: Filter by metadata. Defaults to None. :type filter: Optional[Dict[str, str]]

    Returns:

        List of Documents most similar to the query vector.
    Parameters:

            embedding (List[float])

            k (int)

            filter (Dict[str, str] | None)

            where_document (Dict[str, str] | None)

            kwargs (Any)

    Return type:

        List[Document]

similarity_search_by_vector_with_relevance_scores(embedding: List[float], k: int = 4, filter: Dict[str, str] | None = None, where_document: Dict[str, str] | None = None, **kwargs: Any) → List[Tuple[Document, float]]
[source]

    Return docs most similar to embedding vector and similarity score.

    Parameters:

            embedding (List[float]) – Embedding to look up documents similar to.

            k (int) – Number of Documents to return. Defaults to 4.

            filter (Optional[Dict[str, str]]) – Filter by metadata. Defaults to None.

            where_document (Dict[str, str] | None)

            kwargs (Any)

    Returns:

        List of documents most similar to the query text and cosine distance in float for each. Lower score represents more similarity.
    Return type:

        List[Tuple[Document, float]]

similarity_search_with_relevance_scores(query: str, k: int = 4, **kwargs: Any) → list[tuple[Document, float]]

    Return docs and relevance scores in the range [0, 1].

    0 is dissimilar, 1 is most similar.

    Parameters:

            query (str) – Input text.

            k (int) – Number of Documents to return. Defaults to 4.

            **kwargs (Any) –

            kwargs to be passed to similarity search. Should include: score_threshold: Optional, a floating point value between 0 to 1 to

                filter the resulting set of retrieved docs.

    Returns:

        List of Tuples of (doc, similarity_score).
    Return type:

        list[tuple[Document, float]]

similarity_search_with_score(query: str, k: int = 4, filter: Dict[str, str] | None = None, where_document: Dict[str, str] | None = None, **kwargs: Any) → List[Tuple[Document, float]]
[source]

    Run similarity search with Chroma with distance.

    Parameters:

            query (str) – Query text to search for.

            k (int) – Number of results to return. Defaults to 4.

            filter (Optional[Dict[str, str]]) – Filter by metadata. Defaults to None.

            where_document (Dict[str, str] | None)

            kwargs (Any)

    Returns:

        List of documents most similar to the query text and cosine distance in float for each. Lower score represents more similarity.
    Return type:

        List[Tuple[Document, float]]

update_document(document_id: str, document: Document) → None
[source]

    Update a document in the collection.

    Parameters:

            document_id (str) – ID of the document to update.

            document (Document) – Document to update.

    Return type:

        None

update_documents(ids: List[str], documents: List[Document]) → None
[source]

        Update a document in the collection.

        Parameters:

                ids (List[str]) – List of ids of the document to update.

                documents (List[Document]) – List of documents to update.

        Return type:

            None

Examples using Chroma

    Build a Local RAG Application

    Build a PDF ingestion and Question/Answering system

    Build a Query Analysis System

    Build a Retrieval Augmented Generation (RAG) App

    Chroma

    Confident

    Conversational RAG

    Docugami

    Google Cloud Vertex AI Reranker

    How deal with high cardinality categoricals when doing query analysis

    How to add chat history

    How to add retrieval to chatbots

    How to create and query vector stores

    How to do “self-querying” retrieval

    How to get your RAG application to return sources

    How to handle cases where no queries are generated

    How to handle multiple queries when doing query analysis

    How to handle multiple retrievers when doing query analysis

    How to reorder retrieved results to mitigate the “lost in the middle” effect

    How to retrieve using multiple vectors per document

    How to select examples by similarity

    How to stream results from your RAG application

    How to use few shot examples

    How to use few shot examples in chat models

    How to use the MultiQueryRetriever

    How to use the Parent Document Retriever

    Image captions

    LOTR (Merger Retriever)

    Psychic

    RePhraseQuery

    Vector stores and retrievers

On this page

    Chroma
        __init__()
        aadd_documents()
        aadd_texts()
        add_documents()
        add_images()
        add_texts()
        adelete()
        afrom_documents()
        afrom_texts()
        aget_by_ids()
        amax_marginal_relevance_search()
        amax_marginal_relevance_search_by_vector()
        as_retriever()
        asearch()
        asimilarity_search()
        asimilarity_search_by_vector()
        asimilarity_search_with_relevance_scores()
        asimilarity_search_with_score()
        delete()
        delete_collection()
        encode_image()
        from_documents()
        from_texts()
        get()
        get_by_ids()
        max_marginal_relevance_search()
        max_marginal_relevance_search_by_vector()
        persist()
        search()
        similarity_search()
        similarity_search_by_image()
        similarity_search_by_image_with_relevance_score()
        similarity_search_by_vector()
        similarity_search_by_vector_with_relevance_scores()
        similarity_search_with_relevance_scores()
        similarity_search_with_score()
        update_document()
        update_documents()

© Copyright 2023, LangChain Inc.
