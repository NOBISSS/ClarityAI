import readline from "node:readline/promises";
import { chatWithAgent } from "./agent.js";

async function main(){
    const rl=readline.createInterface({
        input:process.stdin,
        output:process.stdout
    });

    while(true){
        const userInput=await rl.question("You:");
        if(userInput==="/bye") break;
        const reply=await chatWithAgent(userInput,"1");
        console.log("AI:",reply);
    }

    rl.close();
}

main();