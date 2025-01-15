import os

def collect_codes(base_path):
    result = []

    # Parcours des sous-dossiers
    for root, dirs, files in os.walk(base_path):
        for dir_name in dirs:
            dir_path = os.path.join(root, dir_name)
            css_code = ""
            jsx_code = ""

            # Recherche des fichiers dans chaque sous-dossier
            for file_name in os.listdir(dir_path):
                file_path = os.path.join(dir_path, file_name)

                if file_name.endswith('.css'):
                    with open(file_path, 'r', encoding='utf-8') as css_file:
                        css_code = css_file.read()

                elif file_name.endswith('.jsx'):
                    with open(file_path, 'r', encoding='utf-8') as jsx_file:
                        jsx_code = jsx_file.read()

            if css_code or jsx_code:
                result.append({
                    "folder": dir_name,
                    "css": css_code,
                    "jsx": jsx_code
                })

    return result

def format_codes(codes):
    formatted_output = ""

    for code in codes:
        formatted_output += f"- Nom du sous dossier: {code['folder']}\n"
        formatted_output += "Code du css:\n"
        formatted_output += code['css'] + "\n" if code['css'] else "Pas de fichier CSS\n"
        formatted_output += "Code du jsx:\n"
        formatted_output += code['jsx'] + "\n" if code['jsx'] else "Pas de fichier JSX\n"
        formatted_output += "\n"

    return formatted_output

if __name__ == "__main__":
    base_directory = os.getcwd()

    codes = collect_codes(base_directory)
    formatted = format_codes(codes)

    output_file = os.path.join(base_directory, "output_codes.txt")
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(formatted)

    print(f"Les codes ont été collectés et enregistrés dans {output_file}")