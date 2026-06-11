from langchain_core.tools import tool
from pathlib import Path


@tool
def write_markdown_spec(file_name: str, content: str, folder: str = "specs", extension: str = "md") -> str:
    """
    Guarda un archivo en la carpeta de especificaciones.

    Usa esta herramienta para persistir el documento generado (producto, requisitos
    o diseno). Para producto y requisitos usa extension 'md'. Para diseno usa 'py'.

    Args:
        file_name: Nombre del archivo sin extension (ej: 'producto')
        content: Contenido completo del documento
        folder: Carpeta destino (por defecto 'specs')
        extension: Extension del archivo sin punto: 'md' o 'py' (por defecto 'md')

    Returns:
        Mensaje de confirmacion con la ruta absoluta del archivo guardado
    """
    specs_dir = Path(folder)
    specs_dir.mkdir(parents=True, exist_ok=True)

    file_path = specs_dir / f"{file_name}.{extension}"
    file_path.write_text(content, encoding="utf-8")

    return f"Archivo guardado exitosamente en: {file_path.resolve()}"
