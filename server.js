
require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/notes", async (req, res) => {
  try {
    const { topic, subject, grade, questions } = req.body || {};

    if (!topic || !String(topic).trim()) {
      return res.status(400).json({ error: "Укажи тему конспекта." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: "Добавь GEMINI_API_KEY в файл .env."
      });
    }

    const prompt = `Ты — внимательный школьный помощник. Подготовь понятный, содержательный и точный конспект на русском языке.

Тема: ${String(topic).slice(0, 300)}
Предмет: ${String(subject || "Не указан").slice(0, 100)}
Класс: ${String(grade || "Не указан").slice(0, 30)}
Дополнительные вопросы и ключевые слова ученика: ${String(questions || "Нет").slice(0, 2000)}

Требования:
Требования:
- Учитывай возраст и уровень указанного класса.
- Создай полноценный, но компактный конспект.
- Оптимальный объём: 400–600 слов.
- Если материала много, самостоятельно сокращай второстепенные подробности.
- Не повторяй одну и ту же мысль разными словами.
- Сохраняй все важные определения, формулы, даты и факты.
- Обязательно ответь на каждый дополнительный вопрос ученика.
- Используй заголовки, списки и выделяй важные термины.
- В конце добавь блок «Главное запомнить» и словарь ключевых терминов.
- Не выдумывай факты и даты.
- Пиши доступно, без лишней воды.
- Главное — качество и точность, а не количество текста.`;

    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

    console.log("Отправляю запрос в Gemini...");

const response = await ai.interactions.create({
  model: "gemini-3.8-flash",
  input: prompt,
  generation_config: {
    thinking_level: "low"
  }
});

console.log("Gemini ответил!");

const notes = response.output_text;

    if (!notes) {
      return res.status(502).json({
        error: "Gemini не вернул текст. Попробуй ещё раз."
      });
    }

    res.json({ notes });

  } catch (error) {
    console.error("Gemini API error:", error.message);
    res.status(502).json({
      error: "Не удалось создать конспект. Проверь API-ключ и попробуй ещё раз."
    });
  }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Note AI запущен: http://localhost:${port}`);
});
