# Aplicação React

- Preserve as três superfícies definidas em `docs/architecture/routing.md`.
- Páginas compõem interface; contratos de dados e regras reutilizáveis devem
  ficar em módulos de domínio com uma interface pequena e testável.
- Não espalhe chamadas Supabase em novas páginas quando já existir um módulo que
  representa o fluxo.
- Para mudanças de rota, adicione ou atualize testes de roteamento.
- Para mudanças visuais, preserve o Design System e valide os fluxos móveis.
