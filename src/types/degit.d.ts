declare module 'degit' {
  export interface DegitOptions {
    cache?: boolean | undefined;
    force?: boolean | undefined;
    verbose?: boolean | undefined;
  }

  export interface DegitEmitter {
    clone(dest: string): Promise<void>;
    on(event: 'info' | 'warn', callback: (info: { message: string }) => void): void;
  }

  function degit(src: string, opts?: DegitOptions): DegitEmitter;
  export = degit;
}
