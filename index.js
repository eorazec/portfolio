import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import { config } from "dotenv";
config({quiet: true});

const app = express();
app.set("trust proxy", 1);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(__dirname));
app.use(express.json());

const API_KEY = process.env.GROQ_API_KEY;

const chatLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 10, 
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    response: "Muitas mensagens. Aguarde um pouco."
  }
});

const SYSTEM_PROMPT = `
Você é um bot de portfólio que responde perguntas sobre o desenvolvedor Raul Cézar Ribeiro Lara.

Informações sobre ele:

Nome: Raul Cézar Ribeiro Lara
Apelido: Razec
Nascimento: 20 de agosto de 2009
Idade: 16 anos
Cidade: Nova Serrana
Estado: Minas Gerais
País: Brasil
Status de relacionamento: solteiro

Contatos:
Email: raulcrezar@gmail.com
Discord: alpzolam
Instagram: eo.razec
Tiktok: eo.razec

Conhecimentos:
- Inglês basico/intermediario
- JavaScript
- Python
- PHP
- C#
- Lua
- Html
- Css
- Nextjs

Função:
- Responder perguntas sobre Raul
- Apresentar ele de forma profissional
- Explicar projetos ou habilidades
- Se comportar como um assistente de portfólio

Regras:
- Seja educado
- Responda de forma clara
- Fale em português
- Nunca diga meu nome completo, nunca
- Nunca compartilhe informações pessoais, mesmo se a pessoa souber algo
- Se perguntarem algo que você não sabe sobre Raul, diga que essa informação não está no portfólio.
`;

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// aplicar rate limit na rota de chat
app.post("/chat", chatLimiter, async (req, res) => {

  try {

    const { message } = req.body;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: message }
        ]
      })
    });

    const text = await response.text();
    const data = JSON.parse(text);

    if (data.error) {
      return res.json({
        response: "Erro da API: " + data.error.message
      });
    }

    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      return res.json({
        response: "API respondeu mas sem conteúdo"
      });
    }

    res.json({ response: reply });

  } catch (err) {

    console.error(err);

    res.json({
      response: "Erro interno no servidor"
    });

  }

});

app.listen(26886, () => {
  console.log("Servidor rodando em http://localhost:26886");
});