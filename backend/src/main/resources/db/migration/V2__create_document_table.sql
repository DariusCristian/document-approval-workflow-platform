create table document (
   id         bigserial primary key,
   title      varchar(255) not null,
   content    text not null,
   status     varchar(50) not null,
   created_by bigint not null,
   created_at timestamp not null default current_timestamp,
   constraint fk_document_created_by
      foreign key (created_by) references app_user(id)
);
