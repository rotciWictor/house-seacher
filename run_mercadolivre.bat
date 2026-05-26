@echo off
echo ==================================================
echo Aguardando conexao com a internet...
echo ==================================================

:check_connection
ping -n 1 8.8.8.8 >nul 2>&1
if %errorlevel% neq 0 (
    echo Sem internet... Aguardando 5 segundos.
    timeout /t 5 /nobreak >nul
    goto check_connection
)

echo Internet conectada!
echo ==================================================
echo Inciando Scraper Local do Mercado Livre...
echo ==================================================
cd /d "%~dp0"
call npx tsx --env-file=.env.local scraper/mercadolivre.ts

echo ==================================================
echo Scraper finalizado. Esta janela vai fechar em 30 segundos...
timeout /t 30 >nul
