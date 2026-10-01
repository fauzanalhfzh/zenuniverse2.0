let runtime;
let outputLength = 0;
const limit = 20000;

function output(text) {
    const remaining = limit - outputLength;
    if (remaining <= 0) return;
    const chunk = `${text}\n`.slice(0, remaining);
    outputLength += chunk.length;
    self.postMessage({ type: 'output', text: chunk });
}

self.onmessage = async ({ data }) => {
    try {
        if (!runtime) {
            const { loadPyodide } =
                await import('https://cdn.jsdelivr.net/pyodide/v314.0.6/full/pyodide.mjs');
            runtime = await loadPyodide({ stdout: output, stderr: output });
        }
        outputLength = 0;
        self.postMessage({ type: 'ready' });
        await runtime.runPythonAsync(data.code);
        self.postMessage({ type: 'done' });
    } catch (error) {
        self.postMessage({ type: 'error', text: String(error) });
    }
};
