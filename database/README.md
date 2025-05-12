# Database Management Tools

This directory contains tools for managing the PostgreSQL database for the Property Mapping Platform.

## Setup

1. Install required Python packages:
   ```
   pip install psycopg2-binary python-dotenv faker
   ```

2. Create a `.env` file based on `.env.example` with your database credentials:
   ```
   cp .env.example .env
   ```

3. Edit the `.env` file with your PostgreSQL credentials.

## Database Manager Script

The `db_manager.py` script provides a command-line interface for managing the database.

### Available Commands

- **Create Database**:
  ```
  python db_manager.py create
  ```

- **Drop Database**:
  ```
  python db_manager.py drop
  ```

- **Run Migrations**:
  ```
  python db_manager.py migrate
  ```

- **Seed Test Data**:
  ```
  python db_manager.py seed
  ```

- **Backup Database**:
  ```
  python db_manager.py backup --file=backup_filename.sql
  ```

- **Restore Database**:
  ```
  python db_manager.py restore --file=backup_filename.sql
  ```

- **Execute Custom Query**:
  ```
  python db_manager.py query --query="SELECT * FROM users" --params='{"param1": "value1"}'
  ```

## Migrations

Database migrations are stored in the `migrations` directory as SQL files. They are applied in alphabetical order.

To create a new migration:

1. Create a new SQL file in the `migrations` directory with a name like `002_add_new_table.sql`.
2. Add your SQL statements to the file.
3. Run `python db_manager.py migrate` to apply the migration.

## Test Data

The seed command populates the database with test data:

- 10 users (including an admin user)
- 20 companies
- 50 properties

You can modify the seed functions in `db_manager.py` to generate different test data.

## Usage in Development

For local development, you can use this workflow:

1. Create the database: `python db_manager.py create`
2. Run migrations: `python db_manager.py migrate`
3. Seed test data: `python db_manager.py seed`

This will give you a fully populated database for development and testing.