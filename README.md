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
> En CI el workflow también auto-corrige el formateo y hace un commit de vuelta a la
> rama (`style: auto-fix formatting [skip ci]`), por lo que si olvidas ejecutar
> pre-commit antes de hacer push, el CI lo arreglará por ti automáticamente.
> Los tests se ejecutan dentro de contenedores Docker ligeros para garantizar
> reproducibilidad sin necesitar hardware GPU.
