import { cosineSimilarity, getStorage, setStorage } from "../utils";

// W3C Standardized categories
// See https://github.com/w3c/manifest/wiki/Categories
export const DEFAULT_GROUP = [
  { name: "Books", desc: "A collection of books and literature resources." },
  {
    name: "Business",
    desc: "Resources related to business operations and finance.",
  },
  { name: "Education", desc: "Educational resources and learning materials." },
  {
    name: "Entertainment",
    desc: "Entertainment resources including movies, music, and TV shows.",
  },
  {
    name: "Finance",
    desc:
      "Financial resources including banking, investing, and personal finance.",
  },
  {
    name: "Fitness",
    desc: "Fitness resources including workout routines and health tips.",
  },
  {
    name: "Food",
    desc:
      "Food resources including recipes, cooking tips, and nutrition information.",
  },
  {
    name: "Games",
    desc: "Gaming resources including video games, board games.",
  },
  {
    name: "Government",
    desc: "Government resources including legal documents and public services.",
  },
  {
    name: "Health",
    desc: "Health resources including medical information and wellness tips.",
  },
  {
    name: "Kids",
    desc:
      "Resources for kids including educational games and child-friendly entertainment.",
  },
  {
    name: "Lifestyle",
    desc:
      "Lifestyle resources including fashion, home decor, and personal growth.",
  },
  {
    name: "Magazines",
    desc: "Magazines and periodicals covering a variety of topics.",
  },
  {
    name: "Medical",
    desc: "Medical resources including health guides and medical research.",
  },
  {
    name: "Music",
    desc: "Music resources including songs, albums.",
  },
  {
    name: "Navigation",
    desc: "Navigation resources including maps and travel guides.",
  },
  {
    name: "News",
    desc: "News resources including current events and journalism.",
  },
  {
    name: "Personalization",
    desc: "Resources for personalizing your digital experience.",
  },
  // {
  //   name: "Photo",
  //   desc:
  //     "Photography resources including photo editing tools and photography tips.",
  // },
  // {
  //   name: "Politics",
  //   desc:
  //     "Political resources including news, analysis, and government documents.",
  // },
  {
    name: "Productivity",
    desc:
      "Resources focused on enhancing efficiency and productivity, including tools for task management, note-taking, and time tracking.",
  },
  // {
  //   name: "Security",
  //   desc:
  //     "Security resources including cybersecurity tips and secure communication tools.",
  // },
  {
    name: "Shopping",
    desc: "Shopping resources including product reviews and deal alerts.",
  },
  {
    name: "Social",
    desc:
      "Social resources including social networking apps and communication tools.",
  },
  {
    name: "Sports",
    desc: "Sports resources including news, scores, and team information.",
  },
  {
    name: "Travel",
    desc: "Travel resources including guides, booking tools, and travel tips.",
  },
  // {
  //   name: "Utilities",
  //   desc:
  //     "Utility resources including tools and services to optimize your workflow.",
  // },
  {
    name: "Weather",
    desc:
      "Weather resources including forecasts, alerts, and climate information.",
  },
] as const;

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
    "https://affine-worker.toeverything.workers.dev/api/worker/link-preview",
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

export const fetchEmbedding = async (apiKey: string, text: string) => {
  // TODO support configurable API URL
  const apiUrl =
    (await getStorage("apiURL")) || "https://api.openai.com/v1/embeddings";

  const embedUrl = apiUrl
    ? new URL(apiUrl).origin + "/v1/embeddings"
    : "https://api.openai.com/v1/embeddings";

  // OpenAI recommend using `text-embedding-ada-002` for nearly all use cases.
  // See https://platform.openai.com/docs/guides/embeddings/embedding-models
  const model = "text-embedding-ada-002";

  // See https://platform.openai.com/docs/api-reference/embeddings/create
  const response = await fetch(embedUrl, {
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

export const getDomainEmbeddingDataWithCache = async (
  apiKey: string,
  url: string
) => {
  const hostname = new URL(url).hostname;
  const cacheKey = `embedding-${hostname}`;
  const cache = await getStorage<EmbeddingData>(cacheKey);
  if (cache) {
    return cache;
  }
  const embedding = await getDomainEmbedding(apiKey, hostname);
  if (!embedding) return;
  await setStorage(cacheKey, embedding);
  return embedding;
};

type GroupEmbeddingData = {
  type: string;
  embedding: number[];
  timestamp: number;
};

const getGroupTypeEmbeddingWithCache = async (
  apiKey: string,
  { name, desc }: { name: string; desc: string }
) => {
  const cacheKey = `embedding-group-v4-${name}`;
  const cache = await getStorage<GroupEmbeddingData>(cacheKey);
  if (cache) {
    return cache;
  }
  const embedding = await fetchEmbedding(apiKey, name + "\n" + desc);
  if (!embedding) return;
  const embeddingData = {
    type: name,
    embedding,
    timestamp: Date.now(),
  };
  await setStorage<GroupEmbeddingData>(cacheKey, embeddingData);
  return embeddingData;
};

export const getDomainMatchedType = async (apiKey: string, url: string) => {
  if (!apiKey) throw new Error("apiKey not found");
  const embeddingData = await getDomainEmbeddingDataWithCache(apiKey, url);
  if (!embeddingData) return;
  let maxSimilarity = 0;
  let maxMatchType = "Unknown";
  for (const group of DEFAULT_GROUP) {
    const groupEmbeddingData = await getGroupTypeEmbeddingWithCache(
      apiKey,
      group
    );
    if (!groupEmbeddingData) {
      console.error("groupEmbeddingData not found", group);
      continue;
    }
    const similarity = cosineSimilarity(
      groupEmbeddingData.embedding,
      embeddingData.embedding
    );

    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
      maxMatchType = groupEmbeddingData.type;
    }
  }
  return {
    url,
    type: maxMatchType,
    similarity: maxSimilarity,
    preview: embeddingData.preview,
  };
};
