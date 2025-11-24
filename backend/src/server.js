import express from "express";
import { chatWithAgent } from "./agent.js";
import cors from "cors";
const app=express();

app.use(
    cors({
        origin:"*",
    })
)

app.use(express.json());

app.get("/health",(req,res)=>{
    res.json({status:"ok"});
})

app.post("/api/chat",async(req,res)=>{
    try{
        const {message,threadId}=req.body;

        if(!message || !message.trim()){
            return res.status(400).json({error:"Message is required"});
        }

        const reply=await chatWithAgent(message,threadId || "1");
        res.json({reply});
    }catch(error){
        console.log("Error in /api/chat",error);
        res.status(500).json({error:"Server Error"});
    }
});

const PORT=process.env.PORT || 3000;
app.listen(PORT,"0.0.0.0",()=>{
    console.log(`✅ Backend Server running at http://localhost:${PORT}`);
});