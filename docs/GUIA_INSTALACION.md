# Guía de Instalación - Memento

## Tabla de Contenidos

1. [Requisitos de Hardware](#requisitos-de-hardware)
2. [Requisitos de Software](#requisitos-de-software)
3. [Instalación de Prerrequisitos](#instalación-de-prerrequisitos)
4. [Configuración del Proyecto](#configuración-del-proyecto)
5. [Despliegue](#despliegue)
6. [Acceso a la Aplicación](#acceso-a-la-aplicación)
7. [Dominio y Acceso Seguro (DuckDNS + Nginx)](#dominio-y-acceso-seguro-duckdns--nginx)
8. [Configuración de APIs Externas (Opcional)](#configuración-de-apis-externas-opcional)
9. [Troubleshooting](#troubleshooting)
10. [Comandos Útiles](#comandos-útiles)

## Requisitos de Hardware

Los requisitos de hardware mínimos son los siguientes:

- **GPU NVIDIA**: 4GB VRAM mínimo (para usar Ollama local)
- **RAM**: 16GB
- **Almacenamiento**: ~30GB disponibles (imágenes Docker + modelos)

**Nota**: Si tu GPU tiene menos de 4GB VRAM, puedes usar APIs externas (OpenAI/Anthropic) en lugar de Ollama local. Ver [Configuración de APIs Externas](#configuración-de-apis-externas-opcional).

## Requisitos de Software

- **Sistema Operativo**: Ubuntu 25.10
- **CUDA**: 12.8
- **Docker**: 20.10 o superior
- **Docker Compose**: 2.0 o superior
- **NVIDIA Container Toolkit**

## Instalación de Prerrequisitos

### 1. Docker

```bash
# Instalar Docker
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-v2

# Añadir tu usuario al grupo docker (evita usar sudo)
sudo usermod -aG docker $USER
newgrp docker
```

### 2. NVIDIA Container Toolkit

Permite a los contenedores Docker acceder a la GPU NVIDIA.

```bash
# Configurar el repositorio
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey \
  | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg

curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list \
  | sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' \
  | sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list

# Instalar
sudo apt-get update
sudo apt-get install -y nvidia-container-toolkit

# Configurar el runtime NVIDIA para Docker
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker
```

### 3. Verificar Instalación

```bash
# Verificar que la GPU es visible
nvidia-smi

# Verificar que Docker puede usar la GPU
docker run --rm --runtime=nvidia --gpus all nvidia/cuda:12.8.0-base-ubuntu22.04 nvidia-smi
```

Si ambos comandos muestran información de la GPU, la instalación es correcta.

## Configuración del Proyecto

### 1. Clonar el Repositorio

```bash
git clone <url-del-repositorio>
```

### 2. Archivos de Entorno

El proyecto usa dos archivos `.env`:

#### `.env` (raíz del proyecto)

Crea un fichero denominado `.env` en la raíz del proyecto:

Copia la plantilla y edita:

```bash
touch .env
```
Edítalo dando valores a las siguientes variables de entorno:

```env
FRONTEND_PORT=5173
BACKEND_PORT=8000

MONGO_HOST=mongo_db
MONGO_USER=mongo
MONGO_PASSWORD=mongo
MONGO_PORT=27017

OLLAMA_HOST=ollama
OLLAMA_PORT=11434

CHROMA_HOST=chromadb
CHROMA_PORT=8000
RAG_EMBEDDING_MODEL=nomic-embed-text
RAG_COLLECTION_NAME=meetings

DOMAIN=tu-dominio.duckdns.org
```

> Cambia `MONGO_USER` y `MONGO_PASSWORD` en producción.

#### `Backend/.env`

Crea el archivo:

```bash
touch Backend/.env
```

Editalo con las siguientes variables de entorno `Backend/.env`:

```env
HF_TOKEN=tu_huggingface_token

ENCRYPTION_KEY="genera_clave_aleatoria_base64"
SECRET_KEY="genera_clave_hex_64_caracteres"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=1800000

ACCOUNT_DELETION_GRACE_DAYS=30
PRIVACY_CONTACT_EMAIL=privacidad@tu-dominio.com
ACCOUNT_PURGE_JOB_INTERVAL_SECONDS=3600
ACCOUNT_PURGE_JOB_ENABLED=true

OPENAI_KEY=sk-placeholder

MONGO_USER=mongo
MONGO_HOST=mongo_db
MONGO_PASSWORD=mongo
MONGO_PORT=27017
CHROMA_HOST=chromadb
CHROMA_PORT=8000
RAG_EMBEDDING_MODEL=nomic-embed-text
RAG_COLLECTION_NAME=meetings
```

Genera las claves de seguridad:

```bash
# ENCRYPTION_KEY (32 bytes en base64)
python3 -c "import secrets, base64; print(base64.urlsafe_b64encode(secrets.token_bytes(32)).decode())"

# SECRET_KEY (64 caracteres hex)
python3 -c "import secrets; print(secrets.token_hex(32))"
```

Obtén tu API key en [Hugging Face](https://huggingface.co/settings/tokens).

## Despliegue

```bash
docker compose up -d --build
```

Al iniciar, el servicio de Ollama descarga automáticamente los modelos por defecto:
- `llama3.2:latest` — modelo de lenguaje seleccionado por defecto para todos los usuarios 
- `nomic-embed-text` — modelo de embeddings para RAG

La primera ejecución puede tardar varios minutos mientras se descargan las imágenes y los modelos.

### Verificar Estado

```bash
docker compose ps
```

Todos los servicios deben mostrar estado `Up` o `healthy`. Si un servicio no arranca, revisa los logs:

```bash
docker compose logs -f <nombre-servicio>
```

## Acceso a la Aplicación

| Servicio              | URL                       |
|-----------------------|---------------------------|
| Frontend              | http://localhost:5173      |
| Backend API           | http://localhost:8000      |
| Documentación API     | http://localhost:8000/docs |
| Nginx Proxy Manager   | http://localhost:81        |

### Primer Uso

1. Abre http://localhost:5173
2. Registra una cuenta de usuario
3. Configura los proveedores de IA en Ajustes
4. ¡Comienza a usar Memento!

## Dominio y Acceso Seguro (DuckDNS + Nginx)

Para acceder a Memento desde internet con HTTPS necesitas un dominio. DuckDNS ofrece subdominios gratuitos, y Nginx Proxy Manager gestiona el proxy inverso y los certificados SSL automáticamente.

### 1. Obtener un Subdominio en DuckDNS

1. Regístrate en [duckdns.org](https://www.duckdns.org/)
2. Crea un subdominio (ej. `memento.duckdns.org`) y haz clic en **add domain**
3. Copia el **token** que aparece en la parte superior de la página (lo necesitarás para actualizar la IP)

### 2. Configurar el Dominio

El dominio se configura en el archivo `.env` raíz. Edita la variable `DOMAIN` con tu subdominio:

```env
DOMAIN=tu-dominio.duckdns.org
```

Si despliegas en local, usa `DOMAIN=localhost`.

Reconstruye el frontend tras el cambio:

```bash
docker compose up -d --build frontend
```

> **Consejo**: Para acceder de forma segura sin exponer puertos en tu router, usa un servicio de VPN como [Tailscale](https://tailscale.com/). Instálalo en tu máquina y en los dispositivos desde los que quieras conectarte, y accede a Memento mediante la IP de Tailscale o del servicio que estés utilizando.

### 3. Configurar Nginx Proxy Manager

#### 4.1 Acceder al Panel de Administración

Abre http://localhost:81 en tu navegador.

**Credenciales por defecto:**
- Email: `admin@example.com`
- Contraseña: `changeme`

Te pedirá cambiarlas en el primer inicio de sesión.

#### 4.2 Crear Proxy Host para el Frontend

1. Ve a **Hosts > Proxy Hosts** y haz clic en **Add Proxy Host**
2. Rellena los detalles:

   | Campo                        | Valor                        |
   |------------------------------|------------------------------|
   | Domain Names                 | `tu-dominio.duckdns.org`     |
   | Scheme                       | `http`                       |
   | Forward Hostname / IP        | `frontend`                   |
   | Forward Port                 | `5173`                       |
   | Cache Assets                 | Activado                     |
   | Block Common Exploits        | Activado                     |

3. Ve a la pestaña **SSL**:
   - **SSL Certificate**: selecciona "Request a new SSL Certificate"
   - **Force SSL**: Activado
   - **HTTP/2 Support**: Activado
   - **Email Address for Let's Encrypt**: tu email real
   - Marca "I Agree to the Let's Encrypt Terms of Service"

4. Haz clic en **Save**

#### 4.3 Crear Proxy Host para la API del Backend (opcional)

Repite el proceso para exponer la API:

| Campo                        | Valor                            |
|------------------------------|----------------------------------|
| Domain Names                 | `api.tu-dominio.duckdns.org`     |
| Scheme                       | `http`                           |
| Forward Hostname / IP        | `backend`                        |
| Forward Port                 | `8000`                           |
| Block Common Exploits        | Activado                         |

Configura SSL igual que en el paso anterior.

### 5. Verificar el Acceso

Abre `https://tu-dominio.duckdns.org` en un navegador. Deberías ver Memento con el candado verde HTTPS.

> **Nota**: Los certificados SSL de Let's Encrypt tardan unos segundos en generarse la primera vez. Si ves un error, espera un minuto y recarga.

---

## Configuración de APIs Externas (Opcional)

Si tu GPU no puede ejecutar modelos locales con el rendimiento deseado o simplemente deseas utilizar otros proveedores, puedes utilizar los modelos de OpenAI o Anthropic, añadiendo el API key correspondiente a través de la interfaz gráfica.

## Troubleshooting

### Error: "could not select device driver nvidia"

NVIDIA Container Toolkit no está configurado correctamente.

```bash
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker
```

### Error: "CUDA out of memory"

El modelo no cabe en la VRAM de tu GPU.

**Soluciones**:
- Usa un modelo más pequeño: `docker compose exec ollama ollama pull llama3.2:1b`
- Usa APIs externas (OpenAI/Anthropic) y desactiva Ollama
- Cierra otras aplicaciones que usen la GPU

### Ollama no descarga los modelos

Revisa los logs de Ollama durante el arranque:

```bash
docker compose logs ollama
```

Si hay un fallo de red o timeout, reintenta manualmente:

```bash
docker compose exec ollama ollama pull llama3.2:latest
docker compose exec ollama ollama pull nomic-embed-text
```

### MongoDB authentication failed

Asegura que `MONGO_USER` y `MONGO_PASSWORD` coinciden en ambos archivos `.env` (raíz y Backend).

**Nota**: Si cambias las credenciales después del primer despliegue, debes eliminar el volumen de MongoDB:

```bash
docker compose down -v mongo_db
docker compose up -d mongo_db
```

### Puerto en uso

Si los puertos 80, 443, 5173, 8000 u 8001 están ocupados, detén el servicio conflictivo o cambia los puertos en `.env`.

## Comandos Útiles

```bash
# Ver todos los logs en tiempo real
docker compose logs -f

# Logs de un servicio específico
docker compose logs -f backend

# Reiniciar un servicio
docker compose restart backend

# Detener todos los servicios
docker compose down

# Detener y eliminar volúmenes (¡borra datos!)
docker compose down -v

# Reconstruir contenedores tras cambios en el docker-compose.yaml
docker compose up -d --build

# Listar modelos disponibles en Ollama
docker compose exec ollama ollama list
```