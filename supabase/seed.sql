-- =============================================
-- SEED DATA: Global Categories
-- =============================================
INSERT INTO public.categories (name, name_gl, icon_name, color) VALUES
  ('Restaurant', 'Restaurante', 'utensils', '#ef4444'),
  ('Bar', 'Bar', 'beer', '#f97316'),
  ('Cafeteria', 'Cafeteria', 'coffee', '#84cc16'),
  ('Parc', 'Parque', 'trees', '#22c55e'),
  ('Platja', 'Praia', 'umbrella-beach', '#06b6d4'),
  ('Museu', 'Museo', 'building-columns', '#8b5cf6'),
  ('Cinema', 'Cine', 'film', '#ec4899'),
  ('Teatre', 'Teatro', 'masks-theater', '#f43f5e'),
  ('Botiga', 'Tenda', 'shopping-bag', '#14b8a6'),
  ('Altres', 'Outros', 'map-pin', '#6b7280');

-- =============================================
-- SEED DATA: Badges
-- =============================================
INSERT INTO public.badges (code, name_ca, name_gl, description_ca, description_gl, icon_name, threshold_type, threshold_value) VALUES
  -- Photo badges
  ('first_photo', 'Primera foto', 'Primeira foto', 'Has pujat la teva primera foto!', 'Subiches a tua primeira foto!', 'camera', 'photos', 1),
  ('photo_5', 'Fotograf amateur', 'Fotografo amateur', 'Has pujat 5 fotos', 'Subiches 5 fotos', 'camera', 'photos', 5),
  ('photo_25', 'Fotograf entusiasta', 'Fotografo entusiasta', 'Has pujat 25 fotos', 'Subiches 25 fotos', 'camera', 'photos', 25),
  ('photo_100', 'Fotograf expert', 'Fotografo experto', 'Has pujat 100 fotos!', 'Subiches 100 fotos!', 'award', 'photos', 100),

  -- Place badges
  ('first_place', 'Primer lloc', 'Primeiro lugar', 'Has afegit el teu primer lloc!', 'Engadiches o teu primeiro lugar!', 'map-pin', 'places', 1),
  ('place_5', 'Explorador', 'Explorador', 'Has afegit 5 llocs', 'Engadiches 5 lugares', 'compass', 'places', 5),
  ('place_25', 'Descobridor', 'Descubridor', 'Has afegit 25 llocs', 'Engadiches 25 lugares', 'map', 'places', 25),

  -- Participation badges
  ('first_week', 'Primera setmana', 'Primeira semana', 'Has participat en el teu primer recap!', 'Participaches no teu primeiro recap!', 'calendar', 'weeks', 1),
  ('weeks_4', 'Regular', 'Regular', 'Has participat 4 setmanes', 'Participaches 4 semanas', 'calendar-check', 'weeks', 4),
  ('weeks_12', 'Veterano', 'Veterano', 'Has participat 12 setmanes (3 mesos!)', 'Participaches 12 semanas (3 meses!)', 'trophy', 'weeks', 12),

  -- Special badges
  ('group_creator', 'Fundador', 'Fundador', 'Has creat un grup', 'Creaches un grupo', 'users', NULL, NULL),
  ('top_contributor', 'Top Contributor', 'Top Contributor', 'Has estat el top contributor de la setmana', 'Fuches o top contributor da semana', 'crown', NULL, NULL);

-- =============================================
-- SEED DATA: Reminder Messages (Catalan)
-- =============================================
INSERT INTO public.reminder_messages (locale, title, body, time_window) VALUES
  -- Morning (06:00-14:00)
  ('ca', 'Bon dia!', 'Que fas avui? Comparteix-ho amb el grup!', 'morning'),
  ('ca', 'Feina feta!', 'Si fas algo interessant, no oblidis fer foto!', 'morning'),
  ('ca', 'Bon dia, amic!', 'Alguna quedada avui? El grup vol saber!', 'morning'),
  ('ca', 'Matinet!', 'Avui esmorzem junts o que?', 'morning'),
  ('ca', 'Hola!', 'Tens plans? Proposa algo al grup!', 'morning'),

  -- Afternoon (14:00-22:00)
  ('ca', 'Tarda tranquila?', 'O tens algo entre mans? Comparteix-ho!', 'afternoon'),
  ('ca', 'Ei!', 'Que tal el dia? Alguna foto per pujar?', 'afternoon'),
  ('ca', 'Bones tardes!', 'Algun pla per aquest cap de setmana?', 'afternoon'),
  ('ca', 'Tardeo?', 'Si esteu fent algo, el grup vol veure-ho!', 'afternoon'),
  ('ca', 'Hola!', 'Has descobert algun lloc nou? Afegeix-lo al mapa!', 'afternoon'),

  -- Night (22:00-06:00)
  ('ca', 'Bona nit!', 'Com ha anat el dia? Tens fotos per compartir?', 'night'),
  ('ca', 'Ei nocturn!', 'Sortida nocturna? No oblidis les fotos!', 'night'),
  ('ca', 'Nit de canya?', 'Si esteu de festa, el recap ho vol saber!', 'night'),
  ('ca', 'Bona nit!', 'Demà ens veurem? Proposa algo!', 'night'),
  ('ca', 'Nocturno!', 'Algun lloc nou per afegir al mapa?', 'night');

-- =============================================
-- SEED DATA: Reminder Messages (Galician)
-- =============================================
INSERT INTO public.reminder_messages (locale, title, body, time_window) VALUES
  -- Morning (06:00-14:00)
  ('gl', 'Bo dia!', 'Que fas hoxe? Comparteo co grupo!', 'morning'),
  ('gl', 'Traballo feito!', 'Se fas algo interesante, non esquezas facer foto!', 'morning'),
  ('gl', 'Bo dia, amigo!', 'Algunha quedada hoxe? O grupo quere saber!', 'morning'),
  ('gl', 'Madrugueiro!', 'Hoxe almoramos xuntos ou que?', 'morning'),
  ('gl', 'Ola!', 'Tes plans? Propón algo ao grupo!', 'morning'),

  -- Afternoon (14:00-22:00)
  ('gl', 'Tarde tranquila?', 'Ou tes algo entre mans? Comparteo!', 'afternoon'),
  ('gl', 'Ei!', 'Que tal o dia? Algunha foto para subir?', 'afternoon'),
  ('gl', 'Boas tardes!', 'Algun plan para esta fin de semana?', 'afternoon'),
  ('gl', 'Tardeo?', 'Se estades facendo algo, o grupo quere velo!', 'afternoon'),
  ('gl', 'Ola!', 'Descubriches algun lugar novo? Engadeo ao mapa!', 'afternoon'),

  -- Night (22:00-06:00)
  ('gl', 'Boa noite!', 'Como foi o dia? Tes fotos para compartir?', 'night'),
  ('gl', 'Ei nocturno!', 'Saida nocturna? Non esquezas as fotos!', 'night'),
  ('gl', 'Noite de cana?', 'Se estades de festa, o recap quereo saber!', 'night'),
  ('gl', 'Boa noite!', 'Manana vemonos? Propón algo!', 'night'),
  ('gl', 'Nocturno!', 'Algun lugar novo para engadir ao mapa?', 'night');
