export class ScaffoldxError extends Error {
  readonly exitCode: number;

  constructor(message: string, exitCode = 1) {
    super(message);
    this.name = new.target.name;
    this.exitCode = exitCode;
    Error.captureStackTrace?.(this, new.target);
  }
}

export class RegistryError extends ScaffoldxError {
  constructor(message: string) {
    super(message);
    this.name = 'RegistryError';
  }
}

export class TemplateValidationError extends ScaffoldxError {
  constructor(message: string) {
    super(message);
    this.name = 'TemplateValidationError';
  }
}
