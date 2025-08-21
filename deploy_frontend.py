import os

# --- Configuração ---
# O diretório onde a busca e substituição serão feitas.
TARGET_DIR = "FrontEnd"

# A string antiga (URL de desenvolvimento) que você quer substituir.
OLD_STRINGS = ["http://localhost:3000", "localhost:3000"]

# A nova string (URL de produção) que será colocada no lugar.
NEW_STRING = "https://yup.notiffly.com.br"

# Lista de extensões de arquivo a serem processadas.
VALID_EXTENSIONS = [
    '.js', '.ts', '.tsx', '.jsx', '.json', '.css', '.html', '.svg'
]

# Lista de diretórios a serem completamente ignorados.
# Adicione outros diretórios se necessário (ex: 'dist', '.git', etc.)
EXCLUDED_DIRS = ['node_modules']

# --- Lógica do Script ---

def replace_in_file(file_path):
    """
    Abre um arquivo, substitui as strings e salva as alterações.
    Retorna True se alguma substituição foi feita, False caso contrário.
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
    except Exception as e:
        print(f"  -> Aviso: Não foi possível ler o arquivo {file_path}. Ignorando. (Erro: {e})")
        return False

    original_content = content
    
    for old_str in OLD_STRINGS:
        content = content.replace(old_str, NEW_STRING)

    if content != original_content:
        try:
            with open(file_path, 'w', encoding='utf-8') as file:
                file.write(content)
            print(f"  -> Alterações salvas em: {file_path}")
            return True
        except Exception as e:
            print(f"  -> ERRO: Não foi possível escrever no arquivo {file_path}. (Erro: {e})")
            return False
    return False

def main():
    """
    Função principal que percorre o diretório e chama a função de substituição.
    """
    target_path = os.path.abspath(TARGET_DIR)

    if not os.path.isdir(target_path):
        print(f"Erro: O diretório '{target_path}' não foi encontrado.")
        print("Por favor, execute este script a partir da raiz do seu projeto.")
        return

    print(f"Iniciando a substituição de URLs no diretório '{target_path}'...")
    print(f"De: {OLD_STRINGS}")
    print(f"Para: '{NEW_STRING}'")
    print(f"Ignorando os diretórios: {EXCLUDED_DIRS}")
    print("-" * 60)

    files_processed = 0
    files_changed = 0

    # os.walk permite modificar a lista de diretórios 'dirs' em tempo real
    # para evitar que o script entre em pastas indesejadas.
    for root, dirs, files in os.walk(target_path):
        # Remove os diretórios excluídos da busca
        dirs[:] = [d for d in dirs if d not in EXCLUDED_DIRS]

        for filename in files:
            # Verifica se a extensão do arquivo está na lista de extensões válidas
            if any(filename.endswith(ext) for ext in VALID_EXTENSIONS):
                file_path = os.path.join(root, filename)
                files_processed += 1
                if replace_in_file(file_path):
                    files_changed += 1

    print("-" * 60)
    print("Substituição concluída!")
    print(f"Total de arquivos processados: {files_processed}")
    print(f"Total de arquivos modificados: {files_changed}")

if __name__ == "__main__":
    main()