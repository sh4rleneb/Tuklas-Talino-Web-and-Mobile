import { sequelize } from '../src/config/database.js';

const INDEX_NAME =
  'group_members_group_student_unique';

async function main() {
  const [duplicates] = await sequelize.query(`
    SELECT
      group_id,
      student_id,
      COUNT(*) AS duplicate_count
    FROM group_members
    GROUP BY group_id, student_id
    HAVING COUNT(*) > 1
  `);

  if (duplicates.length) {
    console.warn(
      '[WARN] Duplicate group memberships detected.'
    );
    console.table(duplicates);

    throw new Error(
      'Remove duplicate memberships before creating the unique index.'
    );
  }

  const [indexes] = await sequelize.query(`
    SHOW INDEX FROM group_members
  `);

  const hasUniqueIndex = indexes.some(
    (row) =>
      row.Key_name === INDEX_NAME &&
      Number(row.Non_unique) === 0
  );

  if (hasUniqueIndex) {
    console.log(
      `[OK] ${INDEX_NAME} already exists.`
    );
    return;
  }

  await sequelize.query(`
    ALTER TABLE group_members
    ADD CONSTRAINT ${INDEX_NAME}
    UNIQUE (group_id, student_id)
  `);

  console.log(
    `[OK] Added ${INDEX_NAME}.`
  );
}

main()
  .catch((error) => {
    console.error(
      '[ERROR] Failed to apply group-member unique index.'
    );
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
