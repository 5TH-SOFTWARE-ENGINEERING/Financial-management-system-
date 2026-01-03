The frontend/app/project directory is the core module for Project Management within the application. It provides a full suite of tools for tracking and organizing company initiatives.

Based on the structure, its primary functions are:

1. Project Management Dashboard (/list)
This is the main entry point where users can oversee all projects. Key features include:

Centralized View: A table-based display showing project names, assigned departments, budgets, and status.
Dynamic Filtering: The ability to narrow down the list by Department or Project Status (Active vs. Inactive).
Real-time Search: A search bar to quickly find projects by name, description, or department keywords.
Data Export: A recently added function that allows administrators to download the filtered project list as a CSV file for external reporting.
2. Project Lifecycle Control (/create & /edit)
These sections handle the "CRUD" (Create, Read, Update, Delete) operations for projects:

Project Creation: A dedicated form to input new project details such as:
Name and Description
Budget Allocation
Departmental Assignment
Project Timeline (Start and End Dates)
Project Modification: A dynamic editing interface (/edit/[id]) to update existing projects as their status or budget requirements change.
3. Organizational Alignment
The project module serves as a bridge between Departments and Finances, allowing the company to see how resources (Budget) are being consumed across different organizational units (Departments).