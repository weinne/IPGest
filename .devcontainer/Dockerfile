FROM debian:12-slim

# Instala pacotes necessários
RUN apt-get update && \
    apt-get install -y postgresql postgresql-contrib sudo curl gnupg ca-certificates && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Configura o PostgreSQL
USER postgres
RUN /etc/init.d/postgresql start && \
    psql --command "ALTER USER postgres WITH PASSWORD 'postgres';" && \
    createdb ipgest_db

# Adiciona usuário vscode
USER root
RUN useradd -ms /bin/bash vscode && \
    echo "vscode ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/vscode && \
    chmod 0440 /etc/sudoers.d/vscode

# Instala Node.js ainda como root
RUN apt-get update && \
    apt-get install -y ca-certificates curl gnupg && \
    mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" > /etc/apt/sources.list.d/nodesource.list && \
    apt-get update && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Define o usuário de volta para vscode
USER vscode

# Define o diretório de trabalho
WORKDIR /workspace
