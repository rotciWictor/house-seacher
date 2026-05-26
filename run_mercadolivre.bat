@echo off
echo ==================================================
echo Inciando Scraper Local do Mercado Livre...
echo ==================================================
cd /d "%~dp0"
call npx tsx --env-file=.env.local scraper/mercadolivre.ts
echo ==================================================
echo Concluido!
pause
