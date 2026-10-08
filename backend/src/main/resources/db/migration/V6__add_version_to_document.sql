-- Optimistic locking: Hibernate increases this number on every update of a document
-- and only updates the row if the number is still the one it read.
alter table document
   add column version bigint not null default 0;
