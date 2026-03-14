create table app_user (
   id         bigserial primary key,
   email      varchar(255) not null unique,
   full_name  varchar(255) not null,
   role_name  varchar(50) not null,
   created_at timestamp not null default current_timestamp
);