from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

CONTEXTUALIZE_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            (
                "Given the conversation history and the latest user question, "
                "reformulate it as a standalone question that can be understood without the history. "
                "If the question contains relative time references (e.g. 'today', 'yesterday', 'this week'), "
                "resolve them to exact dates using the current date: {current_date}. "
                "Do NOT answer it, just reformulate it if needed, otherwise return it as is."
            ),
        ),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ]
)

QA_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            (
                "You are a helpful assistant with access to the user's meeting notes. "
                "Use the retrieved meeting context below to answer the question. "
                "When the context contains relevant information, present it directly and completely without asking for confirmation. "
                "If the context contains no meetings matching what the user asked, say so clearly. "
                "If the context is not relevant, answer based on your general knowledge.\n\n"
                "Context:\n{context}"
            ),
        ),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ]
)
