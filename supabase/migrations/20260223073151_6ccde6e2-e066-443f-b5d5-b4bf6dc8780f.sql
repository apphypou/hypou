-- Create 3 matches for the test user
-- Match 1: iPhone 16 vs iPhone 14 Pro Max (Ana Silva)
INSERT INTO matches (id, item_a_id, item_b_id, user_a_id, user_b_id, status)
VALUES (
  'a1111111-1111-1111-1111-111111111111',
  '84c44318-cb93-4c1d-9cdd-19db1a537815',
  'f53eb6a4-2f1f-4524-8a7a-4da628f602d6',
  '0e7bb54b-166d-492b-8586-7da454c3fa8a',
  '68a4ce2a-d8a7-4143-adb8-95a226d7e517',
  'pending'
);

-- Match 2: iPhone 16 vs PS5 (Pedro Oliveira)
INSERT INTO matches (id, item_a_id, item_b_id, user_a_id, user_b_id, status)
VALUES (
  'a2222222-2222-2222-2222-222222222222',
  '84c44318-cb93-4c1d-9cdd-19db1a537815',
  '1d122b95-2fd5-40f2-b98d-9993241a0938',
  '0e7bb54b-166d-492b-8586-7da454c3fa8a',
  '5c7971f1-d21a-4cef-824a-5a170de777c4',
  'pending'
);

-- Match 3: iPhone 16 vs Vestido Gucci (Juliana Costa) - accepted
INSERT INTO matches (id, item_a_id, item_b_id, user_a_id, user_b_id, status)
VALUES (
  'a3333333-3333-3333-3333-333333333333',
  '84c44318-cb93-4c1d-9cdd-19db1a537815',
  '9e223c43-752e-49f0-a457-7dffc0a435a5',
  '0e7bb54b-166d-492b-8586-7da454c3fa8a',
  '34af7b8a-222c-4279-96cd-315eb13b83d2',
  'accepted'
);

-- Create conversations for each match
INSERT INTO conversations (id, match_id) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111'),
  ('c2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222'),
  ('c3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333');

-- Messages for conversation 1 (Ana Silva)
INSERT INTO messages (conversation_id, sender_id, content, created_at) VALUES
  ('c1111111-1111-1111-1111-111111111111', '68a4ce2a-d8a7-4143-adb8-95a226d7e517', 'Oi! Vi que você tem um iPhone 16, tenho interesse! 😊', now() - interval '2 hours'),
  ('c1111111-1111-1111-1111-111111111111', '0e7bb54b-166d-492b-8586-7da454c3fa8a', 'Oi Ana! Tá em ótimo estado, comprei há 3 meses', now() - interval '1 hour 50 minutes'),
  ('c1111111-1111-1111-1111-111111111111', '68a4ce2a-d8a7-4143-adb8-95a226d7e517', 'Que legal! O meu iPhone 14 Pro Max tá perfeito também, posso te mandar mais fotos', now() - interval '1 hour 30 minutes'),
  ('c1111111-1111-1111-1111-111111111111', '0e7bb54b-166d-492b-8586-7da454c3fa8a', 'Manda sim! Vamos combinar a troca?', now() - interval '1 hour'),
  ('c1111111-1111-1111-1111-111111111111', '68a4ce2a-d8a7-4143-adb8-95a226d7e517', 'Bora! Podemos se encontrar no shopping?', now() - interval '30 minutes');

-- Messages for conversation 2 (Pedro Oliveira)
INSERT INTO messages (conversation_id, sender_id, content, created_at) VALUES
  ('c2222222-2222-2222-2222-222222222222', '0e7bb54b-166d-492b-8586-7da454c3fa8a', 'E aí Pedro, topa trocar pelo PS5?', now() - interval '5 hours'),
  ('c2222222-2222-2222-2222-222222222222', '5c7971f1-d21a-4cef-824a-5a170de777c4', 'Fala! Tenho interesse sim, o PS5 vem com os 3 jogos', now() - interval '4 hours'),
  ('c2222222-2222-2222-2222-222222222222', '0e7bb54b-166d-492b-8586-7da454c3fa8a', 'Perfeito! Tá tudo funcionando normal?', now() - interval '3 hours');

-- Messages for conversation 3 (Juliana Costa)
INSERT INTO messages (conversation_id, sender_id, content, created_at) VALUES
  ('c3333333-3333-3333-3333-333333333333', '34af7b8a-222c-4279-96cd-315eb13b83d2', 'Oi! Amei seu iPhone, aceito a troca! 🎉', now() - interval '1 day'),
  ('c3333333-3333-3333-3333-333333333333', '0e7bb54b-166d-492b-8586-7da454c3fa8a', 'Oba! Quando podemos combinar?', now() - interval '23 hours'),
  ('c3333333-3333-3333-3333-333333333333', '34af7b8a-222c-4279-96cd-315eb13b83d2', 'Pode ser sábado? Estou em BH', now() - interval '22 hours'),
  ('c3333333-3333-3333-3333-333333333333', '0e7bb54b-166d-492b-8586-7da454c3fa8a', 'Sábado tá ótimo! Te mando a localização depois', now() - interval '21 hours'),
  ('c3333333-3333-3333-3333-333333333333', '34af7b8a-222c-4279-96cd-315eb13b83d2', 'Combinado! 🤝', now() - interval '20 hours');