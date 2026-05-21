import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json({ error: 'Nenhum código recebido' }, { status: 400 });
    }

    const html = `
    <html>
      <head>
        <title>Autorização Concluída</title>
        <style>
          body { font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #ffe600; margin: 0; }
          .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; }
          h1 { color: #333; margin-top: 0; }
          .code { background: #f4f4f4; padding: 1rem; border-radius: 8px; font-family: monospace; word-break: break-all; margin: 1rem 0; font-size: 1.2rem;}
        </style>
      </head>
      <body>
        <div class="card">
          <h1>✅ Autorizado com Sucesso!</h1>
          <p>O Mercado Livre concedeu acesso. Copie o código abaixo e cole no terminal/chat:</p>
          <div class="code">${code}</div>
          <p>Você já pode fechar esta aba.</p>
        </div>
      </body>
    </html>
    `;

    return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html' },
    });
}
