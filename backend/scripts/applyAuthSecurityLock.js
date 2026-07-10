import { DataTypes } from 'sequelize';
import { sequelize } from '../src/config/database.js';

async function ensureColumn(queryInterface, table, tableDefinition, columnName, definition) {
  if (tableDefinition[columnName]) {
    console.log(`[OK] ${table}.${columnName} already exists.`);
    return;
  }

  await queryInterface.addColumn(table, columnName, definition);
  console.log(`[OK] Added ${table}.${columnName}.`);
}

async function main() {
  const queryInterface = sequelize.getQueryInterface();
  const usersTable = await queryInterface.describeTable('users');

  await ensureColumn(queryInterface, 'users', usersTable, 'failed_login_attempts', {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  });

  await ensureColumn(queryInterface, 'users', usersTable, 'total_failed_login_attempts', {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  });

  await ensureColumn(queryInterface, 'users', usersTable, 'failed_login_window_started_at', {
    type: DataTypes.DATE,
    allowNull: true,
  });

  await ensureColumn(queryInterface, 'users', usersTable, 'locked_until', {
    type: DataTypes.DATE,
    allowNull: true,
  });

  await sequelize.query(
    'UPDATE users SET failed_login_attempts = 0 WHERE failed_login_attempts IS NULL'
  );

  await sequelize.query(
    `UPDATE users
     SET total_failed_login_attempts = failed_login_attempts
     WHERE total_failed_login_attempts = 0
       AND failed_login_attempts > 0`
  );

  console.log('[OK] Auth security lock snake_case schema is ready.');
}

main()
  .catch((error) => {
    console.error('[ERROR] Failed to apply auth security lock schema.');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
