// src/services/compiler.ts
export interface CompileRequest {
  code: string;
  compiler?: string;
}

export interface CompileResponse {
  status: string;
  program_message?: string;
  program_error?: string;
  compiler_message?: string;
  compiler_error?: string;
}

const WANDBOX_API_URL = 'https://wandbox.org/api/compile.json';

export async function compileCode(request: CompileRequest): Promise<CompileResponse> {
  const compiler = request.compiler || 'gcc-head';
  
  try {
    const response = await fetch(WANDBOX_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: request.code,
        compiler,
        save: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json() as CompileResponse;
  } catch (error) {
    console.error("Compilation error:", error);
    throw error;
  }
}
