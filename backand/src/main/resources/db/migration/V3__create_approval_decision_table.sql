create table approval_decision (
   id          bigserial primary key,
   document_id bigint not null,
   decided_by  bigint not null,
   decision    varchar(50) not null,
   comment     text,
   decided_at  timestamp not null default current_timestamp,
   constraint fk_approval_decision_document
      foreign key (document_id) references document(id),
   constraint fk_approval_decision_decided_by
      foreign key (decided_by) references app_user(id)
);
