create table document_comment (
   id          bigserial primary key,
   document_id bigint not null,
   author_id   bigint not null,
   content     text not null,
   created_at  timestamp not null default current_timestamp,
   constraint fk_document_comment_document
      foreign key (document_id) references document(id),
   constraint fk_document_comment_author
      foreign key (author_id) references app_user(id)
);
