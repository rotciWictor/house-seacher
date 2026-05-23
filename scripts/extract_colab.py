import json

with open('public/Desafio_Lighthouse_Dados_&_AI(2).ipynb', encoding='utf-8') as f:
    notebook = json.load(f)

output = ""
for cell in notebook['cells']:
    if cell['cell_type'] == 'markdown':
        output += "### MARKDOWN ###\n"
        output += "".join(cell.get('source', [])) + "\n\n"
    elif cell['cell_type'] == 'code':
        output += "### CODE ###\n"
        output += "".join(cell.get('source', [])) + "\n\n"

with open('public/extracted_notebook.md', 'w', encoding='utf-8') as f:
    f.write(output)
