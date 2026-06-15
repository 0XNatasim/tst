import OpenAI from "openai"

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface AnalysisRequest {
  type: "contract" | "budget" | "vendor" | "anomaly"
  data: string
}

export interface AnalysisResponse {
  summary: string
  risks: string[]
  recommendations: string[]
  confidence: number
}

export async function analyzeContract(data: string): Promise<AnalysisResponse> {
  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an AI public procurement investigator for Quebec.
Analyze contract data and identify:
1. Summary of the contract
2. Risk indicators (sole source, high value, unusual terms)
3. Recommendations for transparency
4. Confidence score (0-1)`,
      },
      { role: "user", content: data },
    ],
  })
  const content = response.choices[0]?.message?.content ?? ""
  return {
    summary: content.slice(0, 300),
    risks: [],
    recommendations: [],
    confidence: 0.8,
  }
}

export async function detectAnomalies(data: string): Promise<AnalysisResponse> {
  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "Analyze this government financial data for anomalies: unusual patterns, potential waste, inefficiencies, or irregularities.",
      },
      { role: "user", content: data },
    ],
  })
  const content = response.choices[0]?.message?.content ?? ""
  return {
    summary: content.slice(0, 300),
    risks: [],
    recommendations: [],
    confidence: 0.7,
  }
}

export async function generateReport(data: string): Promise<string> {
  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "Generate a structured audit report from this financial data. Include summary, findings, risks, and recommendations.",
      },
      { role: "user", content: data },
    ],
  })
  return response.choices[0]?.message?.content ?? ""
}
