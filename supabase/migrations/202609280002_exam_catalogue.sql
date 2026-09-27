begin;
alter table public.examinations add column if not exists name_hi text;
alter table public.examinations add column if not exists display_order integer not null default 100;
-- Reuse canonical slugs and existing ids. Do not overwrite publication decisions.
insert into public.examinations(slug,name,is_public) values
 ('gate-life-sciences','GATE Life Sciences',true),
 ('icmr-bret','ICMR BRET',true),
 ('iit-jam-biotechnology','IIT JAM Biotechnology',true)
on conflict(slug) do nothing;
insert into public.courses(examination_id,slug,title,launch_status,is_public)
select id,slug,name,'coming_soon',true from public.examinations
where slug in ('gate-life-sciences','icmr-bret','iit-jam-biotechnology')
on conflict(slug) do nothing;
update public.examinations e set name_hi=v.hi, display_order=v.position
from (values
 ('gat-b','GAT-B',1),('csir-net','CSIR-UGC NET जीवन विज्ञान',2),('cuet-pg','CUET-PG',3),
 ('dbt-bet','DBT-BET',4),('gate-biotechnology','GATE जैव प्रौद्योगिकी',5),
 ('gate-life-sciences','GATE जीवन विज्ञान',6),('icmr-bret','ICMR BRET',7),
 ('iit-jam-biotechnology','IIT JAM जैव प्रौद्योगिकी',8),('phd-entrances','संबंधित पीएचडी प्रवेश परीक्षाएँ',9)
) as v(slug,hi,position) where e.slug=v.slug;
commit;
