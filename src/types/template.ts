export interface RegistryTemplateEntry {
  repo: string;
  branch?: string;
}

export type Registry = Record<string, Record<string, RegistryTemplateEntry>>;

export interface TemplateMeta {
  name: string;
  stack: string;
  version: string;
  description: string;
  placeholders: string[];
}

export type PromptType = 'input' | 'password' | 'confirm' | 'list' | 'rawlist';

export interface PromptQuestion {
  name: string;
  message: string;
  type?: PromptType;
  default?: string | boolean | number;
  choices?: string[];
}

export interface PromptsConfig {
  questions: PromptQuestion[];
}

export type Answers = Record<string, string>;
