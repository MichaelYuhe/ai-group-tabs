import { getStorage, setStorage } from "../utils";

interface PreviewData {
  url: string;
  title?: string;
  siteName?: string;
  description?: string;
  images?: string[];
  mediaType?: string;
  contentType?: string;
  charset?: string;
  videos?: string[];
  favicons?: string[];
}

export const getLinkPreview = async (url: string) => {
  // TODO deploy to our own worker
  // See https://github.com/OP-Engineering/link-preview-js
  const response = await fetch(
    "https://affine-worker.toeverything.workers.dev/api/worker/linkPreview",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
      }),
    }
  );
  if (response.status !== 200) {
    return;
  }
  const data: PreviewData = await response.json();
  for (const key in data) {
    const k = key as keyof PreviewData;
    if (!data[k]) {
      delete data[k];
    }
  }
  return data;
};

export interface EmbeddingResult {
  object: "list" | string;
  data: {
    object: "embedding";
    embedding: number[];
    index: number;
  }[];
  model: "text-embedding-ada-002" | string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

const fetchEmbedding = async (apiKey: string, text: string) => {
  const apiURL =
    (await getStorage("apiURL")) || "https://api.openai.com/v1/embeddings";

  // OpenAI recommend using `text-embedding-ada-002` for nearly all use cases.
  // See https://platform.openai.com/docs/guides/embeddings/embedding-models
  const model = "text-embedding-ada-002";

  // See https://platform.openai.com/docs/api-reference/embeddings/create
  const response = await fetch(apiURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input: text,
      model,
      // encoding_format: "base64",
    }),
  });

  const data: EmbeddingResult = await response.json();
  const embedding = data.data[0].embedding;
  return embedding;
};

type EmbeddingData = {
  preview: PreviewData;
  embedding: number[];
  timestamp: number;
};

const getDomainEmbedding = async (
  apiKey: string,
  hostname: string
): Promise<EmbeddingData | undefined> => {
  const preview = await getLinkPreview(hostname);
  if (!preview) return;
  const text = [
    preview.url,
    preview.siteName,
    preview.title,
    preview.description,
  ]
    .filter(Boolean)
    .join("\n");
  const embedding = await fetchEmbedding(apiKey, text);
  return {
    preview,
    embedding,
    timestamp: Date.now(),
  };
};

export const getDomainEmbeddingWithCache = async (
  apiKey: string,
  url: string
) => {
  const hostname = new URL(url).hostname;
  const cacheKey = `embedding-${hostname}`;
  const cache = await getStorage<number[]>(cacheKey);
  if (cache) {
    return cache;
  }
  const embedding = await getDomainEmbedding(apiKey, hostname);
  if (!embedding) return;
  await setStorage(cacheKey, embedding);
  return embedding;
};
