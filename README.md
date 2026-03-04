# TFG
Trabajo Fin de Grado para el grado en Ingeniería Informática, mención en computación, para la Universidade da Coruña (UDC)

## Desarrollo local

### Pre-commit (auto-formateo antes de cada commit)

El repositorio usa [pre-commit](https://pre-commit.com/) para ejecutar automáticamente
**isort**, **black** (backend) y **prettier** + **eslint --fix** (frontend) antes de cada
`git commit`.

**Activar pre-commit por primera vez:**

```bash
pip install pre-commit
pre-commit install
```

**Ejecutar manualmente sobre todos los archivos:**

```bash
pre-commit run --all-files
```

> **Nota:** En local, pre-commit *modifica* los archivos automáticamente (auto-fix).
> En CI el workflow solo comprueba el formato sin modificar nada (`--check`), por lo que
> el pipeline fallará si hay archivos sin formatear. Usa pre-commit localmente para
> asegurarte de que el código cumple el estilo antes de abrir una Pull Request.
