# Document Approval & Workflow Platform

A full-stack document approval platform for managing document lifecycles, review workflows, approval decisions, and collaboration.

## Features

- User authentication with Spring Security
- Role-based access control
- Document creation and listing
- Document detail view
- Workflow status transitions
- Approval and rejection decisions
- Approval history per document
- Document comments
- Request validation and global error handling
- Persistent storage with PostgreSQL
- Database versioning with Flyway
- React frontend with protected routes and auth-aware flows

## Tech Stack

### Backend
- Java 21
- Spring Boot
- Spring Security
- Spring Data JPA
- PostgreSQL
- Flyway
- Gradle

### Frontend
- React
- TypeScript
- Vite
- React Router

## Project Structure

```text
DocumentApproval&WorkflowPlatform/
  backand/
    src/
    build.gradle
    ...
  frontend/
    src/
    package.json
    ...
