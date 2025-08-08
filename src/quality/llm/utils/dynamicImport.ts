export async function safeDynamicImport<T = any>(moduleName: string): Promise<T | null> {
  try {
    // @ts-ignore - Dynamic import for optional dependencies
    const module = await import(moduleName);
    return module;
  } catch (error) {
    return null;
  }
}

// Generic helpers for specific LLM providers (no type references)
export async function importOpenAI(): Promise<any> {
  return await safeDynamicImport('openai');
}

export async function importAnthropic(): Promise<any> {
  return await safeDynamicImport('@anthropic-ai/sdk');
}

export async function importGemini(): Promise<any> {
  return await safeDynamicImport('@google/generative-ai');
}