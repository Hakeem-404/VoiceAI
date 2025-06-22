declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_CLAUDE_API_KEY: string;
      EXPO_PUBLIC_CLAUDE_API_URL?: string;
    }
  }
}

export {};