alter table app_user
   add column password_hash varchar(255);

update app_user
set password_hash = '{noop}temporary-password'
where password_hash is null;

alter table app_user
   alter column password_hash set not null;
