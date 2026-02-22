-- Fix iPhone 16 price: was stored as centavos (450000), should be reais (4500)
UPDATE items SET market_value = 4500 WHERE id = '84c44318-cb93-4c1d-9cdd-19db1a537815' AND market_value = 450000;