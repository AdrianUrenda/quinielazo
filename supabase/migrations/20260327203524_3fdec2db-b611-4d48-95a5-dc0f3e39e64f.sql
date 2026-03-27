-- Add jornada column to demo_matches
ALTER TABLE demo_matches ADD COLUMN IF NOT EXISTS jornada integer;

-- Make api_fixture_id have a default so manual inserts work
ALTER TABLE demo_matches ALTER COLUMN api_fixture_id SET DEFAULT 0;

-- Clear all existing demo data
DELETE FROM demo_predictions;
DELETE FROM demo_matches;

-- Insert Jornada 13 (Apr 3-5, 2026) - Times in UTC (CST+6)
INSERT INTO demo_matches (api_fixture_id, home_team, away_team, kickoff_utc, stadium, city, status, jornada) VALUES
(2601, 'Puebla', 'FC Juárez', '2026-04-04T01:00:00Z', 'Estadio Cuauhtémoc', 'Puebla', 'upcoming', 13),
(2602, 'Necaxa', 'Mazatlán FC', '2026-04-04T03:00:00Z', 'Estadio Victoria', 'Aguascalientes', 'upcoming', 13),
(2603, 'Club Tijuana', 'Tigres UANL', '2026-04-04T03:06:00Z', 'Estadio Caliente', 'Tijuana', 'upcoming', 13),
(2604, 'Querétaro', 'Toluca', '2026-04-04T23:00:00Z', 'Estadio Corregidora', 'Querétaro', 'upcoming', 13),
(2605, 'Monterrey', 'Atlético San Luis', '2026-04-04T23:00:00Z', 'Estadio BBVA', 'Monterrey', 'upcoming', 13),
(2606, 'León', 'Atlas', '2026-04-05T01:00:00Z', 'Estadio León', 'León', 'upcoming', 13),
(2607, 'Cruz Azul', 'Pachuca', '2026-04-05T01:00:00Z', 'Estadio Cuauhtémoc', 'Ciudad de México', 'upcoming', 13),
(2608, 'Santos Laguna', 'América', '2026-04-05T03:00:00Z', 'Estadio Corona', 'Torreón', 'upcoming', 13),
(2609, 'Guadalajara', 'Pumas UNAM', '2026-04-06T03:07:00Z', 'Estadio Akron', 'Guadalajara', 'upcoming', 13);

-- Insert Jornada 14 (Apr 10-12, 2026)
INSERT INTO demo_matches (api_fixture_id, home_team, away_team, kickoff_utc, stadium, city, status, jornada) VALUES
(2610, 'Puebla', 'León', '2026-04-11T02:00:00Z', 'Estadio Cuauhtémoc', 'Puebla', 'upcoming', 14),
(2611, 'FC Juárez', 'Club Tijuana', '2026-04-11T04:06:00Z', 'Estadio Olímpico Benito Juárez', 'Ciudad Juárez', 'upcoming', 14),
(2612, 'Tigres UANL', 'Guadalajara', '2026-04-12T00:00:00Z', 'Estadio Universitario', 'Monterrey', 'upcoming', 14),
(2613, 'Querétaro', 'Necaxa', '2026-04-12T00:00:00Z', 'Estadio Corregidora', 'Querétaro', 'upcoming', 14),
(2614, 'Atlas', 'Monterrey', '2026-04-12T02:00:00Z', 'Estadio Jalisco', 'Guadalajara', 'upcoming', 14),
(2615, 'Pachuca', 'Santos Laguna', '2026-04-12T02:00:00Z', 'Estadio Hidalgo', 'Pachuca', 'upcoming', 14),
(2616, 'América', 'Cruz Azul', '2026-04-12T04:00:00Z', 'Estadio Ciudad de los Deportes', 'Ciudad de México', 'upcoming', 14),
(2617, 'Pumas UNAM', 'Mazatlán FC', '2026-04-12T19:00:00Z', 'Estadio Olímpico Universitario', 'Ciudad de México', 'upcoming', 14),
(2618, 'Toluca', 'Atlético San Luis', '2026-04-13T02:00:00Z', 'Estadio Nemesio Díez', 'Toluca', 'upcoming', 14);

-- Insert Jornada 15 (Apr 17-19, 2026)
INSERT INTO demo_matches (api_fixture_id, home_team, away_team, kickoff_utc, stadium, city, status, jornada) VALUES
(2619, 'Mazatlán FC', 'Querétaro', '2026-04-18T02:00:00Z', 'Estadio El Encanto', 'Mazatlán', 'upcoming', 15),
(2620, 'Atlético San Luis', 'Pumas UNAM', '2026-04-18T02:00:00Z', 'Estadio Libertad Financiera', 'San Luis Potosí', 'upcoming', 15),
(2621, 'Necaxa', 'Tigres UANL', '2026-04-18T04:00:00Z', 'Estadio Victoria', 'Aguascalientes', 'upcoming', 15),
(2622, 'Cruz Azul', 'Club Tijuana', '2026-04-19T00:00:00Z', 'Estadio Cuauhtémoc', 'Ciudad de México', 'upcoming', 15),
(2623, 'Monterrey', 'Pachuca', '2026-04-19T02:00:00Z', 'Estadio BBVA', 'Monterrey', 'upcoming', 15),
(2624, 'Guadalajara', 'Puebla', '2026-04-19T02:07:00Z', 'Estadio Akron', 'Guadalajara', 'upcoming', 15),
(2625, 'León', 'FC Juárez', '2026-04-19T04:00:00Z', 'Estadio León', 'León', 'upcoming', 15),
(2626, 'América', 'Toluca', '2026-04-19T04:00:00Z', 'Estadio Ciudad de los Deportes', 'Ciudad de México', 'upcoming', 15),
(2627, 'Santos Laguna', 'Atlas', '2026-04-20T00:00:00Z', 'Estadio Corona', 'Torreón', 'upcoming', 15);

-- Insert Jornada 16 (Apr 21-22, 2026)
INSERT INTO demo_matches (api_fixture_id, home_team, away_team, kickoff_utc, stadium, city, status, jornada) VALUES
(2628, 'Pumas UNAM', 'FC Juárez', '2026-04-22T02:00:00Z', 'Estadio Olímpico Universitario', 'Ciudad de México', 'upcoming', 16),
(2629, 'Querétaro', 'Cruz Azul', '2026-04-22T02:00:00Z', 'Estadio Corregidora', 'Querétaro', 'upcoming', 16),
(2630, 'Monterrey', 'Puebla', '2026-04-22T04:00:00Z', 'Estadio BBVA', 'Monterrey', 'upcoming', 16),
(2631, 'León', 'América', '2026-04-22T04:06:00Z', 'Estadio León', 'León', 'upcoming', 16),
(2632, 'Atlas', 'Tigres UANL', '2026-04-23T02:00:00Z', 'Estadio Jalisco', 'Guadalajara', 'upcoming', 16),
(2633, 'Atlético San Luis', 'Santos Laguna', '2026-04-23T02:00:00Z', 'Estadio Libertad Financiera', 'San Luis Potosí', 'upcoming', 16),
(2634, 'Mazatlán FC', 'Toluca', '2026-04-23T02:00:00Z', 'Estadio El Encanto', 'Mazatlán', 'upcoming', 16),
(2635, 'Necaxa', 'Guadalajara', '2026-04-23T04:00:00Z', 'Estadio Victoria', 'Aguascalientes', 'upcoming', 16),
(2636, 'Club Tijuana', 'Pachuca', '2026-04-23T04:00:00Z', 'Estadio Caliente', 'Tijuana', 'upcoming', 16);

-- Insert Jornada 17 (Apr 24-26, 2026)
INSERT INTO demo_matches (api_fixture_id, home_team, away_team, kickoff_utc, stadium, city, status, jornada) VALUES
(2637, 'Puebla', 'Querétaro', '2026-04-25T04:00:00Z', 'Estadio Cuauhtémoc', 'Puebla', 'upcoming', 17),
(2638, 'Pachuca', 'Pumas UNAM', '2026-04-26T00:00:00Z', 'Estadio Hidalgo', 'Pachuca', 'upcoming', 17),
(2639, 'Tigres UANL', 'Mazatlán FC', '2026-04-26T00:00:00Z', 'Estadio Universitario', 'Monterrey', 'upcoming', 17),
(2640, 'Toluca', 'León', '2026-04-26T02:00:00Z', 'Estadio Nemesio Díez', 'Toluca', 'upcoming', 17),
(2641, 'Guadalajara', 'Club Tijuana', '2026-04-26T02:07:00Z', 'Estadio Akron', 'Guadalajara', 'upcoming', 17),
(2642, 'América', 'Atlas', '2026-04-26T04:00:00Z', 'Estadio Ciudad de los Deportes', 'Ciudad de México', 'upcoming', 17),
(2643, 'FC Juárez', 'Atlético San Luis', '2026-04-26T04:00:00Z', 'Estadio Olímpico Benito Juárez', 'Ciudad Juárez', 'upcoming', 17),
(2644, 'Santos Laguna', 'Monterrey', '2026-04-27T00:00:00Z', 'Estadio Corona', 'Torreón', 'upcoming', 17),
(2645, 'Cruz Azul', 'Necaxa', '2026-04-27T02:00:00Z', 'Estadio Cuauhtémoc', 'Ciudad de México', 'upcoming', 17);