insert into public.categories (slug, name) values
  ('legislacao-fiscal', 'Legislação Fiscal'),
  ('reforma-tributaria', 'Reforma Tributária'),
  ('sistemas-contabeis', 'Sistemas Contábeis'),
  ('sistema-dominio', 'Sistema Domínio'),
  ('rotinas-e-prazos', 'Rotinas e Prazos'),
  ('mercado-e-carreira', 'Mercado e Carreira'),
  ('ferramentas-do-hub', 'Ferramentas do Hub')
on conflict (slug) do update set name = excluded.name;

-- Opcional: execute somente depois de promover a própria conta a admin.
-- Os textos abaixo são fictícios e servem apenas para testar o layout.
-- insert into public.posts
--   (slug, title, summary, content_md, category_id, status, published_at, author_id)
-- values
--   (
--     'exemplo-layout-noticia-1',
--     '[EXEMPLO] Notícia de demonstração 1',
--     'Texto genérico para testar a apresentação da lista de notícias.',
--     'EXEMPLO: este texto serve somente para testar o layout. Não contém informação contábil ou fiscal.',
--     (select id from public.categories where slug = 'ferramentas-do-hub'),
--     'published', now(),
--     (select id from public.profiles where role = 'admin' limit 1)
--   ),
--   (
--     'exemplo-layout-noticia-2',
--     '[EXEMPLO] Notícia de demonstração 2',
--     'Mais um texto genérico para conferir o visual de uma notícia publicada.',
--     'EXEMPLO: este conteúdo existe apenas para testar o layout e não apresenta orientações profissionais.',
--     (select id from public.categories where slug = 'sistemas-contabeis'),
--     'published', now(),
--     (select id from public.profiles where role = 'admin' limit 1)
--   ),
--   (
--     'exemplo-layout-noticia-3',
--     '[EXEMPLO] Notícia de demonstração 3',
--     'Um terceiro texto fictício para verificar os elementos visuais do portal.',
--     'EXEMPLO: conteúdo genérico para testar o layout. Nenhuma afirmação contábil ou fiscal é feita aqui.',
--     (select id from public.categories where slug = 'rotinas-e-prazos'),
--     'published', now(),
--     (select id from public.profiles where role = 'admin' limit 1)
--   );
