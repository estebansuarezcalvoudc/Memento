FROM nvidia/cuda:12.8.0-cudnn-devel-ubuntu20.04

ENV DEBIAN_FRONTEND=noninteractive

RUN sed -i 's|http://archive.ubuntu.com/ubuntu/|http://es.archive.ubuntu.com/ubuntu/|g' /etc/apt/sources.list \
    && sed -i 's|http://security.ubuntu.com/ubuntu/|http://es.archive.ubuntu.com/ubuntu/|g' /etc/apt/sources.list

RUN apt-get update \
    && apt-get install -y \
    software-properties-common \
    gnupg \
    curl \
    wget \
    build-essential \
    ca-certificates

RUN add-apt-repository ppa:deadsnakes/ppa \
    && apt-get update \
    && apt-get install -y \
    python3.10 \
    python3.10-dev \
    python3.10-venv \
    python3.10-distutils \
    libcudnn8 \
    libcudnn8-dev \
    ffmpeg

RUN ln -s /usr/bin/python3.10 /usr/bin/python \
    && curl -sS https://bootstrap.pypa.io/get-pip.py | python

WORKDIR /Backend

COPY . .

RUN pip install --upgrade pip && pip install -r requirements.txt
RUN pip install debugpy

EXPOSE 8000
EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
