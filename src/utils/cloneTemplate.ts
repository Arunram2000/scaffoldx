/**
 * Future: private GitHub templates — prefer SSH URLs, netrc, or vendor-specific degit flags;
 * fall back to authenticated `git clone` when degit cannot access the repo.
 */
import degit from 'degit';
import { ScaffoldxError } from './errors';

export async function cloneTemplate(source: string, destDir: string): Promise<void> {
  const emitter = degit(source, { force: true, cache: false });
  try {
    await emitter.clone(destDir);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new ScaffoldxError(`Failed to clone template "${source}": ${message}`);
  }
}
