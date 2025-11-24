import { ChatGroq } from "@langchain/groq";
import { MemorySaver, MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { TavilySearch } from "@langchain/tavily";
import { ToolMessage } from "langchain";

const checkpointer=new MemorySaver();

const tool=new TavilySearch({
    maxResults:3,
    topic:"general",
});

const llm=new ChatGroq({
    model:"openai/gpt-oss-120b",
    temperature:0,
}).bindTools([tool]);

async function callModel(state){
    console.log("CALLING LLM",state.messages);
    if(!state.messages || state.messages.length===0){
        throw new Error("State has no messages.Did you call the graph with {messages:[...]}?");
    }
    const response=await llm.invoke(state.messages);
    return {messages:[response]};
}

async function toolNode(state){
    const lastMsg=state.messages[state.messages.length-1];

    // if(!isAIMessage(lastMsg)){
    //     return {messages:[]}
    // }

    const toolCalls=lastMsg.tool_calls ?? [];
    if(toolCalls.length===0) return {messages:[]};

    const results=[];
    for(const call of toolCalls){
        if(call.name === "tavily_search"){
            const result=await tool._call(call.args);
            const msg=new ToolMessage({
                tool_call_id:call.id,
                name:call.name,
                content:JSON.stringify(result),
            });

            results.push(msg);
        }
    }

    return { messages:results};
}

function shouldContinue(state){
    const lastMessage=state.messages[state.messages.length-1];
    if(lastMessage?.tool_calls?.length){
        return "tools";
    }
    return "__end__";
}

const workflow=new StateGraph(MessagesAnnotation)
    .addNode("agent",callModel)
    .addNode("tools",toolNode)
    .addEdge("__start__","agent")
    .addConditionalEdges("agent",shouldContinue)
    .addEdge("tools","agent");

const app=workflow.compile({checkpointer});

export async function chatWithAgent(userInput,threadId="1"){
    const finalState=await app.invoke({
        messages:[{role:"user",content:userInput}],
    },
    {configurable:{thread_id:String(threadId)}}
);

    const lastMessage=finalState.messages[finalState.messages.length-1];
    return lastMessage.content;
}