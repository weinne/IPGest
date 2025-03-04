FROM mcr.microsoft.com/vscode/devcontainers/base:ubuntu-20.04

# Instala o PostgreSQL
RUN apt-get update && \
    apt-get install -y postgresql postgresql-contrib

# Configura o PostgreSQL
USER postgres
RUN /etc/init.d/postgresql start && \
    psql --command "CREATE USER postgres WITH SUPERUSER PASSWORD 'postgres';" && \
    createdb ipgest_db

# Define o usuário de volta para vscode
USER vscode

# Instala dependências do Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_14.x | sudo -E bash - && \
    apt-get install -y nodejs

# Define o diretório de trabalho
WORKDIR /workspace
