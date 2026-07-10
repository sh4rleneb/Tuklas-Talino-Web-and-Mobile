import { DataTypes } from 'sequelize';
import { sequelize } from '../src/config/database.js';

async function ensureColumn(
  queryInterface,
  table,
  tableDefinition,
  columnName,
  definition
) {
  if (tableDefinition[columnName]) {
    console.log(`[OK] ${table}.${columnName} already exists.`);
    return;
  }

  await queryInterface.addColumn(
    table,
    columnName,
    definition
  );

  console.log(`[OK] Added ${table}.${columnName}.`);
}

async function main() {
  const queryInterface = sequelize.getQueryInterface();
  const groupsTable =
    await queryInterface.describeTable('groups');

  await ensureColumn(
    queryInterface,
    'groups',
    groupsTable,
    'grade_level',
    {
      type: DataTypes.INTEGER,
      allowNull: true,
    }
  );

  await ensureColumn(
    queryInterface,
    'groups',
    groupsTable,
    'section',
    {
      type: DataTypes.STRING(80),
      allowNull: true,
    }
  );

  await sequelize.query(`
    UPDATE \`groups\` g
    JOIN (
      SELECT
        gm.group_id,
        MIN(s.grade_level) AS grade_level,
        COUNT(DISTINCT s.grade_level) AS grade_count
      FROM group_members gm
      JOIN students s
        ON s.id = gm.student_id
      GROUP BY gm.group_id
    ) member_grades
      ON member_grades.group_id = g.id
    SET g.grade_level = member_grades.grade_level
    WHERE g.grade_level IS NULL
      AND member_grades.grade_count = 1
  `);

  await sequelize.query(`
    UPDATE \`groups\` g
    SET g.section = TRIM(g.description)
    WHERE
      (g.section IS NULL OR TRIM(g.section) = '')
      AND g.description IS NOT NULL
      AND TRIM(g.description) <> ''
      AND EXISTS (
        SELECT 1
        FROM students s
        WHERE LOWER(TRIM(s.section)) =
          LOWER(TRIM(g.description))
      )
  `);

  const [mixedGradeGroups] = await sequelize.query(`
    SELECT
      g.id,
      g.name,
      GROUP_CONCAT(
        DISTINCT s.grade_level
        ORDER BY s.grade_level
      ) AS member_grades
    FROM \`groups\` g
    JOIN group_members gm
      ON gm.group_id = g.id
    JOIN students s
      ON s.id = gm.student_id
    GROUP BY g.id, g.name
    HAVING COUNT(DISTINCT s.grade_level) > 1
    ORDER BY g.id
  `);

  if (mixedGradeGroups.length) {
    console.warn(
      '[WARN] Existing mixed-grade groups require manual review:'
    );

    console.table(mixedGradeGroups);
  } else {
    console.log(
      '[OK] No existing mixed-grade groups were detected.'
    );
  }

  console.log(
    '[OK] Group grade and section schema is ready.'
  );
}

main()
  .catch((error) => {
    console.error(
      '[ERROR] Failed to apply group grade schema.'
    );
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
