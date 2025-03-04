# IPGest

Gestão simplificada para igrejas presbiterianas.

## Description

IPGest is a simplified management system for Presbyterian churches. The project aims to streamline administrative tasks and processes for church management.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/)

### Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/weinne/IPGest.git
    ```
2. Navigate to the project directory:
    ```sh
    cd IPGest
    ```
3. Install dependencies:
    ```sh
    npm install
    ```

### Usage

1. Start the development server:
    ```sh
    npm run dev
    ```
2. Open your browser and go to `http://localhost:3000`.

## Contributing

We welcome contributions! Please follow these steps to contribute:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/YourFeature`).
3. Commit your changes (`git commit -m 'Add some feature'`).
4. Push to the branch (`git push origin feature/YourFeature`).
5. Open a pull request.

## Melhorias Recomendadas

### 1. Arquitetura e Organização
- Adotar padrão de arquitetura limpa (Clean Architecture)
- Implementar camadas bem definidas (Apresentação, Aplicação, Domínio, Infraestrutura)
- Aplicar o princípio de dependências direcionadas para o centro
- Reorganizar estrutura de diretórios
  - Separar módulos por domínio de negócio
  - Manter consistência na nomenclatura de pastas e arquivos

### 2. Padrões e Práticas de Código
- Implementar SOLID
  - Refatorar classes grandes aplicando Princípio de Responsabilidade Única
  - Utilizar interfaces para inversão de dependência
- Padronizar tratamento de erros
  - Implementar middleware global para exceções
  - Criar padrão consistente de mensagens de erro

### 3. Testes e Qualidade
- Aumentar cobertura de testes
  - Implementar testes unitários para regras de negócio
  - Adicionar testes de integração para APIs
- Adicionar ferramentas de qualidade
  - Implementar análise estática de código
  - Configurar CI/CD com verificações automáticas

### 4. Segurança e Performance
- Revisar práticas de segurança
  - Implementar autenticação e autorização robustas
  - Proteger endpoints contra ataques comuns
- Otimizar performance
  - Implementar cache onde apropriado
  - Otimizar consultas ao banco de dados

### 5. Documentação
- Melhorar documentação
  - Documentar APIs com Swagger/OpenAPI
  - Criar documentação de arquitetura e componentes

## Proposta de Ação Imediata
Recomendo iniciar pelas seguintes ações de alta prioridade:
- Refatoração da arquitetura para separação clara de responsabilidades
- Implementação de testes unitários nas regras de negócio críticas
- Padronização do tratamento de erros e logging

## License

This project does not currently have a license. Please contact the repository owner for more information.

## Contributors

- [weinne](https://github.com/weinne)

---

Feel free to review and suggest any additional information or corrections.
