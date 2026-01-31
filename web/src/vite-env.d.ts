/// <reference types="vite/client" />

declare module '*.svg';
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.bmp';
declare module '*.tiff';

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  // 其他环境变量可以在这里添加
  // readonly VITE_ANOTHER_VAR: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
