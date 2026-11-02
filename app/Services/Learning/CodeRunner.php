<?php

namespace App\Services\Learning;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;

/**
 * Executes learner code in a Piston sandbox that runs on a separate host with
 * networking disabled and strict time, memory, and process limits. The
 * Laravel host never executes submitted code itself. Returns null when the
 * sandbox is not configured, does not support the language, or cannot be
 * reached, so callers can fall back to answer-key comparison.
 */
class CodeRunner
{
    private const MAX_ERROR_LINES = 8;

    public function supports(string $language): bool
    {
        return $this->url() !== '' && is_array($this->runtimes()[$language] ?? null);
    }

    public function run(string $language, string $code, string $stdin = ''): ?CodeRunResult
    {
        if (! $this->supports($language)) {
            return null;
        }

        $runtime = $this->runtimes()[$language];
        $config = config('services.piston');

        try {
            $response = Http::acceptJson()
                ->timeout((int) $config['http_timeout'])
                ->when($config['token'] !== null && $config['token'] !== '', fn ($http) => $http->withToken((string) $config['token']))
                ->post($this->url().'/api/v2/execute', [
                    'language' => $runtime['language'],
                    'version' => $runtime['version'],
                    'files' => [['name' => $runtime['file'], 'content' => $code]],
                    'stdin' => $stdin,
                    'compile_timeout' => (int) $config['compile_timeout_ms'],
                    'run_timeout' => (int) $config['run_timeout_ms'],
                    'run_memory_limit' => (int) $config['memory_bytes'],
                ])
                ->throw();
        } catch (ConnectionException|RequestException $exception) {
            report($exception);

            return null;
        }

        $compile = $response->json('compile');

        if (is_array($compile) && ($compile['code'] ?? 0) !== 0) {
            return new CodeRunResult('', $this->compileError($compile));
        }

        $run = $response->json('run');

        if (! is_array($run)) {
            return null;
        }

        $stdout = (string) ($run['stdout'] ?? '');

        if (($run['signal'] ?? null) === 'SIGKILL') {
            return new CodeRunResult($stdout, 'Waktu habis: program berjalan terlalu lama atau memakai memori terlalu besar.');
        }

        if (($run['code'] ?? 0) !== 0) {
            return new CodeRunResult($stdout, $this->runtimeError((string) ($run['stderr'] ?? '')));
        }

        return new CodeRunResult($stdout, null);
    }

    /** @param array<string, mixed> $compile */
    private function compileError(array $compile): string
    {
        $lines = array_values(array_filter(explode("\n", (string) ($compile['stderr'] ?? $compile['output'] ?? '')), fn (string $line): bool => trim($line) !== ''));

        return $lines === [] ? 'Kode gagal dikompilasi.' : implode("\n", array_slice($lines, 0, self::MAX_ERROR_LINES));
    }

    /** Only the last line of a traceback (e.g. "NameError: ...") is useful to a beginner; sandbox paths are noise. */
    private function runtimeError(string $stderr): string
    {
        $lines = array_values(array_filter(explode("\n", $stderr), fn (string $line): bool => trim($line) !== ''));

        return $lines === [] ? 'Program berhenti dengan error.' : trim((string) end($lines));
    }

    private function url(): string
    {
        return rtrim((string) config('services.piston.url'), '/');
    }

    /** @return array<string, array{language: string, version: string, file: string}> */
    private function runtimes(): array
    {
        return (array) config('services.piston.runtimes', []);
    }
}
