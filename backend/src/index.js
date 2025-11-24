import { ChatGroq } from "@langchain/groq";
import { MemorySaver, MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { TavilySearch } from "@langchain/tavily";
import { ToolMessage } from "langchain";
import readline from "node:readline/promises";
import { threadId } from "node:worker_threads";

const checkpointer=new MemorySaver();

const tool=new TavilySearch({
    maxResults:3,
    topic:"general"
})

/**
 * 1.Define Node Function
 * 2.Build the Graph
 * 3.Compile and Invoke the Graph
 */

/**
 * Initialize the LLM
 */

const llm=new ChatGroq({
    model:"openai/gpt-oss-120b",
    temperature:0,  
}).bindTools([tool])



async function callModel(state){
    //Call the LLM using APIs
    console.log("CALLING LLM")
    const response=await llm.invoke(state.messages);
    return {...state,messages:[response]}
    /*const gens=response.generations;
    const firstGen=Array.isArray(gens[0]) ? gens[0][0] : gens[0];
    const content=firstGen.text;*/
    //AI MESSAGE
    // return {
    //     ...state,
    //     messages:[...state.messages,{role:"assistant",response}]};
}


async function toolNode(state){
    const lastMsg=state.messages[state.messages.length-1];
    const toolCalls=lastMsg.tool_calls || [];
    if(toolCalls.length === 0) return state;

    const results=[];
    for (const call of toolCalls) {
    if (call.name === "tavily_search") {
      
      const result = await tool._call(call.args);
      //ToolMessage object
      const msg = new ToolMessage({
        tool_call_id: call.id, // required for LangGraph linking
        name: call.name,
        content: JSON.stringify(result),
      });
      results.push(msg);
    }
  }
    
    return {
    ...state,
      messages: [...state.messages,...results],
};
}

function shouldContinue(state){
    //put your condition whether to call a tool or end
    const lastMessage=state.messages[state.messages.length-1];
    
    if(lastMessage.tool_calls?.length>0){
        return "tools";
    }
    return "__end__";
}

/**
 * Build the Graph
 */
const workflow=new StateGraph(MessagesAnnotation)
                .addNode("agent",callModel)
                .addNode("tools",toolNode)
                .addEdge("__start__","agent")
                .addEdge("tools","agent")
                .addConditionalEdges("agent",shouldContinue)

/**
 * Compile the Graph
 */
const app=workflow.compile({checkpointer});

async function main(){
    const rl=readline.createInterface({input: process.stdin,output: process.stdout,})

    while(true){
        const userInput=await rl.question("You:");
        if(userInput === '/bye') break;
        //USER MESSAGE
        const finalState=await app.invoke({
            messages:[{role:'user',content:userInput}],
        },{ configurable: { thread_id: "1"}});

        const lastMessage=finalState.messages[finalState.messages.length-1];
        
        console.log("AI :",lastMessage.content);
    }
    
    rl.close();
}

main();