const CEREBRAS_BASE_URL = "https://api.cerebras.ai/v1";

export type CerebrasMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export class CerebrasError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "CerebrasError";
    this.status = status;
  }
}

export function getCerebrasModel() {
  return process.env.CEREBRAS_MODEL || "gpt-oss-120b";
}

function getApiKey() {
  const key = process.env.CEREBRAS_API_KEY?.trim();

  if (!key) {
    throw new CerebrasError(
      "CEREBRAS_API_KEY chưa được cấu hình",
      500
    );
  }

  return key;
}

async function parseError(response: Response): Promise<string> {
  try {
    const data = await response.json();

    return (
      data?.error?.message ||
      data?.message ||
      `Cerebras API error: ${response.status}`
    );
  } catch {
    return `Cerebras API error: ${response.status} ${response.statusText}`;
  }
}

/**
 * Stream câu trả lời từ Cerebras.
 *
 * Mỗi lần generator yield ra một đoạn text.
 * Khi stream kết thúc, return usage.
 */
export async function* streamCerebrasChat({
  messages,
}: {
  messages: CerebrasMessage[];
}): AsyncGenerator<
  string,
  {
    inputTokens: number;
    outputTokens: number;
  },
  void
> {
  const response = await fetch(
    `${CEREBRAS_BASE_URL}/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getApiKey()}`,
      },
      body: JSON.stringify({
        model: getCerebrasModel(),
        messages,
        stream: true,
      }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new CerebrasError(
      await parseError(response),
      response.status
    );
  }

  if (!response.body) {
    throw new CerebrasError(
      "Cerebras không trả về response stream",
      502
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  let inputTokens = 0;
  let outputTokens = 0;

  try {
    while (true) {
      const { value, done } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, {
        stream: true,
      });

      const lines = buffer.split("\n");

      buffer = lines.pop() || "";

      for (const rawLine of lines) {
        const line = rawLine.trim();

        if (!line) continue;

        if (!line.startsWith("data:")) continue;

        const data = line.slice(5).trim();

        if (data === "[DONE]") {
          continue;
        }

        try {
          const parsed = JSON.parse(data);

          const content =
            parsed?.choices?.[0]?.delta?.content;

          if (typeof content === "string" && content.length > 0) {
            yield content;
          }

          const usage = parsed?.usage;

          if (usage) {
            inputTokens =
              Number(
                usage.prompt_tokens ??
                  usage.input_tokens ??
                  inputTokens
              ) || inputTokens;

            outputTokens =
              Number(
                usage.completion_tokens ??
                  usage.output_tokens ??
                  outputTokens
              ) || outputTokens;
          }
        } catch {
          // Một số chunk SSE có thể chưa hoàn chỉnh.
          // Bỏ qua chunk lỗi và tiếp tục stream.
        }
      }
    }

    // Xử lý phần buffer cuối cùng.
    const finalLine = buffer.trim();

    if (
      finalLine &&
      finalLine.startsWith("data:")
    ) {
      const data = finalLine.slice(5).trim();

      if (data !== "[DONE]") {
        try {
          const parsed = JSON.parse(data);

          const content =
            parsed?.choices?.[0]?.delta?.content;

          if (
            typeof content === "string" &&
            content.length > 0
          ) {
            yield content;
          }

          const usage = parsed?.usage;

          if (usage) {
            inputTokens =
              Number(
                usage.prompt_tokens ??
                  usage.input_tokens ??
                  inputTokens
              ) || inputTokens;

            outputTokens =
              Number(
                usage.completion_tokens ??
                  usage.output_tokens ??
                  outputTokens
              ) || outputTokens;
          }
        } catch {
          // Ignore incomplete final SSE chunk.
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return {
    inputTokens,
    outputTokens,
  };
}

/**
 * Gọi Cerebras không stream.
 */
export async function completeCerebrasChat({
  messages,
  maxTokens = 4096,
  temperature = 0.7,
}: {
  messages: CerebrasMessage[];
  maxTokens?: number;
  temperature?: number;
}): Promise<{
  content: string;
  inputTokens: number;
  outputTokens: number;
}> {
  const response = await fetch(
    `${CEREBRAS_BASE_URL}/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getApiKey()}`,
      },
      body: JSON.stringify({
        model: getCerebrasModel(),
        messages,
        stream: false,
        max_tokens: maxTokens,
        temperature,
      }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new CerebrasError(
      await parseError(response),
      response.status
    );
  }

  const data = await response.json();

  const content =
    data?.choices?.[0]?.message?.content || "";

  const inputTokens =
    Number(
      data?.usage?.prompt_tokens ??
        data?.usage?.input_tokens ??
        0
    ) || 0;

  const outputTokens =
    Number(
      data?.usage?.completion_tokens ??
        data?.usage?.output_tokens ??
        0
    ) || 0;

  return {
    content,
    inputTokens,
    outputTokens,
  };
}